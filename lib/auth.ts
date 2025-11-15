const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

interface User {
  id: string
  email: string
  username?: string
  plan?: string
}

interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  message?: string
}

interface CSRFResponse {
  success: boolean
  csrfToken?: string
  message?: string
}

// Get CSRF token from backend with better error handling
const getCSRFToken = async (retryCount: number = 0): Promise<string | null> => {
  try {
    console.log(`🔒 Getting CSRF token (attempt ${retryCount + 1}/3)...`)

    const response = await fetch(`${API_BASE}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Include cookies for session
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log(`🔒 CSRF response status: ${response.status}`)

    if (!response.ok) {
      console.error(`❌ CSRF request failed: ${response.status} ${response.statusText}`)
      if (retryCount < 2) {
        console.log(`🔄 Retrying CSRF request...`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s
        return getCSRFToken(retryCount + 1)
      }
      return null
    }

    const data: CSRFResponse = await response.json()
    console.log('🔒 CSRF response data:', { success: data.success, hasToken: !!data.csrfToken })

    if (data.success && data.csrfToken) {
      console.log('✅ CSRF token obtained successfully')
      return data.csrfToken
    }

    console.error('❌ Invalid CSRF response:', data.message)
    return null
  } catch (error) {
    console.error('❌ Network error getting CSRF token:', error)
    if (retryCount < 2) {
      console.log(`🔄 Retrying CSRF request after network error...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return getCSRFToken(retryCount + 1)
    }
    return null
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Starting login process...')

      // Try to get CSRF token
      const csrfToken = await getCSRFToken()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Only add CSRF token if we successfully got one
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
        console.log('🔒 Login request will include CSRF token')
      } else {
        console.warn('⚠️ Login proceeding WITHOUT CSRF token - request may fail')
      }

      console.log('🚀 Sending login request...')
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session
        headers,
        body: JSON.stringify({ email, password }),
      })

      console.log(`🔐 Login response status: ${response.status}`)

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('✅ LOGIN SUCCESSFUL - Authentication data secure in HttpOnly cookies')
        return { success: true, user: data.user }
      }

      // Handle CSRF-specific errors
      if (response.status === 403 && !csrfToken) {
        console.error('❌ Login failed: CSRF token required but none available')
        return { success: false, message: 'Security verification failed. Please refresh the page and try again.' }
      }

      console.error('❌ Login failed:', data.error || data.message || 'Unknown error')
      return { success: false, message: data.error || data.message || 'Login failed' }
    } catch (error) {
      console.error('❌ Login network error:', error)
      return { success: false, message: 'Network error occurred. Please check your connection.' }
    }
  },

  async signup(email: string, password: string, username?: string): Promise<AuthResponse> {
    try {
      console.log('📝 Starting signup process...')

      // Try to get CSRF token
      const csrfToken = await getCSRFToken()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Only add CSRF token if we successfully got one
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
        console.log('🔒 Signup request will include CSRF token')
      } else {
        console.warn('⚠️ Signup proceeding WITHOUT CSRF token - request may fail')
      }

      console.log('🚀 Sending signup request...')
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session
        headers,
        body: JSON.stringify({ email, password, name: username }),
      })

      console.log(`📝 Signup response status: ${response.status}`)

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('✅ SIGNUP SUCCESSFUL - Authentication data secure in HttpOnly cookies')
        return { success: true, user: data.user }
      }

      // Handle CSRF-specific errors
      if (response.status === 403 && !csrfToken) {
        console.error('❌ Signup failed: CSRF token required but none available')
        return { success: false, message: 'Security verification failed. Please refresh the page and try again.' }
      }

      console.error('❌ Signup failed:', data.error || data.message || 'Unknown error')
      return { success: false, message: data.error || data.message || 'Signup failed' }
    } catch (error) {
      console.error('❌ Signup network error:', error)
      return { success: false, message: 'Network error occurred. Please check your connection.' }
    }
  },

  async logout() {
    try {
      // Call backend logout to clear HttpOnly cookies
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Logout API error:', error)
    }

    // SECURITY FIX: No localStorage to clear - all auth data is server-side
    // Redirect to login after HttpOnly cookies are cleared
    window.location.href = '/login'
  },

  // SECURITY NOTE: getToken() removed - HttpOnly cookies cannot be accessed by JavaScript
  // This is intentional for security - tokens are automatically sent with requests

  async getUser(): Promise<User | null> {
    try {
      // SECURITY FIX: Fetch user data securely from server instead of localStorage
      const response = await apiRequest('/api/auth/me', {
        method: 'GET'
      })

      if (!response) {
        return null // User not authenticated
      }

      if (response.ok) {
        const data = await response.json()
        return data.success ? data.user : null
      }

      return null
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  },

  async isAuthenticated(): Promise<boolean> {
    // SECURITY FIX: Check authentication securely via server endpoint
    // HttpOnly cookies will be automatically validated by backend
    const user = await this.getUser()
    return !!user
  }
}

// Helper to make authenticated API requests with CSRF protection
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // SECURITY FIX: No more manual token handling - HttpOnly cookies sent automatically

  // FORMDATA FIX: Detect FormData and don't override Content-Type
  const isFormData = options.body instanceof FormData

  let config: RequestInit = {
    ...options,
    credentials: 'include', // Include HttpOnly cookies for authentication
    headers: {
      // Only set JSON Content-Type for non-FormData requests
      // FormData requires browser to auto-set multipart/form-data with boundary
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      // No Authorization header needed - HttpOnly cookies handle authentication
      ...options.headers,
    },
  }

  // Add CSRF token for state-changing requests if available
  if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    try {
      const csrfToken = await getCSRFToken()
      if (csrfToken) {
        config.headers = {
          ...config.headers,
          'X-CSRF-Token': csrfToken,
        }
      }
    } catch (error) {
      // Continue without CSRF token if it fails
      console.warn('CSRF token unavailable, continuing without it')
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)

  // If unauthorized, redirect to login
  if (response.status === 401) {
    authApi.logout()
    return
  }

  return response
}