import { QueryClient } from '@tanstack/react-query'

// Default options for all queries
const defaultQueryOptions = {
  queries: {
    // Stale time: How long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000,

    // Cache time: How long unused data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000,

    // Retry configuration
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      // Retry up to 2 times for 5xx errors (server errors)
      return failureCount < 2
    },

    // Retry delay with exponential backoff
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus (disable in production if needed)
    refetchOnWindowFocus: import.meta.env.PROD ? false : true,

    // Refetch on mount if data is stale
    refetchOnMount: true,

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Network mode
    networkMode: 'online',
  },

  mutations: {
    // Retry mutations once
    retry: 1,

    // Network mode for mutations
    networkMode: 'online',

    // Global mutation error handler
    onError: (error) => {
      console.error('Mutation error:', error)

      // You can trigger a toast notification here
      // Example: toast.error(getErrorMessage(error))
    },
  },
}

// Create the query client with error handling
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,

  // Global query cache configuration
  queryCache: {
    onError: (error, query) => {
      // Log errors to console
      console.error('Query error:', {
        error,
        queryKey: query.queryKey,
        queryHash: query.queryHash,
      })

      // In production, you might want to send errors to a logging service
      if (import.meta.env.PROD) {
        // Example: logErrorToService(error, { queryKey: query.queryKey })
      }
    },

    onSuccess: (data, query) => {
      // Optional: Log successful queries in development
      if (import.meta.env.DEV) {
        console.log('Query success:', query.queryKey)
      }
    },
  },

  // Global mutation cache configuration
  mutationCache: {
    onError: (error, variables, context, mutation) => {
      console.error('Mutation error:', {
        error,
        variables,
        mutationKey: mutation.options.mutationKey,
      })

      // In production, log to error tracking service
      if (import.meta.env.PROD) {
        // Example: logErrorToService(error, { mutationKey: mutation.options.mutationKey })
      }
    },

    onSuccess: (data, variables, context, mutation) => {
      // Optional: Log successful mutations in development
      if (import.meta.env.DEV) {
        console.log('Mutation success:', mutation.options.mutationKey)
      }
    },
  },
})

// Utility function to invalidate queries
export const invalidateQueries = (queryKey) => {
  return queryClient.invalidateQueries({ queryKey })
}

// Utility function to refetch queries
export const refetchQueries = (queryKey) => {
  return queryClient.refetchQueries({ queryKey })
}

// Utility function to set query data
export const setQueryData = (queryKey, data) => {
  return queryClient.setQueryData(queryKey, data)
}

// Utility function to get query data
export const getQueryData = (queryKey) => {
  return queryClient.getQueryData(queryKey)
}

// Utility function to reset all queries
export const resetQueries = () => {
  return queryClient.resetQueries()
}

// Clear all cache
export const clearCache = () => {
  return queryClient.clear()
}

// Get error message from error object
export const getErrorMessage = (error) => {
  // API error with response
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  // API error with response (alternative structure)
  if (error?.response?.data?.error) {
    return error.response.data.error
  }

  // Network error
  if (error?.message === 'Network Error') {
    return 'Network error. Please check your connection.'
  }

  // Timeout error
  if (error?.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.'
  }

  // Generic error message
  if (error?.message) {
    return error.message
  }

  // Fallback
  return 'An unexpected error occurred. Please try again.'
}

// Check if error is a network error
export const isNetworkError = (error) => {
  return !error?.response && (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK')
}

// Check if error is an authentication error
export const isAuthError = (error) => {
  return error?.response?.status === 401 || error?.response?.status === 403
}

// Check if error is a server error
export const isServerError = (error) => {
  return error?.response?.status >= 500
}

export default queryClient
