# Error Handling Quick Start Guide

## TL;DR - Just Use These Hooks

### Fetch Data (GET)
```jsx
import { useFetch } from '../hooks/useApi'

const { data, isLoading, isError, errorMessage } = useFetch(
  ['key'],
  async () => {
    const res = await fetch('/api/endpoint')
    if (!res.ok) throw new Error('Failed')
    return res.json()
  }
)
```

### Create/Update/Delete Data (POST/PUT/DELETE)
```jsx
import { useMutate } from '../hooks/useApi'

const { mutate, isLoading, isError, errorMessage } = useMutate(
  async (data) => {
    const res = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed')
    return res.json()
  },
  {
    invalidateQueries: ['key'], // Refresh data after success
    onSuccess: () => alert('Success!'),
  }
)

// Use it
mutate({ name: 'value' })
```

### Handle Custom Errors
```jsx
import { useErrorHandler } from '../hooks/useErrorHandler'

const { handleError, isError, errorMessage, clearError } = useErrorHandler()

try {
  // risky code
} catch (error) {
  handleError(error)
}
```

## Common Patterns

### Loading State
```jsx
if (isLoading) return <div>Loading...</div>
```

### Error State
```jsx
if (isError) return <div>Error: {errorMessage}</div>
```

### Success State
```jsx
if (data) return <div>{/* render data */}</div>
```

### Complete Example
```jsx
import { useFetch } from '../hooks/useApi'

function Requests() {
  const { data, isLoading, isError, errorMessage, refetch } = useFetch(
    ['requests'],
    async () => {
      const res = await fetch('/api/requests')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  )

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {errorMessage} <button onClick={refetch}>Retry</button></div>

  return (
    <div>
      {data.map(req => <div key={req.id}>{req.title}</div>)}
    </div>
  )
}
```

## Query Keys (Important!)

Use consistent query keys for caching and invalidation:

```javascript
// ✅ Good - consistent
['requests']           // All requests
['requests', id]       // Single request
['users']             // All users
['users', userId]     // Single user

// ❌ Bad - inconsistent
['getAllRequests']
['request-' + id]
['user_' + userId]
```

## Auto-Refresh After Changes

```jsx
const { mutate } = useMutate(
  createRequest,
  {
    invalidateQueries: ['requests'], // This auto-refreshes the requests list!
  }
)
```

## That's It!

For more advanced usage, see `README.md` in this folder.
