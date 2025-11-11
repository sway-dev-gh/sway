import { useCallback, useState } from 'react'
import { getErrorMessage, isNetworkError, isAuthError, isServerError } from '../lib/queryClient'

/**
 * Custom hook for handling errors consistently across the application
 * Provides error state management and error handling utilities
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null)
  const [isError, setIsError] = useState(false)

  /**
   * Handle an error - stores it in state and logs it
   */
  const handleError = useCallback((error, context = {}) => {
    // Set error state
    setError(error)
    setIsError(true)

    // Get formatted error message
    const message = getErrorMessage(error)

    // Log error with context
    console.error('Error handled:', {
      error,
      message,
      context,
      timestamp: new Date().toISOString(),
    })

    // Handle specific error types
    if (isAuthError(error)) {
      console.warn('Authentication error detected')
      // You might want to redirect to login or refresh token
      // Example: window.location.href = '/login'
    }

    if (isNetworkError(error)) {
      console.warn('Network error detected')
      // You might want to show an offline indicator
    }

    if (isServerError(error)) {
      console.warn('Server error detected')
      // You might want to show a maintenance message
    }

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // Example: logErrorToService(error, context)
    }

    return message
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
    setIsError(false)
  }, [])

  /**
   * Reset error handler
   */
  const reset = clearError

  /**
   * Get formatted error message from current error
   */
  const errorMessage = error ? getErrorMessage(error) : null

  /**
   * Check if error is a specific type
   */
  const errorType = {
    isNetwork: error ? isNetworkError(error) : false,
    isAuth: error ? isAuthError(error) : false,
    isServer: error ? isServerError(error) : false,
  }

  return {
    // State
    error,
    isError,
    errorMessage,
    errorType,

    // Methods
    handleError,
    clearError,
    reset,
  }
}

/**
 * Higher-order function to wrap async functions with error handling
 * Usage: const safeFunction = withErrorHandler(asyncFunction, errorHandler)
 */
export const withErrorHandler = (fn, errorHandler) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (errorHandler) {
        errorHandler(error)
      }
      throw error
    }
  }
}

/**
 * Hook for handling async operations with error handling
 * Returns a wrapped function that automatically handles errors
 */
export const useAsyncErrorHandler = () => {
  const { handleError } = useErrorHandler()

  const wrapAsync = useCallback(
    (fn) => {
      return async (...args) => {
        try {
          return await fn(...args)
        } catch (error) {
          handleError(error)
          throw error
        }
      }
    },
    [handleError]
  )

  return { wrapAsync }
}

/**
 * Hook for handling errors with toast notifications
 * Requires useToast hook to be available
 */
export const useErrorToast = () => {
  const { handleError } = useErrorHandler()

  const handleErrorWithToast = useCallback(
    (error, toast) => {
      const message = handleError(error)

      // Show toast if toast function is provided
      if (toast && typeof toast.error === 'function') {
        toast.error(message)
      }

      return message
    },
    [handleError]
  )

  return { handleErrorWithToast }
}

export default useErrorHandler
