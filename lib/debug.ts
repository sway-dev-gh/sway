// Debug utilities for troubleshooting authentication issues

export const debugAuth = () => {
  console.log('🔍 Authentication Debug Information:')
  console.log('==========================================')

  // Check localStorage
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  console.log('📱 Local Storage:')
  console.log('  Token exists:', !!token)
  console.log('  Token preview:', token ? token.substring(0, 20) + '...' : 'null')
  console.log('  User data:', user ? JSON.parse(user) : 'null')

  // Check token validity (basic structure check)
  if (token) {
    try {
      const tokenParts = token.split('.')
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]))
        console.log('🎫 Token Payload:')
        console.log('  User ID:', payload.userId)
        console.log('  Issued at:', new Date(payload.iat * 1000).toISOString())
        console.log('  Expires at:', new Date(payload.exp * 1000).toISOString())
        console.log('  Is expired:', payload.exp < Date.now() / 1000)
        console.log('  Time until expiry:', Math.round((payload.exp - Date.now() / 1000) / 60), 'minutes')
      } else {
        console.log('❌ Token format invalid (not JWT)')
      }
    } catch (error) {
      console.log('❌ Token parsing failed:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Check cookies
  console.log('🍪 Cookies:')
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=')
    acc[name] = value
    return acc
  }, {} as Record<string, string>)

  console.log('  Available cookies:', Object.keys(cookies))
  console.log('  Token cookie:', cookies.token ? cookies.token.substring(0, 20) + '...' : 'not found')

  console.log('==========================================')

  return {
    token,
    user: user ? JSON.parse(user) : null,
    cookies,
    isAuthenticated: !!token
  }
}

export const testAuthAPI = async () => {
  console.log('🧪 Testing Authentication API:')
  console.log('==========================================')

  const token = localStorage.getItem('token')
  const API_BASE = ''

  // Test 1: Basic connectivity
  try {
    console.log('1️⃣ Testing basic connectivity...')
    const response = await fetch(`${API_BASE}/api/projects`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log('  Status:', response.status)
    console.log('  Headers:', Object.fromEntries(response.headers.entries()))

    const data = await response.json()
    console.log('  Response:', data)
  } catch (error) {
    console.error('  Error:', error instanceof Error ? error.message : 'Unknown error')
  }

  // Test 2: With Authorization header
  if (token) {
    try {
      console.log('2️⃣ Testing with Authorization header...')
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('  Status:', response.status)
      console.log('  Headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('  Response:', data)

      if (response.ok) {
        console.log('✅ Authentication successful!')
      } else {
        console.log('❌ Authentication failed')
      }
    } catch (error) {
      console.error('  Error:', error)
    }
  }

  // Test 3: CSRF token
  try {
    console.log('3️⃣ Testing CSRF token...')
    const response = await fetch(`${API_BASE}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log('  Status:', response.status)
    const data = await response.json()
    console.log('  CSRF Response:', data)
  } catch (error) {
    console.error('  Error:', error instanceof Error ? error.message : 'Unknown error')
  }

  console.log('==========================================')
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
  (window as any).testAuthAPI = testAuthAPI;
}