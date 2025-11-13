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

      if (response.ok && data.token) {
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return { success: true, user: data.user, token: data.token }
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

      if (response.ok && data.token) {
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return { success: true, user: data.user, token: data.token }
      }

      return { success: false, message: data.error || data.message || 'Signup failed' }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, message: 'Network error occurred' }
    }
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  },

  getToken(): string | null {
    return localStorage.getItem('token')
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated(): boolean {
    const token = this.getToken()
    return !!token
  }
}

// Helper to make authenticated API requests with CSRF protection
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = authApi.getToken()

  let config: RequestInit = {
    ...options,
    credentials: 'include', // Include cookies for session
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
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