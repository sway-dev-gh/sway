/**
 * Comprehensive Error Handling Middleware
 * Stripe-level secure error handling without information leakage
 */

const crypto = require('crypto')

// Error types that are safe to expose to users
const SAFE_ERROR_TYPES = [
  'ValidationError',
  'CastError',
  'JsonWebTokenError',
  'TokenExpiredError',
  'MulterError'
]

// HTTP status codes and their safe messages
const SAFE_ERROR_MESSAGES = {
  400: 'Invalid request data',
  401: 'Authentication required',
  403: 'Access denied',
  404: 'Resource not found',
  409: 'Resource already exists',
  422: 'Invalid input data',
  429: 'Too many requests',
  500: 'Internal server error',
  502: 'Service temporarily unavailable',
  503: 'Service under maintenance'
}

// Generate unique error ID for tracking
const generateErrorId = () => {
  return crypto.randomBytes(8).toString('hex')
}

// Sanitize error message to prevent information leakage
const sanitizeErrorMessage = (error, isDevelopment = false) => {
  // If it's development, return more details but still sanitized
  if (isDevelopment) {
    return {
      type: error.name || 'Error',
      message: error.message || 'Unknown error occurred',
      code: error.code || null,
      field: error.path || error.field || null
    }
  }

  // Production: Return minimal, safe information only
  if (SAFE_ERROR_TYPES.includes(error.name)) {
    return {
      type: error.name,
      message: error.message || 'Invalid input',
      field: error.path || error.field || null
    }
  }

  // Default safe message for unknown errors
  return {
    type: 'Error',
    message: SAFE_ERROR_MESSAGES[500]
  }
}

// Log error details securely
const logError = async (error, req, errorId) => {
  try {
    const errorDetails = {
      errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      userId: req.userId || null,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl || req.url,
      body: req.method !== 'GET' ? JSON.stringify(req.body || {}) : null,
      query: JSON.stringify(req.query || {}),
      headers: {
        'content-type': req.get('Content-Type'),
        'authorization': req.get('Authorization') ? '[REDACTED]' : null,
        'x-forwarded-for': req.get('X-Forwarded-For')
      }
    }

    // In production, you'd send this to your logging service
    console.error('🚨 ERROR LOGGED:', {
      errorId: errorDetails.errorId,
      message: errorDetails.message,
      name: errorDetails.name,
      userId: errorDetails.userId,
      ip: errorDetails.ip,
      url: errorDetails.url,
      timestamp: errorDetails.timestamp
    })

    // Log full details only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full Error Details:', errorDetails)
    }

  } catch (loggingError) {
    console.error('Failed to log error:', loggingError.message)
  }
}

// Handle specific error types
const handleSpecificErrors = (error) => {
  // PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique constraint violation
        return {
          status: 409,
          name: 'ConflictError',
          message: 'Resource already exists'
        }
      case '23503': // Foreign key constraint violation
        return {
          status: 400,
          name: 'ValidationError',
          message: 'Invalid reference data'
        }
      case '23514': // Check constraint violation
        return {
          status: 400,
          name: 'ValidationError',
          message: 'Invalid data format'
        }
      case '42P01': // Table does not exist
        return {
          status: 500,
          name: 'DatabaseError',
          message: SAFE_ERROR_MESSAGES[500]
        }
      case '28P01': // Invalid password
        return {
          status: 401,
          name: 'AuthenticationError',
          message: 'Invalid credentials'
        }
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      status: 401,
      name: 'AuthenticationError',
      message: 'Invalid authentication token'
    }
  }

  if (error.name === 'TokenExpiredError') {
    return {
      status: 401,
      name: 'AuthenticationError',
      message: 'Authentication token expired'
    }
  }

  // Validation errors
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return {
      status: 400,
      name: 'ValidationError',
      message: error.message || 'Invalid input data'
    }
  }

  // File upload errors
  if (error.name === 'MulterError') {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return {
          status: 413,
          name: 'FileTooLargeError',
          message: 'File size exceeds maximum allowed'
        }
      case 'LIMIT_FILE_COUNT':
        return {
          status: 400,
          name: 'ValidationError',
          message: 'Too many files uploaded'
        }
      case 'LIMIT_UNEXPECTED_FILE':
        return {
          status: 400,
          name: 'ValidationError',
          message: 'Unexpected file field'
        }
      default:
        return {
          status: 400,
          name: 'ValidationError',
          message: 'File upload error'
        }
    }
  }

  // Rate limit errors
  if (error.message && error.message.includes('rate limit')) {
    return {
      status: 429,
      name: 'RateLimitError',
      message: 'Too many requests. Please try again later.'
    }
  }

  return null
}

// Main error handling middleware
const errorHandler = (error, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const errorId = generateErrorId()

  // Log the error
  logError(error, req, errorId).catch(console.error)

  // Handle specific error types
  const specificError = handleSpecificErrors(error)
  let status = specificError?.status || error.statusCode || 500
  let errorName = specificError?.name || error.name || 'Error'
  let errorMessage = specificError?.message || error.message || SAFE_ERROR_MESSAGES[status]

  // Ensure status is a valid HTTP code
  if (status < 100 || status >= 600) {
    status = 500
  }

  // Sanitize error details
  const sanitizedError = sanitizeErrorMessage({
    name: errorName,
    message: errorMessage,
    code: error.code,
    field: error.field || error.path
  }, isDevelopment)

  // Construct response
  const response = {
    success: false,
    error: sanitizedError.message,
    errorId: errorId,
    timestamp: new Date().toISOString()
  }

  // Add development-only information
  if (isDevelopment) {
    response.details = sanitizedError
    response.stack = error.stack
  }

  // Add field information for validation errors
  if (sanitizedError.field && (status === 400 || status === 422)) {
    response.field = sanitizedError.field
  }

  // Security headers for error responses
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  })

  res.status(status).json(response)
}

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  const errorId = generateErrorId()

  // Log 404 attempts for security monitoring
  logError({
    name: 'NotFoundError',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND'
  }, req, errorId).catch(console.error)

  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    errorId: errorId,
    timestamp: new Date().toISOString()
  })
}

// Async error wrapper for route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Error boundary for critical errors
const criticalErrorHandler = (error) => {
  console.error('🚨 CRITICAL ERROR - Application may be unstable:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  })

  // In production, you might want to:
  // - Send alerts to your monitoring service
  // - Gracefully shutdown the server
  // - Restart the application

  if (process.env.NODE_ENV === 'production') {
    // Log to external monitoring service
    // Implement graceful shutdown if needed
  }
}

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  criticalErrorHandler(error)
  process.exit(1) // Exit gracefully
})

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason)
  criticalErrorHandler(reason)
  process.exit(1) // Exit gracefully
})

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  generateErrorId,
  sanitizeErrorMessage,
  logError
}