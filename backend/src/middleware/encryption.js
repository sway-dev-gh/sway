/**
 * Enterprise-Grade Data Encryption & Secure Storage
 * Bank-level encryption for sensitive data at rest and in transit
 */

const crypto = require('crypto')
const bcrypt = require('bcrypt')

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 32

// CRITICAL SECURITY: Validate encryption keys exist at startup
if (!process.env.ENCRYPTION_KEY) {
  console.error('FATAL ERROR: ENCRYPTION_KEY environment variable is not set!')
  console.error('Application cannot start without encryption capabilities.')
  process.exit(1)
}

if (!process.env.DATA_ENCRYPTION_KEY) {
  console.error('FATAL ERROR: DATA_ENCRYPTION_KEY environment variable is not set!')
  console.error('Application cannot start without data encryption capabilities.')
  process.exit(1)
}

// Derive encryption keys from environment variables
const MASTER_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'sway-salt', KEY_LENGTH)
const DATA_KEY = crypto.scryptSync(process.env.DATA_ENCRYPTION_KEY, 'data-salt', KEY_LENGTH)
const FILE_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'file-salt', KEY_LENGTH)

// Key rotation support
let currentKeyVersion = 1
const keyVersions = new Map()
keyVersions.set(1, MASTER_KEY)

/**
 * Encrypt sensitive data with AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @param {Buffer} key - Encryption key (optional, uses MASTER_KEY by default)
 * @returns {Object} Encrypted data with IV, tag, and key version
 */
const encryptData = (plaintext, key = MASTER_KEY) => {
  if (!plaintext) return null

  try {
    // Generate random IV for each encryption
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv)

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get authentication tag
    const tag = cipher.getAuthTag()

    // Return encrypted data with metadata
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      keyVersion: currentKeyVersion,
      algorithm: ALGORITHM
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data with AES-256-GCM
 * @param {Object} encryptedData - Encrypted data object
 * @param {Buffer} key - Decryption key (optional, uses MASTER_KEY by default)
 * @returns {string} Decrypted plaintext
 */
const decryptData = (encryptedData, key = MASTER_KEY) => {
  if (!encryptedData || !encryptedData.encrypted) return null

  try {
    const { encrypted, iv, tag, keyVersion } = encryptedData

    // Use appropriate key version
    const decryptionKey = keyVersions.get(keyVersion) || key

    // Create decipher
    const decipher = crypto.createDecipherGCM(ALGORITHM, decryptionKey, Buffer.from(iv, 'hex'))

    // Set authentication tag
    decipher.setAuthTag(Buffer.from(tag, 'hex'))

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hash sensitive data with bcrypt (one-way hashing)
 * @param {string} data - Data to hash
 * @param {number} saltRounds - Salt rounds for bcrypt (default: 12)
 * @returns {Promise<string>} Hashed data
 */
const hashData = async (data, saltRounds = 12) => {
  if (!data) return null

  try {
    return await bcrypt.hash(data, saltRounds)
  } catch (error) {
    console.error('Hashing error:', error)
    throw new Error('Failed to hash data')
  }
}

/**
 * Verify hashed data with bcrypt
 * @param {string} data - Original data
 * @param {string} hash - Hashed data to compare against
 * @returns {Promise<boolean>} True if data matches hash
 */
const verifyHash = async (data, hash) => {
  if (!data || !hash) return false

  try {
    return await bcrypt.compare(data, hash)
  } catch (error) {
    console.error('Hash verification error:', error)
    return false
  }
}

/**
 * Generate cryptographically secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Hex-encoded secure token
 */
const generateSecureToken = (length = 32) => {
  try {
    return crypto.randomBytes(length).toString('hex')
  } catch (error) {
    console.error('Token generation error:', error)
    throw new Error('Failed to generate secure token')
  }
}

/**
 * Generate cryptographically secure UUID v4
 * @returns {string} Secure UUID
 */
const generateSecureUUID = () => {
  try {
    return crypto.randomUUID()
  } catch (error) {
    console.error('UUID generation error:', error)
    throw new Error('Failed to generate secure UUID')
  }
}

/**
 * Encrypt file data for secure storage
 * @param {Buffer} fileBuffer - File data to encrypt
 * @returns {Object} Encrypted file data with metadata
 */
const encryptFile = (fileBuffer) => {
  if (!Buffer.isBuffer(fileBuffer)) {
    throw new Error('File data must be a Buffer')
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipherGCM(ALGORITHM, FILE_KEY, iv)

    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ])

    const tag = cipher.getAuthTag()

    return {
      encrypted,
      iv,
      tag,
      keyVersion: currentKeyVersion,
      algorithm: ALGORITHM
    }
  } catch (error) {
    console.error('File encryption error:', error)
    throw new Error('Failed to encrypt file')
  }
}

/**
 * Decrypt file data
 * @param {Object} encryptedFileData - Encrypted file data object
 * @returns {Buffer} Decrypted file data
 */
const decryptFile = (encryptedFileData) => {
  if (!encryptedFileData) {
    throw new Error('Encrypted file data is required')
  }

  try {
    const { encrypted, iv, tag, keyVersion } = encryptedFileData
    const decryptionKey = keyVersions.get(keyVersion) || FILE_KEY

    const decipher = crypto.createDecipherGCM(ALGORITHM, decryptionKey, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])

    return decrypted
  } catch (error) {
    console.error('File decryption error:', error)
    throw new Error('Failed to decrypt file')
  }
}

/**
 * Secure data sanitization (permanent deletion)
 * @param {Buffer} data - Data to securely wipe
 */
const secureWipe = (data) => {
  if (Buffer.isBuffer(data)) {
    // Overwrite with random data multiple times
    for (let i = 0; i < 3; i++) {
      crypto.randomFillSync(data)
    }
    // Final overwrite with zeros
    data.fill(0)
  }
}

/**
 * Encrypt sensitive fields in database objects
 * @param {Object} obj - Object containing sensitive data
 * @param {Array} sensitiveFields - Array of field names to encrypt
 * @returns {Object} Object with encrypted sensitive fields
 */
const encryptSensitiveFields = (obj, sensitiveFields = []) => {
  if (!obj || typeof obj !== 'object') return obj

  const encrypted = { ...obj }

  sensitiveFields.forEach(field => {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptData(encrypted[field], DATA_KEY)
    }
  })

  return encrypted
}

/**
 * Decrypt sensitive fields in database objects
 * @param {Object} obj - Object containing encrypted data
 * @param {Array} sensitiveFields - Array of field names to decrypt
 * @returns {Object} Object with decrypted sensitive fields
 */
const decryptSensitiveFields = (obj, sensitiveFields = []) => {
  if (!obj || typeof obj !== 'object') return obj

  const decrypted = { ...obj }

  sensitiveFields.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'object') {
      try {
        decrypted[field] = decryptData(decrypted[field], DATA_KEY)
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error)
        decrypted[field] = null // Don't leak encrypted data
      }
    }
  })

  return decrypted
}

/**
 * Middleware to encrypt request data
 */
const encryptRequestData = (sensitiveFields = []) => {
  return (req, res, next) => {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = encryptSensitiveFields(req.body, sensitiveFields)
      }
      next()
    } catch (error) {
      console.error('Request encryption error:', error)
      res.status(500).json({ error: 'Data processing failed' })
    }
  }
}

/**
 * Middleware to decrypt response data
 */
const decryptResponseData = (sensitiveFields = []) => {
  return (req, res, next) => {
    const originalJson = res.json

    res.json = function(body) {
      try {
        if (body && typeof body === 'object') {
          if (Array.isArray(body)) {
            body = body.map(item => decryptSensitiveFields(item, sensitiveFields))
          } else {
            body = decryptSensitiveFields(body, sensitiveFields)
          }
        }
      } catch (error) {
        console.error('Response decryption error:', error)
        // Don't leak encryption errors to client
      }

      return originalJson.call(this, body)
    }

    next()
  }
}

/**
 * Key rotation functions for enhanced security
 */
const rotateEncryptionKey = (newKey) => {
  try {
    currentKeyVersion++
    const derivedKey = crypto.scryptSync(newKey, 'sway-salt', KEY_LENGTH)
    keyVersions.set(currentKeyVersion, derivedKey)

    console.log(`🔑 Encryption key rotated to version ${currentKeyVersion}`)
    return currentKeyVersion
  } catch (error) {
    console.error('Key rotation error:', error)
    throw new Error('Failed to rotate encryption key')
  }
}

module.exports = {
  encryptData,
  decryptData,
  hashData,
  verifyHash,
  generateSecureToken,
  generateSecureUUID,
  encryptFile,
  decryptFile,
  secureWipe,
  encryptSensitiveFields,
  decryptSensitiveFields,
  encryptRequestData,
  decryptResponseData,
  rotateEncryptionKey,

  // Export constants for configuration
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  TAG_LENGTH,
  SALT_LENGTH
}