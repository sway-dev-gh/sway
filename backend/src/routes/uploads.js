const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pool = require('../db/pool')
const { createNotification } = require('./notifications')
const rateLimit = require('express-rate-limit')

// Rate limiters for public endpoints
const getRequestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes per IP
  message: { error: 'Too many upload attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
})

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads')

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Sanitize filename to prevent path traversal and special character exploits
function sanitizeFilename(filename) {
  // Remove path components (prevents ../../../ attacks)
  let safe = path.basename(filename)

  // Remove dangerous characters, keep only alphanumeric, dots, hyphens, underscores
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Limit length to prevent filesystem issues
  if (safe.length > 200) {
    const ext = path.extname(safe)
    safe = safe.substring(0, 200 - ext.length) + ext
  }

  // Ensure has an extension
  if (!safe.includes('.') || safe.startsWith('.')) {
    safe = safe + '.bin'
  }

  return safe
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const sanitized = sanitizeFilename(file.originalname)
    cb(null, uniqueSuffix + '-' + sanitized)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
})

// GET /api/r/:code - Get request details (public)
router.get('/:code', getRequestLimiter, async (req, res) => {
  try {
    const { code } = req.params

    const result = await pool.query(
      'SELECT id, title, description, is_active, request_type, custom_fields, expires_at FROM file_requests WHERE short_code = $1',
      [code]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const request = result.rows[0]

    res.json({
      id: request.id,
      title: request.title,
      description: request.description,
      isActive: request.is_active,
      requestType: request.request_type,
      customFields: request.custom_fields,
      expiresAt: request.expires_at
    })
  } catch (error) {
    console.error('Get upload request error:', error)
    res.status(500).json({ error: 'Failed to fetch request' })
  }
})

// Middleware to check Content-Length before upload
const checkFileSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0')
  const maxSize = 50 * 1024 * 1024 // 50MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'File too large',
      message: 'Total upload size cannot exceed 50MB'
    })
  }
  next()
}

// POST /api/r/:code/upload - Submit files (public)
router.post('/:code/upload', uploadLimiter, checkFileSize, upload.array('files', 10), async (req, res) => {
  try {
    const { code } = req.params
    const { name, email } = req.body
    const files = req.files

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one file is required' })
    }

    // Get request with user info
    const requestResult = await pool.query(
      `SELECT fr.id, fr.is_active, fr.user_id, u.storage_limit_gb, u.plan
       FROM file_requests fr
       JOIN users u ON fr.user_id = u.id
       WHERE fr.short_code = $1`,
      [code]
    )

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const request = requestResult.rows[0]

    if (!request.is_active) {
      return res.status(403).json({ error: 'This request is no longer accepting uploads' })
    }

    // Check files per request limit based on plan
    const uploadCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM uploads WHERE request_id = $1',
      [request.id]
    )
    const currentFileCount = parseInt(uploadCountResult.rows[0].count)
    const newFileCount = currentFileCount + files.length

    let filesPerRequestLimit
    if (request.plan === 'free') {
      filesPerRequestLimit = 10
    } else if (request.plan === 'pro') {
      filesPerRequestLimit = 100
    } else {
      filesPerRequestLimit = null // Unlimited for business
    }

    if (filesPerRequestLimit && newFileCount > filesPerRequestLimit) {
      return res.status(403).json({
        error: 'File limit exceeded',
        message: `This request can only accept ${filesPerRequestLimit} files (Free plan limit). Currently has ${currentFileCount} files. Upgrade to Business for unlimited files.`,
        currentCount: currentFileCount,
        limit: filesPerRequestLimit
      })
    }

    // Check file type restrictions based on plan (extension + MIME type)
    const basicFileTypes = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.pdf': ['application/pdf'],
      '.doc': ['application/msword'],
      '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      '.txt': ['text/plain']
    }

    const limitedFileTypes = {
      ...basicFileTypes,
      '.mp4': ['video/mp4'],
      '.mov': ['video/quicktime'],
      '.avi': ['video/x-msvideo', 'video/avi'],
      '.zip': ['application/zip', 'application/x-zip-compressed'],
      '.rar': ['application/x-rar-compressed', 'application/vnd.rar'],
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.xls': ['application/vnd.ms-excel'],
      '.ppt': ['application/vnd.ms-powerpoint'],
      '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      '.mp3': ['audio/mpeg'],
      '.wav': ['audio/wav', 'audio/x-wav']
    }

    for (const file of files) {
      const fileExt = path.extname(file.originalname).toLowerCase()
      const fileMime = file.mimetype.toLowerCase()

      if (request.plan === 'free') {
        if (!basicFileTypes[fileExt]) {
          return res.status(403).json({
            error: 'File type not allowed',
            message: `Free plan only supports basic file types (images, PDFs, and documents). File "${file.originalname}" is not allowed. Upgrade to Pro for more file types.`,
            fileName: file.originalname,
            allowedTypes: Object.keys(basicFileTypes)
          })
        }

        // Validate MIME type matches extension
        if (!basicFileTypes[fileExt].includes(fileMime)) {
          return res.status(403).json({
            error: 'File type mismatch',
            message: `File "${file.originalname}" appears to be disguised. The file extension doesn't match the actual file type.`,
            fileName: file.originalname
          })
        }
      } else if (request.plan === 'pro') {
        if (!limitedFileTypes[fileExt]) {
          return res.status(403).json({
            error: 'File type not allowed',
            message: `Pro plan doesn't support this file type. File "${file.originalname}" is not allowed. Upgrade to Business for all file types.`,
            fileName: file.originalname
          })
        }

        // Validate MIME type matches extension
        if (!limitedFileTypes[fileExt].includes(fileMime)) {
          return res.status(403).json({
            error: 'File type mismatch',
            message: `File "${file.originalname}" appears to be disguised. The file extension doesn't match the actual file type.`,
            fileName: file.originalname
          })
        }
      }
      // Business plan has no file type restrictions
    }

    // Use transaction with row-level locking to prevent race conditions
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Lock the user row to prevent concurrent storage calculations
      await client.query(
        'SELECT id FROM users WHERE id = $1 FOR UPDATE',
        [request.user_id]
      )

      // Check storage limits with lock held
      const storageResult = await client.query(
        `SELECT COALESCE(SUM(u.file_size), 0) as total_bytes
         FROM uploads u
         JOIN file_requests fr ON u.request_id = fr.id
         WHERE fr.user_id = $1`,
        [request.user_id]
      )

      const currentStorageBytes = parseInt(storageResult.rows[0].total_bytes)
      const newFilesBytes = files.reduce((sum, file) => sum + file.size, 0)
      const totalStorageBytes = currentStorageBytes + newFilesBytes
      const storageLimitBytes = request.storage_limit_gb * 1024 * 1024 * 1024 // Convert GB to bytes

      // Block uploads if ALREADY over limit (e.g., after plan downgrade)
      if (currentStorageBytes >= storageLimitBytes) {
        await client.query('ROLLBACK')
        const currentStorageGB = (currentStorageBytes / (1024 * 1024 * 1024)).toFixed(2)
        const limitGB = request.storage_limit_gb
        return res.status(403).json({
          error: 'Storage limit exceeded',
          message: `This account has exceeded its storage limit (${currentStorageGB} GB of ${limitGB} GB used). No new uploads are allowed until existing files are deleted. Contact the account owner to delete files or upgrade their plan.`,
          currentStorage: currentStorageGB,
          storageLimit: limitGB,
          overLimit: true
        })
      }

      // Block uploads if THIS upload would exceed limit
      if (totalStorageBytes > storageLimitBytes) {
        await client.query('ROLLBACK')
        const currentStorageGB = (currentStorageBytes / (1024 * 1024 * 1024)).toFixed(2)
        const limitGB = request.storage_limit_gb
        return res.status(403).json({
          error: 'Storage limit would be exceeded',
          message: `This upload would exceed the storage limit (currently ${currentStorageGB} GB of ${limitGB} GB used). Please contact the account owner to upgrade their plan.`,
          currentStorage: currentStorageGB,
          storageLimit: limitGB
        })
      }

      // Create upload records for each file within the transaction
      const uploadPromises = files.map(file => {
        return client.query(
          `INSERT INTO uploads (request_id, uploader_name, uploader_email, file_name, file_size, storage_path)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [request.id, name, email || null, file.originalname, file.size, file.filename]
        )
      })

      await Promise.all(uploadPromises)

      // Commit the transaction
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    // Get request title for notification
    const requestTitleResult = await pool.query(
      'SELECT title FROM file_requests WHERE id = $1',
      [request.id]
    )
    const requestTitle = requestTitleResult.rows[0]?.title || 'Untitled Request'

    // Create notification for file upload
    await createNotification(
      request.user_id,
      'upload',
      'New Files Uploaded',
      `${name} uploaded ${files.length} file(s) to "${requestTitle}"`,
      { requestId: request.id, uploaderName: name, fileCount: files.length }
    )

    // Note: Storage warning notifications are handled by stats.js with rate limiting
    // to prevent spam. They're created when the user views their Dashboard/Billing pages.

    res.json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload files' })
  }
})

module.exports = router
