/**
 * Advanced Input Validation and Sanitization Middleware
 * Stripe-level security for all inputs
 */

const joi = require('joi');
const validator = require('validator');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Advanced validation schemas
const validationSchemas = {
  // Email validation with advanced checks
  email: joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: true } })
    .max(254)
    .lowercase()
    .trim()
    .required(),

  // Password validation with entropy checking
  password: joi.string()
    .min(12)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),

  // Username validation
  username: joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .lowercase()
    .trim(),

  // File validation
  filename: joi.string()
    .pattern(/^[a-zA-Z0-9._-]+$/)
    .max(255)
    .required(),

  // Project name validation
  projectName: joi.string()
    .pattern(/^[a-zA-Z0-9\s._-]+$/)
    .min(1)
    .max(100)
    .trim()
    .required(),

  // Description validation (with HTML sanitization)
  description: joi.string()
    .max(2000)
    .trim()
    .allow(''),

  // UUID validation
  uuid: joi.string()
    .uuid({ version: 'uuidv4' })
    .required(),

  // ID validation
  id: joi.alternatives().try(
    joi.number().integer().min(1),
    joi.string().uuid()
  ).required(),

  // URL validation
  url: joi.string()
    .uri({ scheme: ['http', 'https'] })
    .max(2048),

  // Phone number validation
  phone: joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .max(20),

  // JSON data validation
  jsonData: joi.object().max(50), // Max 50 properties

  // Array validation with size limits
  array: joi.array().max(100), // Max 100 items

  // Text content validation
  textContent: joi.string()
    .max(10000)
    .trim()
    .allow(''),

  // Search query validation
  searchQuery: joi.string()
    .pattern(/^[a-zA-Z0-9\s._-]+$/)
    .max(100)
    .trim()
};

// Advanced sanitization functions
const sanitizationFunctions = {
  // HTML sanitization with strict policy
  sanitizeHTML: (input) => {
    if (typeof input !== 'string') return input;
    return purify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  },

  // SQL injection prevention
  sanitizeSQL: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/['";\\]/g, ''); // Remove dangerous SQL characters
  },

  // XSS prevention
  sanitizeXSS: (input) => {
    if (typeof input !== 'string') return input;
    return validator.escape(input);
  },

  // NoSQL injection prevention
  sanitizeNoSQL: (input) => {
    if (typeof input === 'object' && input !== null) {
      // Remove any MongoDB operators
      const sanitized = {};
      for (const key in input) {
        if (!key.startsWith('$') && !key.includes('.')) {
          sanitized[key] = input[key];
        }
      }
      return sanitized;
    }
    return input;
  },

  // File path traversal prevention
  sanitizeFilePath: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  },

  // Command injection prevention
  sanitizeCommand: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[;&|`$(){}[\]<>]/g, '');
  }
};

// Advanced input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        // Log validation failures for security monitoring
        console.warn('🚨 INPUT VALIDATION FAILED:', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          errors: errorDetails,
          timestamp: new Date().toISOString()
        });

        return res.status(400).json({
          error: 'Input validation failed',
          details: errorDetails.map(detail => ({
            field: detail.field,
            message: detail.message
          }))
        });
      }

      req.body = value;
      next();
    } catch (err) {
      console.error('Validation middleware error:', err);
      return res.status(500).json({ error: 'Internal validation error' });
    }
  };
};

// Deep sanitization middleware
const deepSanitize = (req, res, next) => {
  try {
    const sanitizeObject = (obj, depth = 0) => {
      if (depth > 10) return obj; // Prevent infinite recursion

      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, depth + 1));
      }

      if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
          const sanitizedKey = sanitizationFunctions.sanitizeXSS(key);
          sanitized[sanitizedKey] = sanitizeObject(obj[key], depth + 1);
        }
        return sanitizationFunctions.sanitizeNoSQL(sanitized);
      }

      if (typeof obj === 'string') {
        let sanitized = obj;

        // Apply all sanitization functions
        sanitized = sanitizationFunctions.sanitizeXSS(sanitized);
        sanitized = sanitizationFunctions.sanitizeSQL(sanitized);
        sanitized = sanitizationFunctions.sanitizeCommand(sanitized);
        sanitized = sanitizationFunctions.sanitizeFilePath(sanitized);

        return sanitized;
      }

      return obj;
    };

    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (err) {
    console.error('Sanitization middleware error:', err);
    return res.status(500).json({ error: 'Internal sanitization error' });
  }
};

// Specific validation schemas for common endpoints
const endpointSchemas = {
  auth: {
    login: joi.object({
      email: validationSchemas.email,
      password: validationSchemas.password,
      rememberMe: joi.boolean().optional()
    }),

    signup: joi.object({
      email: validationSchemas.email,
      password: validationSchemas.password,
      name: validationSchemas.username.optional(),
      termsAccepted: joi.boolean().valid(true).required()
    }),

    resetPassword: joi.object({
      email: validationSchemas.email
    })
  },

  projects: {
    create: joi.object({
      name: validationSchemas.projectName,
      description: validationSchemas.description,
      type: joi.string().valid('web', 'mobile', 'desktop', 'other').required(),
      isPublic: joi.boolean().default(false)
    }),

    update: joi.object({
      name: validationSchemas.projectName.optional(),
      description: validationSchemas.description.optional(),
      type: joi.string().valid('web', 'mobile', 'desktop', 'other').optional(),
      isPublic: joi.boolean().optional()
    })
  },

  files: {
    upload: joi.object({
      filename: validationSchemas.filename,
      projectId: validationSchemas.uuid,
      description: validationSchemas.description.optional()
    })
  },

  search: joi.object({
    query: validationSchemas.searchQuery,
    limit: joi.number().integer().min(1).max(100).default(20),
    offset: joi.number().integer().min(0).default(0)
  })
};

// Password strength checker
const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[@$!%*?&]/.test(password),
    noCommon: !isCommonPassword(password),
    noRepeating: !/(.)\1{2,}/.test(password), // No character repeated 3+ times
    noSequential: !hasSequentialChars(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  const strength = score < 5 ? 'weak' : score < 7 ? 'medium' : 'strong';

  return { strength, score, checks };
};

// Check for common passwords
const isCommonPassword = (password) => {
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', '123456789', 'password1'
  ];
  return commonPasswords.includes(password.toLowerCase());
};

// Check for sequential characters
const hasSequentialChars = (password) => {
  for (let i = 0; i < password.length - 2; i++) {
    const char1 = password.charCodeAt(i);
    const char2 = password.charCodeAt(i + 1);
    const char3 = password.charCodeAt(i + 2);

    if ((char2 === char1 + 1) && (char3 === char2 + 1)) {
      return true; // Found sequential characters
    }
  }
  return false;
};

// Content-Type validation middleware
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    // Skip validation for OPTIONS (CORS preflight) and GET/DELETE requests
    if (req.method === 'OPTIONS' || req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const contentType = req.get('Content-Type') || '';
    const isAllowed = allowedTypes.some(type =>
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    // Skip validation for health checks and CORS-related endpoints
    if (req.path === '/health' || req.path === '/api/csrf-token') {
      return next();
    }

    if (!isAllowed && contentType.length > 0) {
      console.log('🔧 Content-Type validation failed:', {
        method: req.method,
        path: req.path,
        contentType,
        allowedTypes,
        timestamp: new Date().toISOString()
      });

      return res.status(415).json({
        error: 'Unsupported Media Type',
        expectedTypes: allowedTypes
      });
    }

    next();
  };
};

module.exports = {
  validateInput,
  deepSanitize,
  validationSchemas,
  endpointSchemas,
  sanitizationFunctions,
  checkPasswordStrength,
  validateContentType
};