/**
 * Comprehensive Input Validation & Sanitization Middleware
 * Stripe-level security for all user inputs
 */

const validator = require('validator');
const xss = require('xss');
const rateLimit = require('express-rate-limit');

// Input sanitization functions
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  // Remove XSS attacks
  let sanitized = xss(str, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}
  });

  // Remove SQL injection patterns
  sanitized = sanitized.replace(/['";\\]/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';

  // Basic sanitization
  let sanitized = email.toLowerCase().trim();

  // Validate email format
  if (!validator.isEmail(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
};

const sanitizePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  // Check password strength - simple 8 character minimum
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  return password; // Don't sanitize passwords, just validate
};

const sanitizeUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return '';

  const sanitized = uuid.trim();

  if (!validator.isUUID(sanitized, 4)) {
    throw new Error('Invalid UUID format');
  }

  return sanitized;
};

const sanitizeInteger = (value, min = null, max = null) => {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    throw new Error('Invalid integer value');
  }

  if (min !== null && num < min) {
    throw new Error(`Value must be at least ${min}`);
  }

  if (max !== null && num > max) {
    throw new Error(`Value must be at most ${max}`);
  }

  return num;
};

const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') return '';

  const sanitized = url.trim();

  if (!validator.isURL(sanitized, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true
  })) {
    throw new Error('Invalid URL format');
  }

  return sanitized;
};

// Validation schemas for different endpoints
const validationSchemas = {
  auth: {
    signup: {
      name: { type: 'string', maxLength: 100, required: true },
      email: { type: 'email', required: true },
      password: { type: 'password', required: true }
    },
    login: {
      email: { type: 'email', required: true },
      password: { type: 'password', required: true }
    }
  },

  projects: {
    create: {
      title: { type: 'string', maxLength: 255, required: true },
      description: { type: 'string', maxLength: 5000 },
      client_link: { type: 'url' },
      project_type: { type: 'enum', values: ['review', 'collaboration', 'shared_folder'] },
      visibility: { type: 'enum', values: ['private', 'team', 'public'] },
      workspace_type: { type: 'enum', values: ['review', 'approval', 'creative', 'code', 'general'] },
      workflow_template: { type: 'enum', values: ['standard', 'fast', 'thorough', 'custom'] }
    },
    update: {
      title: { type: 'string', maxLength: 255 },
      description: { type: 'string', maxLength: 5000 },
      client_link: { type: 'url' }
    }
  },

  files: {
    upload: {
      filename: { type: 'string', maxLength: 255, required: true },
      filesize: { type: 'integer', min: 1, max: 100 * 1024 * 1024 } // 100MB max
    }
  }
};

// Main validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const errors = [];

      // Validate and sanitize each field
      Object.keys(schema).forEach(field => {
        const rules = schema[field];
        let value = req.body[field];

        // Check if required field is missing
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          return;
        }

        // Skip validation if field is optional and not provided
        if (!rules.required && (value === undefined || value === null)) {
          return;
        }

        // Convert empty strings to null for optional fields
        if (value === '' && !rules.required) {
          req.body[field] = null;
          return;
        }

        try {
          // Validate and sanitize based on type
          switch (rules.type) {
            case 'string':
              value = sanitizeString(value);
              if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`${field} must be at most ${rules.maxLength} characters`);
              }
              break;

            case 'email':
              value = sanitizeEmail(value);
              break;

            case 'password':
              value = sanitizePassword(value);
              break;

            case 'uuid':
              value = sanitizeUUID(value);
              break;

            case 'integer':
              value = sanitizeInteger(value, rules.min, rules.max);
              break;

            case 'url':
              if (value) { // Only validate if provided
                value = sanitizeURL(value);
              }
              break;

            case 'enum':
              if (rules.values && !rules.values.includes(value)) {
                errors.push(`${field} must be one of: ${rules.values.join(', ')}`);
              }
              break;

            default:
              value = sanitizeString(value);
          }

          // Update the sanitized value
          req.body[field] = value;

        } catch (validationError) {
          errors.push(`${field}: ${validationError.message}`);
        }
      });

      // Return validation errors
      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
          received: Object.keys(req.body)
        });
      }

      next();

    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
};

// Specific validation middleware for common endpoints
const validateAuth = {
  signup: validateInput(validationSchemas.auth.signup),
  login: validateInput(validationSchemas.auth.login)
};

const validateProjects = {
  create: validateInput(validationSchemas.projects.create),
  update: validateInput(validationSchemas.projects.update)
};

const validateFiles = {
  upload: validateInput(validationSchemas.files.upload)
};

// Rate limiting for validation failures (anti-brute force) - relaxed for testing
const validationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 validation failures per window (very generous)
  message: { error: 'Too many validation failures. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip in development or if successful request
    return process.env.NODE_ENV !== 'production' || res.statusCode < 400;
  }
});

module.exports = {
  validateInput,
  validateAuth,
  validateProjects,
  validateFiles,
  validationRateLimit,
  sanitizeString,
  sanitizeEmail,
  sanitizePassword,
  sanitizeUUID,
  sanitizeInteger,
  sanitizeURL
};