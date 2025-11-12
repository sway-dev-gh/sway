const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.swayfiles.com'
  : 'http://localhost:5001'

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // Authentication
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signup(name, email, password) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser() {
    return this.request('/api/auth/me')
  }

  // Projects
  async getProjects() {
    return this.request('/api/projects')
  }

  async createProject(projectData) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    })
  }

  async updateProject(projectId, projectData) {
    return this.request(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    })
  }

  async deleteProject(projectId) {
    return this.request(`/api/projects/${projectId}`, {
      method: 'DELETE',
    })
  }

  // Files
  async getProjectFiles(projectId) {
    return this.request(`/api/projects/${projectId}/files`)
  }

  async uploadFile(projectId, formData) {
    return this.request(`/api/projects/${projectId}/files`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    })
  }

  async updateFile(fileId, fileData) {
    return this.request(`/api/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify(fileData),
    })
  }

  async deleteFile(fileId) {
    return this.request(`/api/files/${fileId}`, {
      method: 'DELETE',
    })
  }

  // Requests/Reviews
  async getRequests(projectId) {
    return this.request(`/api/projects/${projectId}/requests`)
  }

  async createRequest(projectId, requestData) {
    return this.request(`/api/projects/${projectId}/requests`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    })
  }

  async updateRequestStatus(requestId, status, comments = '') {
    return this.request(`/api/requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, comments }),
    })
  }

  // Comments
  async addComment(requestId, comment) {
    return this.request(`/api/requests/${requestId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    })
  }

  async getComments(requestId) {
    return this.request(`/api/requests/${requestId}/comments`)
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

// Create and export a singleton instance
const apiService = new ApiService()
export default apiService