const express = require('express')
const router = express.Router()
const path = require('path')
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const { secureFileUpload, cleanupTempFiles } = require('../middleware/fileUpload')
const rateLimit = require('express-rate-limit')
const fs = require('fs')

// Rate limiter for file downloads
const downloadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 downloads per minute per IP
  message: { error: 'Too many download requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false
})

// GET /api/files - Get all files for user (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.file_name, u.file_size, u.uploaded_at, u.uploader_name, u.uploader_email,
              r.title as request_title, r.short_code
       FROM uploads u
       JOIN file_requests r ON u.request_id = r.id
       WHERE r.user_id = $1
       ORDER BY u.uploaded_at DESC`,
      [req.userId]
    )

    res.json({
      files: result.rows.map(f => ({
        id: f.id,
        fileName: f.file_name,
        fileSize: f.file_size,
        uploadedAt: f.uploaded_at,
        uploaderName: f.uploader_name,
        uploaderEmail: f.uploader_email,
        requestTitle: f.request_title,
        requestCode: f.short_code
      }))
    })
  } catch (error) {
    console.error('Get files error:', error)
    res.status(500).json({ error: 'Failed to fetch files' })
  }
})

// POST /api/files/upload - Upload file (protected)
router.post('/upload', authenticateToken, secureFileUpload, async (req, res) => {
  try {
    // secureFileUpload middleware handles file validation, scanning, and storage
    // Files are available in req.files or req.file
    const uploadedFiles = req.files || [req.file].filter(Boolean)

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const results = []

    for (const file of uploadedFiles) {
      // Get request details if request_id provided
      let requestId = req.body.request_id

      if (requestId) {
        // Verify user owns this request
        const requestResult = await pool.query(
          'SELECT id, user_id FROM file_requests WHERE id = $1 AND user_id = $2',
          [requestId, req.userId]
        )

        if (requestResult.rows.length === 0) {
          await cleanupTempFiles([file])
          return res.status(403).json({ error: 'Access denied to this request' })
        }
      } else {
        // Create a default request if none provided
        const createRequestResult = await pool.query(
          `INSERT INTO file_requests (user_id, title, description, short_code, is_active, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            req.userId,
            'Direct Upload',
            'File uploaded directly via API',
            Math.random().toString(36).substring(2, 8).toUpperCase(),
            true,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          ]
        )
        requestId = createRequestResult.rows[0].id
      }

      // Store file record in database
      const insertResult = await pool.query(
        `INSERT INTO uploads (request_id, file_name, file_size, file_type, storage_path,
                            uploader_name, uploader_email, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          requestId,
          file.filename || file.originalname,
          file.size,
          file.mimetype,
          file.path || file.destination + '/' + file.filename,
          req.body.uploader_name || 'API User',
          req.body.uploader_email || 'api@swayfiles.com',
          new Date()
        ]
      )

      results.push({
        id: insertResult.rows[0].id,
        fileName: file.filename || file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        requestId: requestId
      })
    }

    // Cleanup any temp files
    await cleanupTempFiles(uploadedFiles)

    res.json({
      success: true,
      message: `${results.length} file(s) uploaded successfully`,
      files: results
    })

  } catch (error) {
    console.error('Upload error:', error)

    // Cleanup files on error
    if (req.files || req.file) {
      const files = req.files || [req.file].filter(Boolean)
      await cleanupTempFiles(files)
    }

    res.status(500).json({ error: 'Failed to upload file' })
  }
})

// GET /api/files/:id - Download file (protected)
router.get('/:id', authenticateToken, downloadLimiter, async (req, res) => {
  try {
    const { id } = req.params

    // Get upload details
    const uploadResult = await pool.query(
      `SELECT u.*, r.user_id
       FROM uploads u
       JOIN file_requests r ON u.request_id = r.id
       WHERE u.id = $1`,
      [id]
    )

    if (uploadResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }

    const upload = uploadResult.rows[0]

    // Verify user owns this request
    if (upload.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // SECURITY: Sanitize and validate storage_path to prevent path traversal
    const sanitizedPath = path.normalize(upload.storage_path).replace(/^(\.\.(\/|\\|$))+/, '')
    const uploadsDir = path.resolve(__dirname, '../uploads')
    const filePath = path.resolve(uploadsDir, sanitizedPath)

    // SECURITY: Ensure resolved path is within uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      console.error('Path traversal attempt detected:', { userId: req.userId, storagePath: upload.storage_path })
      return res.status(400).json({ error: 'Invalid file path' })
    }

    // SECURITY: Verify file actually exists before downloading
    if (!fs.existsSync(filePath)) {
      console.error('File not found on disk:', filePath)
      return res.status(404).json({ error: 'File not found on server' })
    }

    // Send file
    res.download(filePath, upload.file_name)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

module.exports = router
