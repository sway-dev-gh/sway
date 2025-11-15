const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://sway-backend-2qlr.onrender.com' : 'http://localhost:5001')

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

// Get CSRF token from backend
const getCSRFToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Include cookies for session
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data: CSRFResponse = await response.json()

    if (response.ok && data.success && data.csrfToken) {
      return data.csrfToken
    }

    console.error('Failed to get CSRF token:', data.message)
    return null
  } catch (error) {
    console.error('Network error getting CSRF token:', error)
    return null
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Try to get CSRF token, but continue without it if blocked
      const csrfToken = await getCSRFToken()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Only add CSRF token if we successfully got one
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session
        headers,
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // SECURITY FIX: Using HttpOnly cookies - no more localStorage user storage!
        // Both tokens AND user data are now stored securely server-side only
        console.log('✅ SECURITY: Authentication data now fully secure - no localStorage usage')
        return { success: true, user: data.user }
      }

      return { success: false, message: data.error || data.message || 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Network error occurred' }
    }
  },

  async signup(email: string, password: string, username?: string): Promise<AuthResponse> {
    try {
      // Try to get CSRF token, but continue without it if blocked
      const csrfToken = await getCSRFToken()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Only add CSRF token if we successfully got one
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session
        headers,
        body: JSON.stringify({ email, password, name: username }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // SECURITY FIX: Using HttpOnly cookies - no more localStorage user storage!
        // Both tokens AND user data are now stored securely server-side only
        console.log('✅ SECURITY: Authentication data now fully secure - no localStorage usage')
        return { success: true, user: data.user }
      }

      return { success: false, message: data.error || data.message || 'Signup failed' }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, message: 'Network error occurred' }
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
      const response = await apiRequest('/api/user/me', {
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