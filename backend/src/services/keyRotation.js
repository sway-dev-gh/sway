/**
 * Enterprise Key Rotation Service
 * Provides secure, automated rotation of encryption keys
 * Ensures zero-downtime key rollover with backwards compatibility
 */

const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const pool = require('../db/pool')

class KeyRotationService {
  constructor() {
    this.activeKeys = new Map()
    this.keyHistory = new Map()
    this.rotationIntervals = {
      jwt: 30 * 24 * 60 * 60 * 1000,        // 30 days
      encryption: 90 * 24 * 60 * 60 * 1000, // 90 days
      session: 7 * 24 * 60 * 60 * 1000,     // 7 days
      api: 60 * 24 * 60 * 60 * 1000         // 60 days
    }

    this.keyTypes = {
      JWT_PRIMARY: 'jwt_primary',
      JWT_SECONDARY: 'jwt_secondary',
      AES_ENCRYPTION: 'aes_encryption',
      SESSION_SECRET: 'session_secret',
      API_SIGNING: 'api_signing',
      CSRF_SECRET: 'csrf_secret'
    }

    this.initialized = false
  }

  /**
   * Initialize the key rotation service
   */
  async initialize() {
    try {
      console.log('Initializing Key Rotation Service...')

      // Create key storage table if not exists
      await this.createKeyStorageTable()

      // Load existing keys from secure storage
      await this.loadExistingKeys()

      // Generate initial keys if none exist
      await this.ensureRequiredKeysExist()

      // Set up automatic rotation schedules
      this.setupAutomaticRotation()

      this.initialized = true
      console.log('✓ Key Rotation Service initialized successfully')

      return true
    } catch (error) {
      console.error('Failed to initialize Key Rotation Service:', error)
      throw new Error('Key rotation service initialization failed')
    }
  }

  /**
   * Create secure key storage table
   */
  async createKeyStorageTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS encryption_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key_type VARCHAR(50) NOT NULL,
        key_id VARCHAR(100) NOT NULL,
        key_value TEXT NOT NULL,  -- Encrypted key value
        algorithm VARCHAR(50) NOT NULL,
        key_length INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'deprecated', 'revoked')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE,
        rotated_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        UNIQUE(key_type, key_id)
      )
    `

    await pool.query(createTableQuery)

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_encryption_keys_type_status
      ON encryption_keys(key_type, status)
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_encryption_keys_expires_at
      ON encryption_keys(expires_at) WHERE expires_at IS NOT NULL
    `)
  }

  /**
   * Generate cryptographically secure key
   */
  generateSecureKey(algorithm, length) {
    switch (algorithm) {
      case 'AES-256-GCM':
        return crypto.randomBytes(32).toString('base64') // 256-bit key
      case 'AES-128-GCM':
        return crypto.randomBytes(16).toString('base64') // 128-bit key
      case 'HMAC-SHA256':
        return crypto.randomBytes(64).toString('base64') // 512-bit key for HMAC
      case 'JWT-HS512':
        return crypto.randomBytes(128).toString('base64') // 1024-bit key for JWT
      case 'CSRF-TOKEN':
        return crypto.randomBytes(32).toString('base64') // 256-bit for CSRF
      default:
        return crypto.randomBytes(length || 32).toString('base64')
    }
  }

  /**
   * Encrypt key value for storage
   */
  encryptKeyForStorage(keyValue) {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY || this.generateMasterKey()
    const algorithm = 'aes-256-gcm'
    const iv = crypto.randomBytes(12)

    const cipher = crypto.createCipher(algorithm, masterKey)
    cipher.setAAD(Buffer.from('key-rotation-service', 'utf8'))

    let encrypted = cipher.update(keyValue, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm
    }
  }

  /**
   * Decrypt key value from storage
   */
  decryptKeyFromStorage(encryptedData) {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY || this.generateMasterKey()

    const decipher = crypto.createDecipher(encryptedData.algorithm, masterKey)
    decipher.setAAD(Buffer.from('key-rotation-service', 'utf8'))
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'))

    let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Generate or retrieve master encryption key
   */
  generateMasterKey() {
    // In production, this should be from HSM or KMS
    if (!process.env.MASTER_ENCRYPTION_KEY) {
      const masterKey = crypto.randomBytes(32).toString('base64')
      console.warn('Generated temporary master key. Set MASTER_ENCRYPTION_KEY in production!')
      return masterKey
    }
    return process.env.MASTER_ENCRYPTION_KEY
  }

  /**
   * Store key securely in database
   */
  async storeKey(keyType, keyValue, algorithm, metadata = {}) {
    try {
      const keyId = crypto.randomUUID()
      const encryptedKey = this.encryptKeyForStorage(keyValue)
      const expiresAt = new Date(Date.now() + this.rotationIntervals[keyType.split('_')[0].toLowerCase()])

      await pool.query(`
        INSERT INTO encryption_keys
        (key_type, key_id, key_value, algorithm, key_length, expires_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        keyType,
        keyId,
        JSON.stringify(encryptedKey),
        algorithm,
        keyValue.length,
        expiresAt,
        JSON.stringify(metadata)
      ])

      console.log(`✓ Stored new ${keyType} key: ${keyId}`)
      return keyId
    } catch (error) {
      console.error('Failed to store key:', error)
      throw error
    }
  }

  /**
   * Load existing keys from storage
   */
  async loadExistingKeys() {
    try {
      const result = await pool.query(`
        SELECT key_type, key_id, key_value, algorithm, status, expires_at, metadata
        FROM encryption_keys
        WHERE status IN ('active', 'rotating')
        ORDER BY created_at DESC
      `)

      for (const row of result.rows) {
        const encryptedData = JSON.parse(row.key_value)
        const decryptedKey = this.decryptKeyFromStorage(encryptedData)

        this.activeKeys.set(row.key_type, {
          keyId: row.key_id,
          keyValue: decryptedKey,
          algorithm: row.algorithm,
          status: row.status,
          expiresAt: row.expires_at,
          metadata: JSON.parse(row.metadata || '{}')
        })
      }

      console.log(`✓ Loaded ${result.rows.length} active keys`)
    } catch (error) {
      console.error('Failed to load existing keys:', error)
      throw error
    }
  }

  /**
   * Ensure all required keys exist
   */
  async ensureRequiredKeysExist() {
    const requiredKeys = [
      { type: this.keyTypes.JWT_PRIMARY, algorithm: 'JWT-HS512' },
      { type: this.keyTypes.JWT_SECONDARY, algorithm: 'JWT-HS512' },
      { type: this.keyTypes.AES_ENCRYPTION, algorithm: 'AES-256-GCM' },
      { type: this.keyTypes.SESSION_SECRET, algorithm: 'HMAC-SHA256' },
      { type: this.keyTypes.API_SIGNING, algorithm: 'HMAC-SHA256' },
      { type: this.keyTypes.CSRF_SECRET, algorithm: 'CSRF-TOKEN' }
    ]

    for (const keySpec of requiredKeys) {
      if (!this.activeKeys.has(keySpec.type)) {
        console.log(`Generating missing ${keySpec.type} key...`)

        const keyValue = this.generateSecureKey(keySpec.algorithm)
        const keyId = await this.storeKey(keySpec.type, keyValue, keySpec.algorithm, {
          generated: true,
          purpose: keySpec.type
        })

        this.activeKeys.set(keySpec.type, {
          keyId,
          keyValue,
          algorithm: keySpec.algorithm,
          status: 'active',
          expiresAt: new Date(Date.now() + this.rotationIntervals.jwt),
          metadata: { generated: true }
        })
      }
    }
  }

  /**
   * Rotate a specific key type
   */
  async rotateKey(keyType) {
    try {
      console.log(`Starting rotation for ${keyType}...`)

      const currentKey = this.activeKeys.get(keyType)
      if (!currentKey) {
        throw new Error(`No active key found for type: ${keyType}`)
      }

      // Mark current key as rotating
      await this.updateKeyStatus(currentKey.keyId, 'rotating')

      // Generate new key
      const newKeyValue = this.generateSecureKey(currentKey.algorithm)
      const newKeyId = await this.storeKey(keyType, newKeyValue, currentKey.algorithm, {
        rotatedFrom: currentKey.keyId,
        rotationType: 'automatic'
      })

      // Store old key in history for overlap period
      this.keyHistory.set(`${keyType}_${currentKey.keyId}`, {
        ...currentKey,
        rotatedAt: new Date()
      })

      // Activate new key
      this.activeKeys.set(keyType, {
        keyId: newKeyId,
        keyValue: newKeyValue,
        algorithm: currentKey.algorithm,
        status: 'active',
        expiresAt: new Date(Date.now() + this.rotationIntervals.jwt),
        metadata: { rotatedFrom: currentKey.keyId }
      })

      await this.updateKeyStatus(newKeyId, 'active')

      // Schedule old key deprecation (overlap period)
      setTimeout(async () => {
        await this.deprecateKey(currentKey.keyId)
      }, 24 * 60 * 60 * 1000) // 24 hour overlap

      console.log(`✓ Rotated ${keyType}: ${currentKey.keyId} → ${newKeyId}`)

      // Log rotation event
      await this.logKeyRotation(keyType, currentKey.keyId, newKeyId)

      return newKeyId
    } catch (error) {
      console.error(`Key rotation failed for ${keyType}:`, error)
      throw error
    }
  }

  /**
   * Update key status in database
   */
  async updateKeyStatus(keyId, status) {
    await pool.query(`
      UPDATE encryption_keys
      SET status = $1, rotated_at = CASE WHEN $1 = 'rotating' THEN CURRENT_TIMESTAMP ELSE rotated_at END
      WHERE key_id = $2
    `, [status, keyId])
  }

  /**
   * Deprecate old key after overlap period
   */
  async deprecateKey(keyId) {
    await this.updateKeyStatus(keyId, 'deprecated')
    console.log(`✓ Deprecated key: ${keyId}`)
  }

  /**
   * Get active key for specific type
   */
  getActiveKey(keyType) {
    const key = this.activeKeys.get(keyType)
    if (!key) {
      throw new Error(`No active key available for type: ${keyType}`)
    }
    return key.keyValue
  }

  /**
   * Get key for JWT verification (supports old keys during overlap)
   */
  getJWTVerificationKeys() {
    const primary = this.activeKeys.get(this.keyTypes.JWT_PRIMARY)
    const secondary = this.activeKeys.get(this.keyTypes.JWT_SECONDARY)

    const keys = []

    if (primary) keys.push(primary.keyValue)
    if (secondary) keys.push(secondary.keyValue)

    // Add recently rotated keys for verification
    for (const [historyKey, keyData] of this.keyHistory.entries()) {
      if (historyKey.startsWith('JWT_') && keyData.status === 'rotating') {
        keys.push(keyData.keyValue)
      }
    }

    return keys
  }

  /**
   * Verify JWT with multiple keys (for overlap period)
   */
  async verifyJWT(token) {
    const verificationKeys = this.getJWTVerificationKeys()

    for (const key of verificationKeys) {
      try {
        const decoded = jwt.verify(token, key)
        return decoded
      } catch (error) {
        // Try next key
        continue
      }
    }

    throw new Error('Token verification failed with all available keys')
  }

  /**
   * Set up automatic rotation schedules
   */
  setupAutomaticRotation() {
    // JWT key rotation every 30 days
    setInterval(async () => {
      try {
        await this.rotateKey(this.keyTypes.JWT_PRIMARY)
      } catch (error) {
        console.error('Automatic JWT rotation failed:', error)
      }
    }, this.rotationIntervals.jwt)

    // Encryption key rotation every 90 days
    setInterval(async () => {
      try {
        await this.rotateKey(this.keyTypes.AES_ENCRYPTION)
      } catch (error) {
        console.error('Automatic encryption key rotation failed:', error)
      }
    }, this.rotationIntervals.encryption)

    // Session secret rotation every 7 days
    setInterval(async () => {
      try {
        await this.rotateKey(this.keyTypes.SESSION_SECRET)
      } catch (error) {
        console.error('Automatic session secret rotation failed:', error)
      }
    }, this.rotationIntervals.session)

    console.log('✓ Automatic key rotation schedules configured')
  }

  /**
   * Log key rotation events for audit
   */
  async logKeyRotation(keyType, oldKeyId, newKeyId) {
    try {
      await pool.query(`
        INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        '00000000-0000-0000-0000-000000000000',
        'key_rotated',
        'encryption_key',
        newKeyId,
        JSON.stringify({
          keyType,
          oldKeyId,
          newKeyId,
          timestamp: new Date().toISOString(),
          automatic: true
        })
      ])
    } catch (error) {
      console.error('Failed to log key rotation:', error)
    }
  }

  /**
   * Get key rotation status for monitoring
   */
  async getRotationStatus() {
    const status = {}

    for (const [keyType, keyData] of this.activeKeys.entries()) {
      status[keyType] = {
        keyId: keyData.keyId,
        algorithm: keyData.algorithm,
        status: keyData.status,
        expiresAt: keyData.expiresAt,
        daysUntilExpiry: Math.ceil((new Date(keyData.expiresAt) - new Date()) / (24 * 60 * 60 * 1000))
      }
    }

    return status
  }

  /**
   * Force immediate rotation (emergency use)
   */
  async emergencyRotation(keyType, reason) {
    console.log(`🚨 EMERGENCY ROTATION: ${keyType} - Reason: ${reason}`)

    const newKeyId = await this.rotateKey(keyType)

    await pool.query(`
      INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      '00000000-0000-0000-0000-000000000000',
      'emergency_key_rotation',
      'encryption_key',
      newKeyId,
      JSON.stringify({
        keyType,
        reason,
        timestamp: new Date().toISOString(),
        emergency: true
      })
    ])

    return newKeyId
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys() {
    try {
      const result = await pool.query(`
        UPDATE encryption_keys
        SET status = 'revoked'
        WHERE status = 'deprecated'
        AND rotated_at < NOW() - INTERVAL '30 days'
        RETURNING key_id, key_type
      `)

      console.log(`✓ Revoked ${result.rows.length} expired keys`)

      // Clear from memory
      for (const row of result.rows) {
        this.keyHistory.delete(`${row.key_type}_${row.key_id}`)
      }
    } catch (error) {
      console.error('Failed to cleanup expired keys:', error)
    }
  }
}

// Create singleton instance
const keyRotationService = new KeyRotationService()

module.exports = keyRotationService