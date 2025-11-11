# Error Handling and API Hooks - Usage Guide

This guide explains how to use the error handling infrastructure in the Sway application.

## Table of Contents
- [Error Boundary](#error-boundary)
- [React Query Setup](#react-query-setup)
- [useErrorHandler Hook](#useerrorhandler-hook)
- [useApi Hooks](#useapi-hooks)
- [Examples](#examples)

## Error Boundary

The `ErrorBoundary` component catches React errors and displays a user-friendly error page.

### Features
- Catches and logs all React component errors
- Beautiful dark-themed error UI
- "Reset" and "Reload" buttons for recovery
- Development mode shows detailed error stack traces
- Production mode logs errors to console (ready for error tracking services)

### Already Implemented
The ErrorBoundary is already wrapping the entire app in `App.jsx`. All component errors are automatically caught.

## React Query Setup

React Query is configured with production-ready defaults in `lib/queryClient.js`.

### Default Configuration
- **Stale Time**: 5 minutes (how long data is considered fresh)
- **Cache Time**: 10 minutes (how long unused data stays in cache)
- **Retry Logic**: Smart retry for 5xx errors, no retry for 4xx errors
- **Exponential Backoff**: Automatic retry delays

### Already Implemented
QueryClientProvider wraps the entire app in `App.jsx`.

## useErrorHandler Hook

Custom hook for handling errors consistently.

### Basic Usage

```jsx
import { useErrorHandler } from '../hooks/useErrorHandler'

function MyComponent() {
  const { error, isError, errorMessage, handleError, clearError } = useErrorHandler()

  const handleClick = async () => {
    try {
      await someApiCall()
    } catch (err) {
      handleError(err, { context: 'button click' })
    }
  }

  if (isError) {
    return <div>Error: {errorMessage}</div>
  }

  return <button onClick={handleClick}>Click Me</button>
}
```

### API

```javascript
const {
  error,          // The raw error object
  isError,        // Boolean - is there an error?
  errorMessage,   // Formatted user-friendly error message
  errorType,      // { isNetwork, isAuth, isServer }
  handleError,    // Function to handle an error
  clearError,     // Function to clear error state
  reset,          // Alias for clearError
} = useErrorHandler()
```

## useApi Hooks

Enhanced React Query hooks with built-in error handling.

### useFetch - For GET Requests

```jsx
import { useFetch } from '../hooks/useApi'

function RequestsList() {
  const { data, isLoading, isError, errorMessage, refetch } = useFetch(
    ['requests'],                    // Query key
    async () => {                    // Query function
      const response = await fetch('/api/requests')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    {
      staleTime: 2 * 60 * 1000,     // Optional: override defaults
      retry: 3,                      // Optional: custom retry count
    }
  )

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {errorMessage}</div>

  return (
    <div>
      {data.map(request => (
        <div key={request.id}>{request.title}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}
```

### useMutate - For POST/PUT/DELETE Requests

```jsx
import { useMutate } from '../hooks/useApi'

function CreateRequestForm() {
  const { mutate, isLoading, isError, errorMessage, isSuccess } = useMutate(
    async (data) => {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create')
      return response.json()
    },
    {
      invalidateQueries: ['requests'],  // Automatically refetch requests after success
      onSuccess: (data) => {
        console.log('Request created:', data)
      },
      onError: (error) => {
        console.error('Failed to create request:', error)
      }
    }
  )

  const handleSubmit = (formData) => {
    mutate(formData)
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit({ title: e.target.title.value })
    }}>
      <input name="title" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Request'}
      </button>
      {isError && <div className="error">{errorMessage}</div>}
      {isSuccess && <div className="success">Request created!</div>}
    </form>
  )
}
```

### useApiQuery - Advanced Query Hook

```jsx
import { useApiQuery } from '../hooks/useApi'

function RequestDetails({ id }) {
  const { data, isLoading, error, errorMessage, refetch } = useApiQuery(
    ['request', id],
    async () => {
      const response = await fetch(`/api/requests/${id}`)
      if (!response.ok) throw new Error('Failed to fetch request')
      return response.json()
    },
    {
      enabled: Boolean(id),           // Only run when id exists
      staleTime: 5 * 60 * 1000,      // 5 minutes
      cacheTime: 10 * 60 * 1000,     // 10 minutes
      retry: 2,
      onSuccess: (data) => {
        console.log('Request loaded:', data)
      },
      onError: (error) => {
        console.error('Failed to load request:', error)
      }
    }
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {errorMessage}</div>

  return <div>{data.title}</div>
}
```

### useApiMutation - Advanced Mutation Hook

```jsx
import { useApiMutation } from '../hooks/useApi'

function DeleteRequestButton({ id }) {
  const { mutate, isLoading } = useApiMutation(
    async (requestId) => {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete')
      return response.json()
    },
    {
      invalidateQueries: ['requests'],
      onSuccess: () => {
        alert('Request deleted!')
      }
    }
  )

  return (
    <button
      onClick={() => mutate(id)}
      disabled={isLoading}
    >
      {isLoading ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```

### useOptimisticMutation - For Instant UI Updates

```jsx
import { useOptimisticMutation } from '../hooks/useApi'

function ToggleFavorite({ requestId, isFavorite }) {
  const { mutate, isLoading } = useOptimisticMutation(
    async (id) => {
      const response = await fetch(`/api/requests/${id}/favorite`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to toggle favorite')
      return response.json()
    },
    ['requests'],
    {
      optimisticUpdate: (oldData, id) => {
        // Immediately update UI
        return oldData.map(request =>
          request.id === id
            ? { ...request, isFavorite: !request.isFavorite }
            : request
        )
      }
    }
  )

  return (
    <button onClick={() => mutate(requestId)}>
      {isFavorite ? '★' : '☆'}
    </button>
  )
}
```

## Examples

### Complete Example: Requests Page with Error Handling

```jsx
import { useFetch, useMutate } from '../hooks/useApi'
import { useErrorHandler } from '../hooks/useErrorHandler'

function RequestsPage() {
  // Fetch requests
  const {
    data: requests,
    isLoading,
    isError,
    errorMessage,
    refetch
  } = useFetch(
    ['requests'],
    async () => {
      const response = await fetch('/api/requests')
      if (!response.ok) throw new Error('Failed to fetch requests')
      return response.json()
    }
  )

  // Delete mutation
  const deleteMutation = useMutate(
    async (id) => {
      const response = await fetch(`/api/requests/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete')
      return response.json()
    },
    {
      invalidateQueries: ['requests'],
      onSuccess: () => {
        alert('Request deleted successfully!')
      }
    }
  )

  if (isLoading) {
    return <div className="loading">Loading requests...</div>
  }

  if (isError) {
    return (
      <div className="error-container">
        <p>Error: {errorMessage}</p>
        <button onClick={refetch}>Try Again</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Requests</h1>
      {requests.map(request => (
        <div key={request.id}>
          <h3>{request.title}</h3>
          <button
            onClick={() => deleteMutation.mutate(request.id)}
            disabled={deleteMutation.isLoading}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Error Handling with Toast Notifications

```jsx
import { useMutate } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'

function CreateRequestButton() {
  const toast = useToast()

  const { mutate, isLoading } = useMutate(
    async (data) => {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create request')
      return response.json()
    },
    {
      invalidateQueries: ['requests'],
      onSuccess: () => {
        toast.success('Request created successfully!')
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create request')
      }
    }
  )

  return (
    <button onClick={() => mutate({ title: 'New Request' })}>
      Create Request
    </button>
  )
}
```

## Utility Functions

The query client exports useful utility functions:

```javascript
import {
  getErrorMessage,   // Get user-friendly error message
  isNetworkError,    // Check if error is network-related
  isAuthError,       // Check if error is 401/403
  isServerError,     // Check if error is 5xx
  invalidateQueries, // Manually invalidate queries
  refetchQueries,    // Manually refetch queries
  setQueryData,      // Manually set query data
  getQueryData,      // Get current query data
  clearCache,        // Clear all cached data
} from '../lib/queryClient'
```

## Best Practices

1. **Use useFetch for GET requests** - simpler API than useApiQuery
2. **Use useMutate for mutations** - simpler API than useApiMutation
3. **Always handle loading and error states** in your UI
4. **Use invalidateQueries** to automatically refetch data after mutations
5. **Use optimistic updates** for better UX (like toggling favorites)
6. **Provide meaningful error messages** to users
7. **Log errors in production** to error tracking services
8. **Use query keys consistently** - helps with caching and invalidation

## Error Tracking Integration (Future)

To integrate with error tracking services like Sentry:

```javascript
// In lib/queryClient.js, uncomment and add:
import * as Sentry from '@sentry/react'

// In the error handlers:
if (import.meta.env.PROD) {
  Sentry.captureException(error, {
    contexts: {
      query: {
        queryKey: query.queryKey,
        queryHash: query.queryHash,
      }
    }
  })
}
```

```javascript
// In components/ErrorBoundary.jsx:
import * as Sentry from '@sentry/react'

logError(error, errorInfo) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        }
      }
    })
  }
}
```
