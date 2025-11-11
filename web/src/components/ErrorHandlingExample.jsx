/**
 * Example Component - Demonstrates Error Handling Features
 *
 * This file shows how to use the error handling infrastructure.
 * You can use this as a reference when implementing error handling in your components.
 *
 * To test this component, add it to a page:
 * import ErrorHandlingExample from '../components/ErrorHandlingExample'
 * Then: <ErrorHandlingExample />
 */

import { useState } from 'react'
import { useFetch, useMutate } from '../hooks/useApi'
import { useErrorHandler } from '../hooks/useErrorHandler'

function ErrorHandlingExample() {
  const [shouldError, setShouldError] = useState(false)

  // Example 1: Using useFetch for GET requests
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    errorMessage: usersErrorMessage,
    refetch: refetchUsers
  } = useFetch(
    ['example-users'],
    async () => {
      // Simulate API call
      if (shouldError) {
        throw new Error('Failed to fetch users')
      }
      return [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ]
    },
    {
      enabled: true,
      retry: 1,
    }
  )

  // Example 2: Using useMutate for POST/PUT/DELETE
  const {
    mutate: createUser,
    isLoading: createLoading,
    isError: createError,
    errorMessage: createErrorMessage,
    isSuccess: createSuccess
  } = useMutate(
    async (userData) => {
      // Simulate API call
      if (shouldError) {
        throw new Error('Failed to create user')
      }
      return { id: 3, ...userData }
    },
    {
      invalidateQueries: ['example-users'],
      onSuccess: (data) => {
        console.log('User created:', data)
      }
    }
  )

  // Example 3: Using useErrorHandler for custom error handling
  const { handleError, isError, errorMessage, clearError } = useErrorHandler()

  const triggerCustomError = () => {
    try {
      if (shouldError) {
        throw new Error('Custom error triggered!')
      }
      alert('No error - toggle the error switch first!')
    } catch (error) {
      handleError(error, { context: 'custom error button' })
    }
  }

  // Example 4: Trigger React Error Boundary
  const TriggerErrorBoundary = () => {
    if (shouldError) {
      throw new Error('This error will be caught by ErrorBoundary!')
    }
    return null
  }

  return (
    <div style={{
      padding: '24px',
      background: '#0F0F0F',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2 style={{ marginBottom: '24px' }}>Error Handling Examples</h2>

      {/* Error Toggle */}
      <div style={{
        padding: '16px',
        background: shouldError ? '#2d1a1a' : '#1a2d1a',
        borderRadius: '8px',
        marginBottom: '24px',
        border: `2px solid ${shouldError ? '#ff4444' : '#44ff44'}`
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={shouldError}
            onChange={(e) => setShouldError(e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
          <span style={{ fontWeight: 'bold' }}>
            Simulate Errors {shouldError ? '(ON)' : '(OFF)'}
          </span>
        </label>
        <p style={{ margin: '8px 0 0 32px', fontSize: '14px', color: '#999' }}>
          Toggle this to make the examples throw errors
        </p>
      </div>

      {/* Example 1: useFetch */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#000', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '12px' }}>Example 1: useFetch Hook</h3>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '12px' }}>
          Demonstrates automatic error handling for GET requests
        </p>

        {usersLoading && <div>Loading users...</div>}

        {usersError && (
          <div style={{
            padding: '12px',
            background: '#2d1a1a',
            border: '1px solid #ff4444',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#ff6666' }}>Error:</strong> {usersErrorMessage}
          </div>
        )}

        {!usersLoading && !usersError && users && (
          <div style={{ marginBottom: '12px' }}>
            {users.map(user => (
              <div key={user.id} style={{ padding: '8px', background: '#1a1a1a', marginBottom: '4px', borderRadius: '4px' }}>
                {user.name}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={refetchUsers}
          className="btn-primary"
          style={{ fontSize: '14px', padding: '10px 20px' }}
        >
          Refetch Users
        </button>
      </div>

      {/* Example 2: useMutate */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#000', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '12px' }}>Example 2: useMutate Hook</h3>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '12px' }}>
          Demonstrates automatic error handling for POST/PUT/DELETE requests
        </p>

        {createError && (
          <div style={{
            padding: '12px',
            background: '#2d1a1a',
            border: '1px solid #ff4444',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#ff6666' }}>Error:</strong> {createErrorMessage}
          </div>
        )}

        {createSuccess && (
          <div style={{
            padding: '12px',
            background: '#1a2d1a',
            border: '1px solid #44ff44',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#66ff66' }}>Success!</strong> User created successfully
          </div>
        )}

        <button
          onClick={() => createUser({ name: 'New User' })}
          className="btn-primary"
          disabled={createLoading}
          style={{ fontSize: '14px', padding: '10px 20px' }}
        >
          {createLoading ? 'Creating...' : 'Create User'}
        </button>
      </div>

      {/* Example 3: useErrorHandler */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#000', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '12px' }}>Example 3: useErrorHandler Hook</h3>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '12px' }}>
          Demonstrates custom error handling for any try/catch blocks
        </p>

        {isError && (
          <div style={{
            padding: '12px',
            background: '#2d1a1a',
            border: '1px solid #ff4444',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#ff6666' }}>Custom Error:</strong> {errorMessage}
            <button
              onClick={clearError}
              style={{
                marginLeft: '12px',
                padding: '4px 12px',
                background: '#ff4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Error
            </button>
          </div>
        )}

        <button
          onClick={triggerCustomError}
          className="btn-primary"
          style={{ fontSize: '14px', padding: '10px 20px' }}
        >
          Trigger Custom Error
        </button>
      </div>

      {/* Example 4: Error Boundary */}
      <div style={{ padding: '16px', background: '#000', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '12px' }}>Example 4: Error Boundary</h3>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '12px' }}>
          Demonstrates React Error Boundary catching component errors
        </p>
        <p style={{ color: '#ff6666', fontSize: '13px', marginBottom: '12px' }}>
          ⚠️ Warning: This will crash the component and show the error boundary page!
        </p>

        <button
          onClick={() => {
            if (shouldError) {
              // This will trigger error boundary
              setShouldError(true)
              window.location.reload() // Force re-render with error
            } else {
              alert('Toggle the error switch first!')
            }
          }}
          className="btn-secondary"
          style={{ fontSize: '14px', padding: '10px 20px' }}
        >
          Trigger Error Boundary (Will Reload Page)
        </button>
      </div>

      {/* Hidden component that throws error */}
      <TriggerErrorBoundary />
    </div>
  )
}

export default ErrorHandlingExample
