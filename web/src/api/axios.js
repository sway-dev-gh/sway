import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.swayfiles.com'
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
