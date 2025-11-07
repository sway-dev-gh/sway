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
      'SELECT id, title, description, is_active FROM file_requests WHERE short_code = $1',
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
      isActive: request.is_active
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

    // Get request
    const requestResult = await pool.query(
      'SELECT id, is_active FROM file_requests WHERE short_code = $1',
      [code]
    )

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const request = requestResult.rows[0]

    if (!request.is_active) {
      return res.status(403).json({ error: 'This request is no longer accepting uploads' })
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
