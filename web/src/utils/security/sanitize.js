import DOMPurify from 'dompurify'

/**
 * Sanitize filename by removing path traversal attempts and dangerous characters
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export function sanitizeFileName(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename')
  }

  // Remove any path components (path traversal prevention)
  let sanitized = filename.replace(/^.*[\\\/]/, '')

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

  // Remove dangerous characters that could cause issues
  sanitized = sanitized.replace(/[<>:"|?*]/g, '')

  // Prevent hidden files (files starting with .)
  if (sanitized.startsWith('.')) {
    sanitized = sanitized.substring(1)
  }

  // Prevent empty filename
  if (!sanitized || sanitized.trim() === '') {
    throw new Error('Filename cannot be empty after sanitization')
  }

  // Limit filename length (255 is common filesystem limit)
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop()
    const name = sanitized.substring(0, 255 - ext.length - 1)
    sanitized = `${name}.${ext}`
  }

  return sanitized
}

/**
 * Validate file type against allowed types with MIME type checking
 * @param {File} file - File object to validate
 * @param {Array<string>} allowedTypes - Array of allowed type categories or specific MIME types
 * @returns {boolean} - True if file type is allowed
 */
export function validateFileType(file, allowedTypes = ['*']) {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file object')
  }

  // If all types are allowed
  if (allowedTypes.includes('*')) {
    return true
  }

  // MIME type mappings for categories
  const typeMappings = {
    image: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ],
    video: [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm'
    ],
    audio: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/flac'
    ],
    archive: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip'
    ]
  }

  // Build list of allowed MIME types
  let allowedMimeTypes = []

  for (const type of allowedTypes) {
    if (typeMappings[type]) {
      allowedMimeTypes.push(...typeMappings[type])
    } else if (type.includes('/')) {
      // Direct MIME type specified
      allowedMimeTypes.push(type)
    }
  }

  // Check MIME type from file object
  if (!allowedMimeTypes.includes(file.type)) {
    return false
  }

  // Additional extension validation as defense in depth
  const fileName = file.name.toLowerCase()
  const fileExt = '.' + fileName.split('.').pop()

  const extensionMap = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    document: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
    video: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
    archive: ['.zip', '.rar', '.7z', '.tar', '.gz']
  }

  let allowedExtensions = []
  for (const type of allowedTypes) {
    if (extensionMap[type]) {
      allowedExtensions.push(...extensionMap[type])
    }
  }

  if (allowedExtensions.length > 0 && !allowedExtensions.includes(fileExt)) {
    return false
  }

  // Deny dangerous executable extensions
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
    '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh',
    '.msi', '.jar', '.sh', '.bash', '.ps1', '.app'
  ]

  if (dangerousExtensions.includes(fileExt)) {
    return false
  }

  return true
}

/**
 * Validate file size against maximum allowed size
 * @param {File} file - File object to validate
 * @param {number} maxSize - Maximum size in bytes
 * @returns {boolean} - True if file size is within limit
 */
export function validateFileSize(file, maxSize) {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file object')
  }

  if (typeof maxSize !== 'number' || maxSize <= 0) {
    throw new Error('Invalid max size')
  }

  return file.size <= maxSize
}

/**
 * Sanitize HTML content using DOMPurify
 * @param {string} html - HTML content to sanitize
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHTML(html, options = {}) {
  if (typeof html !== 'string') {
    return ''
  }

  const defaultConfig = {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'embed', 'object'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  }

  const config = { ...defaultConfig, ...options }

  return DOMPurify.sanitize(html, config)
}

/**
 * Sanitize user text input (removes HTML but allows safe characters)
 * @param {string} input - User text input
 * @returns {string} - Sanitized text
 */
export function sanitizeTextInput(input) {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

  return sanitized.trim()
}

/**
 * Validate and sanitize email address
 * @param {string} email - Email address to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return null
  }

  // Remove whitespace
  const trimmed = email.trim().toLowerCase()

  // Basic email validation regex
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i

  if (!emailRegex.test(trimmed)) {
    return null
  }

  return trimmed
}

/**
 * Validate URL and ensure it's safe
 * @param {string} url - URL to validate
 * @param {Array<string>} allowedProtocols - Allowed URL protocols
 * @returns {boolean} - True if URL is safe
 */
export function validateURL(url, allowedProtocols = ['http:', 'https:']) {
  if (typeof url !== 'string') {
    return false
  }

  try {
    const parsed = new URL(url)
    return allowedProtocols.includes(parsed.protocol)
  } catch (e) {
    return false
  }
}

/**
 * Prevent XSS in user-generated content before rendering
 * @param {string} content - User content
 * @returns {string} - Safe content for rendering
 */
export function escapeHTML(content) {
  if (typeof content !== 'string') {
    return ''
  }

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }

  return content.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
}

/**
 * Validate custom field input based on field type
 * @param {string} value - Field value
 * @param {string} type - Field type (text, email, url, number, etc.)
 * @returns {string|null} - Sanitized value or null if invalid
 */
export function validateCustomField(value, type) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  switch (type) {
    case 'email':
      return sanitizeEmail(trimmed)

    case 'url':
      return validateURL(trimmed) ? trimmed : null

    case 'number':
      const num = parseFloat(trimmed)
      return !isNaN(num) ? num.toString() : null

    case 'text':
    case 'textarea':
    default:
      return sanitizeTextInput(trimmed)
  }
}

/**
 * Check for SVG-based XSS attacks
 * @param {File} file - File to check
 * @returns {Promise<boolean>} - True if file is safe
 */
export async function validateSVGSafety(file) {
  if (!file || file.type !== 'image/svg+xml') {
    return true // Not an SVG, skip check
  }

  try {
    const text = await file.text()

    // Check for script tags
    if (/<script[\s>]/i.test(text)) {
      return false
    }

    // Check for event handlers
    if (/on\w+\s*=/i.test(text)) {
      return false
    }

    // Check for javascript: URLs
    if (/javascript:/i.test(text)) {
      return false
    }

    // Check for data: URLs that might contain scripts
    if (/data:.*script/i.test(text)) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating SVG:', error)
    return false
  }
}

export default {
  sanitizeFileName,
  validateFileType,
  validateFileSize,
  sanitizeHTML,
  sanitizeTextInput,
  sanitizeEmail,
  validateURL,
  escapeHTML,
  validateCustomField,
  validateSVGSafety
}
