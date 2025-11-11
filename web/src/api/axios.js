import axios from 'axios'

// In development, use Vite proxy (empty baseURL = relative URLs)
// In production, use production API
const api = axios.create({
  baseURL: import.meta.env.MODE === 'production' ? 'https://api.swayfiles.com' : '',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include auth token and admin key if available
api.interceptors.request.use((config) => {
  // Add JWT token to Authorization header if available
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Add admin key to custom header if available
  const adminKey = localStorage.getItem('adminKey')
  if (adminKey) {
    config.headers['x-admin-key'] = adminKey
  }

  return config
}, (error) => {
  return Promise.reject(error)
})

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      // Don't clear tokens on public upload pages
      const isPublicRoute = window.location.pathname.startsWith('/r/')
      if (!isPublicRoute) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (!['/login', '/signup'].includes(window.location.pathname)) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
