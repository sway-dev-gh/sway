import axios from 'axios'

// In development, use Vite proxy (empty baseURL = relative URLs)
// In production, use production API
const api = axios.create({
  baseURL: import.meta.env.MODE === 'production' ? 'https://api.swayfiles.com' : ''
})

// Add request interceptor to include admin key if available
api.interceptors.request.use((config) => {
  const adminKey = localStorage.getItem('adminKey')
  if (adminKey) {
    config.headers['x-admin-key'] = adminKey
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export default api
