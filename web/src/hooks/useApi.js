import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useErrorHandler } from './useErrorHandler'
import { getErrorMessage } from '../lib/queryClient'

/**
 * Enhanced useQuery wrapper with built-in error handling
 */
export const useApiQuery = (queryKey, queryFn, options = {}) => {
  const { handleError } = useErrorHandler()

  const query = useQuery({
    queryKey,
    queryFn: async (...args) => {
      try {
        return await queryFn(...args)
      } catch (error) {
        handleError(error, { queryKey, type: 'query' })
        throw error
      }
    },
    ...options,
    onError: (error) => {
      // Call custom onError if provided
      if (options.onError) {
        options.onError(error)
      }
    },
  })

  return {
    ...query,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}

/**
 * Enhanced useMutation wrapper with built-in error handling
 */
export const useApiMutation = (mutationFn, options = {}) => {
  const { handleError } = useErrorHandler()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables)
      } catch (error) {
        handleError(error, { variables, type: 'mutation' })
        throw error
      }
    },
    ...options,
    onError: (error, variables, context) => {
      // Call custom onError if provided
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate queries if specified
      if (options.invalidateQueries) {
        const queries = Array.isArray(options.invalidateQueries)
          ? options.invalidateQueries
          : [options.invalidateQueries]

        queries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey })
        })
      }

      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
  })

  return {
    ...mutation,
    errorMessage: mutation.error ? getErrorMessage(mutation.error) : null,
  }
}

/**
 * Hook for fetching data with automatic error handling and loading states
 * Returns data, loading state, error state, and refetch function
 */
export const useFetch = (queryKey, queryFn, options = {}) => {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    errorMessage,
    refetch,
    isSuccess,
  } = useApiQuery(queryKey, queryFn, options)

  return {
    data: data ?? options.initialData ?? null,
    isLoading: isLoading || isFetching,
    isError,
    error,
    errorMessage,
    refetch,
    isSuccess,
  }
}

/**
 * Hook for mutations with automatic error handling and toast notifications
 * Requires toast to be passed or available from context
 */
export const useMutate = (mutationFn, options = {}) => {
  const {
    mutate,
    mutateAsync,
    isLoading,
    isError,
    error,
    errorMessage,
    data,
    isSuccess,
    reset,
  } = useApiMutation(mutationFn, options)

  return {
    mutate,
    mutateAsync,
    isLoading,
    isError,
    error,
    errorMessage,
    data,
    isSuccess,
    reset,
  }
}

/**
 * Hook for infinite queries (pagination, infinite scroll)
 */
export const useInfiniteApiQuery = (
  queryKey,
  queryFn,
  getNextPageParam,
  options = {}
) => {
  const { handleError } = useErrorHandler()

  return useQuery({
    queryKey,
    queryFn: async (context) => {
      try {
        return await queryFn(context)
      } catch (error) {
        handleError(error, { queryKey, type: 'infinite-query' })
        throw error
      }
    },
    getNextPageParam,
    ...options,
  })
}

/**
 * Hook for optimistic updates with automatic rollback on error
 */
export const useOptimisticMutation = (mutationFn, queryKey, options = {}) => {
  const queryClient = useQueryClient()

  return useApiMutation(mutationFn, {
    ...options,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey)

      // Optimistically update
      if (options.optimisticUpdate) {
        queryClient.setQueryData(queryKey, options.optimisticUpdate(previousData, variables))
      }

      // Call custom onMutate if provided
      if (options.onMutate) {
        await options.onMutate(variables)
      }

      return { previousData }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }

      // Call custom onError if provided
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey })

      // Call custom onSettled if provided
      if (options.onSettled) {
        options.onSettled()
      }
    },
  })
}

/**
 * Hook for dependent queries (query that depends on another query's result)
 */
export const useDependentQuery = (
  queryKey,
  queryFn,
  dependentData,
  options = {}
) => {
  return useApiQuery(queryKey, queryFn, {
    ...options,
    enabled: Boolean(dependentData) && (options.enabled !== false),
  })
}

/**
 * Hook for prefetching queries
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient()

  const prefetch = async (queryKey, queryFn) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
    })
  }

  return { prefetch }
}

export default {
  useApiQuery,
  useApiMutation,
  useFetch,
  useMutate,
  useInfiniteApiQuery,
  useOptimisticMutation,
  useDependentQuery,
  usePrefetch,
}
