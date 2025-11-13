/**
 * Comprehensive File Upload Security Middleware
 * Stripe-level file security and validation
 */

const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs').promises
const { promisify } = require('util')
const { encryptFile, decryptFile } = require('./encryption')

// Allowed file types by category
const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': { ext: ['.jpg', '.jpeg'], maxSize: 10 * 1024 * 1024 }, // 10MB
  'image/png': { ext: ['.png'], maxSize: 10 * 1024 * 1024 }, // 10MB
  'image/gif': { ext: ['.gif'], maxSize: 5 * 1024 * 1024 }, // 5MB
  'image/webp': { ext: ['.webp'], maxSize: 10 * 1024 * 1024 }, // 10MB
  'image/svg+xml': { ext: ['.svg'], maxSize: 1 * 1024 * 1024 }, // 1MB

  // Documents
  'application/pdf': { ext: ['.pdf'], maxSize: 50 * 1024 * 1024 }, // 50MB
  'text/plain': { ext: ['.txt'], maxSize: 1 * 1024 * 1024 }, // 1MB
  'application/msword': { ext: ['.doc'], maxSize: 25 * 1024 * 1024 }, // 25MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: ['.docx'], maxSize: 25 * 1024 * 1024 }, // 25MB

  // Spreadsheets
  'application/vnd.ms-excel': { ext: ['.xls'], maxSize: 25 * 1024 * 1024 }, // 25MB
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: ['.xlsx'], maxSize: 25 * 1024 * 1024 }, // 25MB

  // Presentations
  'application/vnd.ms-powerpoint': { ext: ['.ppt'], maxSize: 25 * 1024 * 1024 }, // 25MB
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: ['.pptx'], maxSize: 25 * 1024 * 1024 }, // 25MB

  // Archives
  'application/zip': { ext: ['.zip'], maxSize: 100 * 1024 * 1024 }, // 100MB
  'application/x-rar-compressed': { ext: ['.rar'], maxSize: 100 * 1024 * 1024 }, // 100MB
  'application/x-7z-compressed': { ext: ['.7z'], maxSize: 100 * 1024 * 1024 }, // 100MB

  // Audio
  'audio/mpeg': { ext: ['.mp3'], maxSize: 50 * 1024 * 1024 }, // 50MB
  'audio/wav': { ext: ['.wav'], maxSize: 100 * 1024 * 1024 }, // 100MB

  // Video
  'video/mp4': { ext: ['.mp4'], maxSize: 500 * 1024 * 1024 }, // 500MB
  'video/webm': { ext: ['.webm'], maxSize: 500 * 1024 * 1024 }, // 500MB
  'video/quicktime': { ext: ['.mov'], maxSize: 500 * 1024 * 1024 } // 500MB
}

// Dangerous file signatures to block
const DANGEROUS_SIGNATURES = [
  // Executable files
  { signature: Buffer.from([0x4D, 0x5A]), description: 'Windows PE executable' },
  { signature: Buffer.from([0x7F, 0x45, 0x4C, 0x46]), description: 'ELF executable' },

  // Scripts
  { signature: Buffer.from('<?php'), description: 'PHP script' },
  { signature: Buffer.from('#!/'), description: 'Shell script' },

  // Potentially malicious
  { signature: Buffer.from([0x50, 0x4B, 0x03, 0x04]), description: 'ZIP archive (needs further inspection)' },
  { signature: Buffer.from([0xD0, 0xCF, 0x11, 0xE0]), description: 'Microsoft Office document (needs further inspection)' }
]

// Generate secure filename
const generateSecureFilename = (originalname) => {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(16).toString('hex')
  const ext = path.extname(originalname).toLowerCase()
  const basename = path.basename(originalname, ext)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50) // Limit basename length

  return `${timestamp}_${randomBytes}_${basename}${ext}`
}

// Validate file type and extension
const validateFileType = (file) => {
  const fileType = ALLOWED_FILE_TYPES[file.mimetype]

  if (!fileType) {
    throw new Error(`File type '${file.mimetype}' is not allowed`)
  }

  const ext = path.extname(file.originalname).toLowerCase()
  if (!fileType.ext.includes(ext)) {
    throw new Error(`File extension '${ext}' does not match MIME type '${file.mimetype}'`)
  }

  if (file.size > fileType.maxSize) {
    const maxSizeMB = Math.round(fileType.maxSize / (1024 * 1024))
    throw new Error(`File size exceeds maximum allowed size of ${maxSizeMB}MB`)
  }

  return true
}

// Scan file for malicious signatures
const scanFileForMalware = async (filePath) => {
  try {
    const buffer = await fs.readFile(filePath)
    const header = buffer.slice(0, 512) // Read first 512 bytes

    for (const danger of DANGEROUS_SIGNATURES) {
      if (header.includes(danger.signature)) {
        throw new Error(`Potentially dangerous file detected: ${danger.description}`)
      }
    }

    // Additional checks for specific file types
    if (buffer.includes(Buffer.from('javascript:')) ||
        buffer.includes(Buffer.from('<script')) ||
        buffer.includes(Buffer.from('eval('))) {
      throw new Error('File contains potentially malicious JavaScript')
    }

    return true
  } catch (error) {
    throw new Error(`File security scan failed: ${error.message}`)
  }
}

// Sanitize uploaded file content
const sanitizeFile = async (filePath, mimetype) => {
  try {
    // For text files, remove potentially dangerous content
    if (mimetype.startsWith('text/')) {
      let content = await fs.readFile(filePath, 'utf8')

      // Remove script tags and javascript
      content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      content = content.replace(/javascript:/gi, '')
      content = content.replace(/on\w+\s*=/gi, '') // Remove event handlers
      content = content.replace(/eval\s*\(/gi, 'eval_blocked(')

      await fs.writeFile(filePath, content, 'utf8')
    }

    // For SVG files, sanitize XML
    if (mimetype === 'image/svg+xml') {
      let svgContent = await fs.readFile(filePath, 'utf8')

      // Remove script tags and javascript from SVG
      svgContent = svgContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      svgContent = svgContent.replace(/javascript:/gi, '')
      svgContent = svgContent.replace(/on\w+\s*=/gi, '') // Remove event handlers

      await fs.writeFile(filePath, svgContent, 'utf8')
    }

    return true
  } catch (error) {
    throw new Error(`File sanitization failed: ${error.message}`)
  }
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp')

    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    const secureFilename = generateSecureFilename(file.originalname)
    cb(null, secureFilename)
  }
})

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    // Basic validation
    if (!file.originalname) {
      return cb(new Error('Filename is required'))
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ext) {
      return cb(new Error('File must have an extension'))
    }

    // Validate against allowed types
    validateFileType(file)

    cb(null, true)
  } catch (error) {
    cb(error)
  }
}

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
    files: 10, // Max 10 files
    fields: 20, // Max 20 form fields
    fieldNameSize: 100, // Max field name length
    fieldSize: 1024 * 1024 // Max field value size (1MB)
  }
})

// Main upload middleware
const secureFileUpload = (fieldName, options = {}) => {
  const maxFiles = options.maxFiles || 1
  const uploadMiddleware = maxFiles === 1 ? upload.single(fieldName) : upload.array(fieldName, maxFiles)

  return async (req, res, next) => {
    uploadMiddleware(req, res, async (uploadError) => {
      if (uploadError) {
        // Handle multer errors
        let errorMessage = 'File upload error'

        if (uploadError instanceof multer.MulterError) {
          switch (uploadError.code) {
            case 'LIMIT_FILE_SIZE':
              errorMessage = 'File size too large'
              break
            case 'LIMIT_FILE_COUNT':
              errorMessage = 'Too many files'
              break
            case 'LIMIT_FIELD_COUNT':
              errorMessage = 'Too many fields'
              break
            case 'LIMIT_UNEXPECTED_FILE':
              errorMessage = 'Unexpected file field'
              break
            default:
              errorMessage = uploadError.message
          }
        } else {
          errorMessage = uploadError.message
        }

        return res.status(400).json({ error: errorMessage })
      }

      // No files uploaded
      if (!req.file && !req.files) {
        return next()
      }

      try {
        const files = req.files || [req.file]

        // Process each uploaded file
        for (const file of files.filter(Boolean)) {
          const filePath = file.path

          // Validate file type again (server-side verification)
          validateFileType(file)

          // Scan for malware
          await scanFileForMalware(filePath)

          // Sanitize file content
          await sanitizeFile(filePath, file.mimetype)

          // Encrypt file if required
          if (options.encrypt) {
            const fileBuffer = await fs.readFile(filePath)
            const encryptedData = encryptFile(fileBuffer)

            // Store encrypted file
            await fs.writeFile(filePath + '.enc', JSON.stringify(encryptedData))
            await fs.unlink(filePath) // Remove unencrypted file

            file.path = filePath + '.enc'
            file.encrypted = true
          }

          // Add security metadata
          file.securityScan = {
            scanned: true,
            scanTime: new Date().toISOString(),
            safe: true
          }

          console.log(`✅ File upload security check passed: ${file.originalname}`)
        }

        next()
      } catch (error) {
        // Clean up uploaded files on error
        const files = req.files || [req.file]

        for (const file of files.filter(Boolean)) {
          try {
            await fs.unlink(file.path)
          } catch (cleanupError) {
            console.error('Failed to cleanup file:', cleanupError)
          }
        }

        console.error('File upload security error:', error)
        return res.status(400).json({
          error: 'File upload security check failed',
          details: error.message
        })
      }
    })
  }
}

// Middleware to clean up temporary files
const cleanupTempFiles = async (req, res, next) => {
  const originalSend = res.send

  res.send = function(...args) {
    // Clean up temp files after response
    setImmediate(async () => {
      const files = req.files || [req.file]

      for (const file of files.filter(Boolean)) {
        if (file.path && file.path.includes('/temp/')) {
          try {
            await fs.unlink(file.path)
          } catch (error) {
            console.error('Failed to cleanup temp file:', error)
          }
        }
      }
    })

    originalSend.apply(this, args)
  }

  next()
}

module.exports = {
  secureFileUpload,
  cleanupTempFiles,
  validateFileType,
  scanFileForMalware,
  sanitizeFile,
  generateSecureFilename,
  ALLOWED_FILE_TYPES
}