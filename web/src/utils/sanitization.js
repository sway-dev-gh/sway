import DOMPurify from 'dompurify';

/**
 * Comprehensive XSS Protection Utilities
 * Prevents Cross-Site Scripting attacks by sanitizing user input
 */

// Configure DOMPurify with secure defaults
const purifyConfig = {
  // Allow only safe HTML tags
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
    'blockquote', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],
  // Allow only safe attributes
  ALLOWED_ATTR: ['class', 'id'],
  // Remove all scripts and event handlers
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: [
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
    'onkeyup', 'onkeypress', 'style', 'src', 'href'
  ],
  // Keep content safe
  KEEP_CONTENT: false,
  // Return sanitized content as string
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
};

/**
 * Sanitize HTML content for safe rendering
 * @param {string} input - Raw user input that may contain HTML
 * @returns {string} - Sanitized HTML safe for rendering
 */
export const sanitizeHTML = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  const cleaned = input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();

  // Use DOMPurify to sanitize HTML
  return DOMPurify.sanitize(cleaned, purifyConfig);
};

/**
 * Sanitize plain text content (no HTML allowed)
 * @param {string} input - Raw user input
 * @returns {string} - Escaped plain text safe for rendering
 */
export const sanitizeText = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove null bytes and dangerous characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Sanitize user names (alphanumeric, spaces, basic punctuation only)
 * @param {string} input - Raw name input
 * @returns {string} - Sanitized name
 */
export const sanitizeName = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove dangerous characters
    .replace(/[<>{}[\]\\|`~!@#$%^&*()+=]/g, '')
    // Allow only safe characters: letters, numbers, spaces, hyphens, apostrophes, periods
    .replace(/[^a-zA-Z0-9\s\-'\.]/g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Limit length
    .slice(0, 100)
    .trim();
};

/**
 * Sanitize descriptions and comments (allow basic formatting)
 * @param {string} input - Raw description/comment input
 * @returns {string} - Sanitized content with basic HTML allowed
 */
export const sanitizeDescription = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First pass: remove dangerous content
  const cleaned = input
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove data: protocols
    .replace(/data:/gi, '')
    // Remove vbscript: protocols
    .replace(/vbscript:/gi, '')
    .trim();

  // Use DOMPurify with description-appropriate config
  return DOMPurify.sanitize(cleaned, {
    ...purifyConfig,
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: [],
    // Limit length for descriptions
  }).slice(0, 5000);
};

/**
 * Sanitize file names and project names
 * @param {string} input - Raw file/project name
 * @returns {string} - Sanitized file name
 */
export const sanitizeFileName = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/\//g, '')
    .replace(/\\/g, '')
    // Remove dangerous characters
    .replace(/[<>:"|?*\x00-\x1f]/g, '')
    // Remove leading/trailing spaces and dots
    .replace(/^[\s\.]+|[\s\.]+$/g, '')
    // Limit length
    .slice(0, 255)
    .trim();
};

/**
 * Sanitize email addresses
 * @param {string} input - Raw email input
 * @returns {string} - Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  const cleaned = input
    .trim()
    .toLowerCase()
    // Remove dangerous characters
    .replace(/[<>{}[\]\\|`~!@#$%^&*()+=]/g, '');

  return emailRegex.test(cleaned) ? cleaned : '';
};

/**
 * Sanitize URLs (ensure they're safe)
 * @param {string} input - Raw URL input
 * @returns {string} - Sanitized URL or empty string if unsafe
 */
export const sanitizeURL = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    const url = new URL(input.trim());

    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (!allowedProtocols.includes(url.protocol)) {
      return '';
    }

    // Remove dangerous characters from URL
    const sanitized = url.toString()
      .replace(/[<>{}[\]\\|`~]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '');

    return sanitized;
  } catch {
    return '';
  }
};

/**
 * Comprehensive input sanitizer - automatically detects content type
 * @param {string} input - Raw user input
 * @param {string} type - Content type: 'html', 'text', 'name', 'description', 'filename', 'email', 'url'
 * @returns {string} - Sanitized content
 */
export const sanitizeInput = (input, type = 'text') => {
  switch (type.toLowerCase()) {
    case 'html':
      return sanitizeHTML(input);
    case 'text':
      return sanitizeText(input);
    case 'name':
      return sanitizeName(input);
    case 'description':
    case 'comment':
      return sanitizeDescription(input);
    case 'filename':
    case 'projectname':
      return sanitizeFileName(input);
    case 'email':
      return sanitizeEmail(input);
    case 'url':
      return sanitizeURL(input);
    default:
      // Default to text sanitization for unknown types
      return sanitizeText(input);
  }
};

/**
 * React-safe HTML rendering component helper
 * @param {string} htmlContent - Sanitized HTML content
 * @returns {object} - Props for dangerouslySetInnerHTML
 */
export const createSafeHTML = (htmlContent) => {
  const sanitized = sanitizeHTML(htmlContent);
  return { __html: sanitized };
};

/**
 * Batch sanitize an object's properties
 * @param {object} obj - Object with properties to sanitize
 * @param {object} typeMap - Map of property names to sanitization types
 * @returns {object} - Object with sanitized properties
 */
export const sanitizeObject = (obj, typeMap = {}) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const type = typeMap[key] || 'text';
      sanitized[key] = sanitizeInput(value, type);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeName,
  sanitizeDescription,
  sanitizeFileName,
  sanitizeEmail,
  sanitizeURL,
  sanitizeInput,
  createSafeHTML,
  sanitizeObject
};