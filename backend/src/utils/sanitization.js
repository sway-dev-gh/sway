const validator = require('validator');
const escapeHtml = require('escape-html');
const xss = require('xss');

/**
 * Backend Input Sanitization Utilities
 * Comprehensive XSS and injection prevention for server-side processing
 */

// Configure XSS module with strict settings
const xssOptions = {
  whiteList: {
    // Allow only safe HTML tags for rich text content
    'p': [],
    'br': [],
    'strong': [],
    'em': [],
    'u': [],
    'code': [],
    'pre': [],
    'blockquote': [],
    'ol': [],
    'ul': [],
    'li': [],
    'h1': [], 'h2': [], 'h3': [], 'h4': [], 'h5': [], 'h6': []
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
  allowCommentTag: false,
  onIgnoreTag: function(tag, html, options) {
    // Log potential XSS attempts
    console.warn(`XSS attempt detected: ${tag} in ${html.slice(0, 100)}...`);
    return '';
  },
  onTagAttr: function(tag, name, value, isWhiteAttr) {
    // Block all attributes for maximum security
    return '';
  },
  css: false, // Disable CSS processing
  js: false   // Disable JavaScript processing
};

/**
 * Remove null bytes and control characters
 * @param {string} input - Raw input string
 * @returns {string} - Cleaned string
 */
function removeControlCharacters(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Sanitize plain text content (no HTML allowed)
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length (default: 1000)
 * @returns {string} - Sanitized plain text
 */
function sanitizeText(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const cleaned = removeControlCharacters(input);

  // Escape HTML entities
  const escaped = escapeHtml(cleaned);

  // Limit length
  return escaped.slice(0, maxLength);
}

/**
 * Sanitize rich text content (allow basic HTML tags)
 * @param {string} input - Raw HTML content
 * @param {number} maxLength - Maximum allowed length (default: 5000)
 * @returns {string} - Sanitized HTML content
 */
function sanitizeHTML(input, maxLength = 5000) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const cleaned = removeControlCharacters(input);

  // Use XSS filter with strict whitelist
  const sanitized = xss(cleaned, xssOptions);

  // Limit length
  return sanitized.slice(0, maxLength);
}

/**
 * Sanitize user names and display names
 * @param {string} input - Raw name input
 * @param {number} maxLength - Maximum allowed length (default: 100)
 * @returns {string} - Sanitized name
 */
function sanitizeName(input, maxLength = 100) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return removeControlCharacters(input)
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove dangerous characters
    .replace(/[<>{}[\]\\|`~!@#$%^&*()+=]/g, '')
    // Allow only letters, numbers, spaces, hyphens, apostrophes, periods
    .replace(/[^a-zA-Z0-9\s\-'\.]/g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Limit length
    .slice(0, maxLength)
    .trim();
}

/**
 * Sanitize email addresses
 * @param {string} input - Raw email input
 * @returns {string} - Sanitized email or empty string if invalid
 */
function sanitizeEmail(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const cleaned = removeControlCharacters(input)
    .toLowerCase()
    .trim();

  // Validate and normalize email
  if (validator.isEmail(cleaned, {
    allow_display_name: false,
    require_display_name: false,
    allow_utf8_local_part: false,
    require_tld: true,
    blacklisted_chars: '<>()[]\\;:,@"',
    ignore_max_length: false
  })) {
    return cleaned;
  }

  return '';
}

/**
 * Sanitize URLs
 * @param {string} input - Raw URL input
 * @returns {string} - Sanitized URL or empty string if invalid
 */
function sanitizeURL(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const cleaned = removeControlCharacters(input).trim();

  // Only allow safe protocols
  if (validator.isURL(cleaned, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false
  })) {
    return cleaned;
  }

  return '';
}

/**
 * Sanitize file names and project names
 * @param {string} input - Raw file name
 * @param {number} maxLength - Maximum allowed length (default: 255)
 * @returns {string} - Sanitized file name
 */
function sanitizeFileName(input, maxLength = 255) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return removeControlCharacters(input)
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove dangerous characters for file systems
    .replace(/[<>:"|?*\x00-\x1f]/g, '')
    // Remove leading/trailing spaces and dots
    .replace(/^[\s\.]+|[\s\.]+$/g, '')
    // Limit length
    .slice(0, maxLength)
    .trim();
}

/**
 * Sanitize comments and descriptions (allow basic formatting)
 * @param {string} input - Raw comment/description input
 * @param {number} maxLength - Maximum allowed length (default: 5000)
 * @returns {string} - Sanitized content
 */
function sanitizeComment(input, maxLength = 5000) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First remove dangerous content manually
  let cleaned = removeControlCharacters(input)
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove data: protocols
    .replace(/data:/gi, '')
    // Remove vbscript: protocols
    .replace(/vbscript:/gi, '');

  // Apply XSS filtering with limited HTML support
  cleaned = xss(cleaned, {
    ...xssOptions,
    whiteList: {
      'p': [],
      'br': [],
      'strong': [],
      'em': [],
      'u': []
    }
  });

  // Limit length
  return cleaned.slice(0, maxLength);
}

/**
 * Sanitize JSON data (for JSONB fields)
 * @param {*} input - Raw JSON input
 * @param {number} maxDepth - Maximum nesting depth (default: 5)
 * @returns {*} - Sanitized JSON data
 */
function sanitizeJSON(input, maxDepth = 5) {
  if (input === null || input === undefined) {
    return null;
  }

  // Prevent overly deep nesting
  if (maxDepth <= 0) {
    return null;
  }

  if (typeof input === 'string') {
    return sanitizeText(input, 1000);
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    return input
      .slice(0, 100) // Limit array length
      .map(item => sanitizeJSON(item, maxDepth - 1))
      .filter(item => item !== null);
  }

  if (typeof input === 'object') {
    const sanitized = {};
    let keyCount = 0;

    for (const [key, value] of Object.entries(input)) {
      // Limit number of keys
      if (keyCount >= 50) break;

      const sanitizedKey = sanitizeName(key, 100);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeJSON(value, maxDepth - 1);
        keyCount++;
      }
    }

    return sanitized;
  }

  return null;
}

/**
 * Comprehensive input sanitizer - automatically detects content type
 * @param {string} input - Raw user input
 * @param {string} type - Content type
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized content
 */
function sanitizeInput(input, type = 'text', maxLength = null) {
  switch (type.toLowerCase()) {
    case 'html':
      return sanitizeHTML(input, maxLength || 5000);
    case 'text':
      return sanitizeText(input, maxLength || 1000);
    case 'name':
      return sanitizeName(input, maxLength || 100);
    case 'comment':
    case 'description':
      return sanitizeComment(input, maxLength || 5000);
    case 'email':
      return sanitizeEmail(input);
    case 'url':
      return sanitizeURL(input);
    case 'filename':
    case 'projectname':
      return sanitizeFileName(input, maxLength || 255);
    case 'json':
      return sanitizeJSON(input);
    default:
      return sanitizeText(input, maxLength || 1000);
  }
}

/**
 * Validate and sanitize request body
 * @param {object} body - Request body object
 * @param {object} schema - Validation schema
 * @returns {object} - Sanitized body
 */
function sanitizeRequestBody(body, schema = {}) {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [field, config] of Object.entries(schema)) {
    if (body.hasOwnProperty(field)) {
      const type = config.type || 'text';
      const maxLength = config.maxLength || null;
      const required = config.required || false;

      const sanitizedValue = sanitizeInput(body[field], type, maxLength);

      if (required && !sanitizedValue) {
        throw new Error(`Required field '${field}' is missing or invalid`);
      }

      if (sanitizedValue || !required) {
        sanitized[field] = sanitizedValue;
      }
    } else if (schema[field].required) {
      throw new Error(`Required field '${field}' is missing`);
    }
  }

  return sanitized;
}

/**
 * SQL injection prevention - escape SQL identifiers
 * @param {string} identifier - SQL identifier (table name, column name)
 * @returns {string} - Escaped identifier
 */
function escapeSQLIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Invalid SQL identifier');
  }

  // Only allow alphanumeric characters and underscores
  const cleaned = identifier.replace(/[^a-zA-Z0-9_]/g, '');

  if (cleaned.length === 0 || cleaned.length > 63) {
    throw new Error('Invalid SQL identifier length');
  }

  // Ensure it doesn't start with a number
  if (/^[0-9]/.test(cleaned)) {
    throw new Error('SQL identifier cannot start with a number');
  }

  return cleaned;
}

/**
 * Log potential security threats
 * @param {string} threat - Type of threat detected
 * @param {string} input - Original input that triggered the warning
 * @param {object} metadata - Additional metadata
 */
function logSecurityThreat(threat, input, metadata = {}) {
  console.warn(`[SECURITY] ${threat} detected:`, {
    input: input ? input.slice(0, 200) : 'N/A',
    timestamp: new Date().toISOString(),
    ...metadata
  });

  // In production, you might want to send this to a security monitoring service
  // securityMonitor.alert(threat, input, metadata);
}

module.exports = {
  sanitizeText,
  sanitizeHTML,
  sanitizeName,
  sanitizeEmail,
  sanitizeURL,
  sanitizeFileName,
  sanitizeComment,
  sanitizeJSON,
  sanitizeInput,
  sanitizeRequestBody,
  escapeSQLIdentifier,
  logSecurityThreat,
  removeControlCharacters,

  // Validation schemas for common endpoints
  schemas: {
    comment: {
      comment_text: { type: 'comment', maxLength: 5000, required: true },
      commenter_name: { type: 'name', maxLength: 100, required: false },
      commenter_email: { type: 'email', required: false },
      comment_type: { type: 'text', maxLength: 50, required: false }
    },
    project: {
      name: { type: 'name', maxLength: 255, required: true },
      description: { type: 'description', maxLength: 5000, required: false }
    },
    user: {
      name: { type: 'name', maxLength: 100, required: true },
      email: { type: 'email', required: true },
      display_name: { type: 'name', maxLength: 100, required: false }
    },
    file: {
      name: { type: 'filename', maxLength: 255, required: true },
      description: { type: 'description', maxLength: 2000, required: false }
    }
  }
};