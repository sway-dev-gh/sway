import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sway-backend-2dsi.onrender.com'
})

export default api
