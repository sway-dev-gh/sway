/**
 * Standardized HTTP Response Helpers
 *
 * Ensures consistent response formats across the entire API.
 * Use these helpers to maintain consistent error and success response formats.
 */

/**
 * Standard Error Response Format
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 500, etc.)
 * @param {string} message - Error message for the client
 * @param {Object} [additionalData] - Optional additional data to include in response
 * @returns {Object} JSON response
 *
 * @example
 * return errorResponse(res, 400, 'Email is required')
 * return errorResponse(res, 401, 'Invalid credentials')
 * return errorResponse(res, 403, 'Access denied')
 * return errorResponse(res, 404, 'User not found')
 * return errorResponse(res, 500, 'Internal server error')
 */
function errorResponse(res, statusCode, message, additionalData = {}) {
  return res.status(statusCode).json({
    error: message,
    ...additionalData
  })
}

/**
 * Standard Success Response Format
 *
 * @param {Object} res - Express response object
 * @param {*} data - Data to send in response (object, array, etc.)
 * @param {string} [message] - Optional success message
 * @param {number} [statusCode=200] - HTTP status code (200, 201, etc.)
 * @returns {Object} JSON response
 *
 * @example
 * return successResponse(res, { user: userData })
 * return successResponse(res, users, 'Users retrieved successfully')
 * return successResponse(res, null, 'Account deleted', 204)
 */
function successResponse(res, data = null, message = null, statusCode = 200) {
  const response = { success: true }

  if (data !== null) {
    response.data = data
  }

  if (message) {
    response.message = message
  }

  return res.status(statusCode).json(response)
}

/**
 * Validation Error Response
 * Standardized format for input validation errors
 *
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {Object} [fields] - Field-specific validation errors
 * @returns {Object} JSON response
 *
 * @example
 * return validationError(res, 'Invalid input data', { email: 'Invalid format', password: 'Too short' })
 */
function validationError(res, message, fields = null) {
  const response = { error: message }

  if (fields) {
    response.fields = fields
  }

  return res.status(400).json(response)
}

/**
 * Authentication Error Response
 * Standardized format for authentication failures
 *
 * @param {Object} res - Express response object
 * @param {string} [message='Authentication required'] - Error message
 * @returns {Object} JSON response
 */
function authError(res, message = 'Authentication required') {
  return errorResponse(res, 401, message)
}

/**
 * Authorization Error Response
 * Standardized format for authorization failures
 *
 * @param {Object} res - Express response object
 * @param {string} [message='Access denied'] - Error message
 * @returns {Object} JSON response
 */
function forbiddenError(res, message = 'Access denied') {
  return errorResponse(res, 403, message)
}

/**
 * Not Found Error Response
 * Standardized format for resource not found errors
 *
 * @param {Object} res - Express response object
 * @param {string} [message='Resource not found'] - Error message
 * @returns {Object} JSON response
 */
function notFoundError(res, message = 'Resource not found') {
  return errorResponse(res, 404, message)
}

/**
 * Internal Server Error Response
 * Standardized format for server errors
 *
 * @param {Object} res - Express response object
 * @param {string} [message='Internal server error'] - Error message
 * @returns {Object} JSON response
 */
function serverError(res, message = 'Internal server error') {
  return errorResponse(res, 500, message)
}

/**
 * Created Response
 * Standardized format for resource creation success
 *
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} [message] - Success message
 * @returns {Object} JSON response
 */
function createdResponse(res, data, message = null) {
  return successResponse(res, data, message, 201)
}

module.exports = {
  errorResponse,
  successResponse,
  validationError,
  authError,
  forbiddenError,
  notFoundError,
  serverError,
  createdResponse
}

/**
 * API RESPONSE STANDARDS
 *
 * === ERROR RESPONSES ===
 * All error responses MUST follow this format:
 * {
 *   "error": "Human readable error message"
 * }
 *
 * Additional fields may be included for specific endpoints:
 * {
 *   "error": "Validation failed",
 *   "fields": {
 *     "email": "Invalid format",
 *     "password": "Too short"
 *   }
 * }
 *
 * === SUCCESS RESPONSES ===
 * Success responses should follow one of these formats:
 *
 * 1. Data only (for simple responses):
 * {
 *   "id": "123",
 *   "name": "John Doe"
 * }
 *
 * 2. Structured success (for complex responses):
 * {
 *   "success": true,
 *   "data": { ... },
 *   "message": "Operation completed successfully"
 * }
 *
 * === STATUS CODES ===
 * Use appropriate HTTP status codes:
 * - 200: OK (successful GET, PUT, PATCH)
 * - 201: Created (successful POST)
 * - 204: No Content (successful DELETE)
 * - 400: Bad Request (validation errors)
 * - 401: Unauthorized (authentication required)
 * - 403: Forbidden (insufficient permissions)
 * - 404: Not Found (resource doesn't exist)
 * - 500: Internal Server Error (server-side errors)
 *
 * === MIGRATION GUIDE ===
 *
 * Old inconsistent patterns to replace:
 *
 * ❌ DON'T USE:
 * res.status(400).json({ message: 'Error' })
 * res.status(500).json({ msg: 'Failed' })
 * res.status(200).json({ result: data })
 *
 * ✅ USE INSTEAD:
 * errorResponse(res, 400, 'Error message')
 * serverError(res, 'Operation failed')
 * successResponse(res, data)
 */