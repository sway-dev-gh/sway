const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pool = require('../db/pool')

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads')

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
})

// GET /api/r/:code - Get request details (public)
router.get('/:code', async (req, res) => {
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

// POST /api/r/:code/upload - Submit files (public)
router.post('/:code/upload', upload.array('files', 10), async (req, res) => {
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

    // Check file type restrictions based on plan
    const basicFileTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt']
    const limitedFileTypes = [...basicFileTypes, '.mp4', '.mov', '.avi', '.zip', '.rar', '.xlsx', '.xls', '.ppt', '.pptx', '.mp3', '.wav']

    for (const file of files) {
      const fileExt = path.extname(file.originalname).toLowerCase()

      if (request.plan === 'free') {
        if (!basicFileTypes.includes(fileExt)) {
          return res.status(403).json({
            error: 'File type not allowed',
            message: `Free plan only supports basic file types (images, PDFs, and documents). File "${file.originalname}" is not allowed. Upgrade to Pro for more file types.`,
            fileName: file.originalname,
            allowedTypes: basicFileTypes
          })
        }
      } else if (request.plan === 'pro') {
        if (!limitedFileTypes.includes(fileExt)) {
          return res.status(403).json({
            error: 'File type not allowed',
            message: `Pro plan doesn't support this file type. File "${file.originalname}" is not allowed. Upgrade to Business for all file types.`,
            fileName: file.originalname
          })
        }
      }
      // Business plan has no file type restrictions
    }

    // Check storage limits
    const storageResult = await pool.query(
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

    if (totalStorageBytes > storageLimitBytes) {
      const currentStorageGB = (currentStorageBytes / (1024 * 1024 * 1024)).toFixed(2)
      const limitGB = request.storage_limit_gb
      return res.status(403).json({
        error: 'Storage limit exceeded',
        message: `The account owner has reached their storage limit (${currentStorageGB} GB of ${limitGB} GB used). Please contact them to upgrade their plan.`,
        currentStorage: currentStorageGB,
        storageLimit: limitGB
      })
    }

    // Create upload records for each file
    const uploadPromises = files.map(file => {
      return pool.query(
        `INSERT INTO uploads (request_id, uploader_name, uploader_email, file_name, file_size, storage_path)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [request.id, name, email || null, file.originalname, file.size, file.filename]
      )
    })

    await Promise.all(uploadPromises)

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
