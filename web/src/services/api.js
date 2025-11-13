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
        // Create a custom error object that preserves all response data
        const error = new Error(data.error || `HTTP ${response.status}`)
        error.status = response.status
        error.data = data
        throw error
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

  // Workflow API endpoints
  async getProjectWorkflow(projectId) {
    return this.request(`/api/workflow/projects/${projectId}`)
  }

  async uploadFileWithWorkflow(projectId, formData) {
    return this.request(`/api/workflow/projects/${projectId}/files`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    })
  }

  // Section operations
  async getSection(sectionId) {
    return this.request(`/api/workflow/sections/${sectionId}`)
  }

  async submitSectionReview(sectionId, reviewData) {
    return this.request(`/api/workflow/sections/${sectionId}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    })
  }

  async addSectionComment(sectionId, commentData) {
    return this.request(`/api/workflow/sections/${sectionId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    })
  }

  async getSectionComments(sectionId) {
    return this.request(`/api/workflow/sections/${sectionId}/comments`)
  }

  async resolveSectionComment(commentId, resolved = true) {
    return this.request(`/api/workflow/comments/${commentId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolved }),
    })
  }

  // File workflow operations
  async createFileVersion(fileId, versionData) {
    return this.request(`/api/workflow/files/${fileId}/version`, {
      method: 'POST',
      body: JSON.stringify(versionData),
    })
  }

  async getFileVersions(fileId) {
    return this.request(`/api/workflow/files/${fileId}/versions`)
  }

  async transitionWorkflowState(fileId, stateData) {
    return this.request(`/api/workflow/files/${fileId}/state`, {
      method: 'POST',
      body: JSON.stringify(stateData),
    })
  }

  async getWorkflowStateHistory(fileId) {
    return this.request(`/api/workflow/files/${fileId}/state-history`)
  }

  // Edit request workflow
  async requestSectionEdit(sectionId, editRequestData) {
    return this.request(`/api/workflow/sections/${sectionId}/edit-requests`, {
      method: 'POST',
      body: JSON.stringify(editRequestData),
    })
  }

  async getSectionEditRequests(sectionId) {
    return this.request(`/api/workflow/sections/${sectionId}/edit-requests`)
  }

  async updateEditRequestStatus(requestId, status, responseData = {}) {
    return this.request(`/api/workflow/edit-requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...responseData }),
    })
  }

  async getMyEditRequests(projectId) {
    return this.request(`/api/workflow/projects/${projectId}/edit-requests`)
  }

  // External collaboration
  async generateExternalAccessToken(tokenData) {
    return this.request('/api/workflow/external-access', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    })
  }

  async validateExternalToken(token) {
    return this.request('/api/workflow/external-access/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  // Collaboration management
  async getCollaborations(filter = {}) {
    const params = new URLSearchParams(filter)
    return this.request(`/api/collaborations?${params}`)
  }

  async createCollaboration(collaborationData) {
    return this.request('/api/collaborations', {
      method: 'POST',
      body: JSON.stringify(collaborationData),
    })
  }

  async updateCollaboration(collaborationId, updates) {
    return this.request(`/api/collaborations/${collaborationId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteCollaboration(collaborationId) {
    return this.request(`/api/collaborations/${collaborationId}`, {
      method: 'DELETE',
    })
  }

  async getCollaborationDetails(collaborationId) {
    return this.request(`/api/collaborations/${collaborationId}`)
  }

  // Activity and notifications
  async getProjectActivity(projectId, options = {}) {
    const params = new URLSearchParams(options)
    return this.request(`/api/activity/projects/${projectId}?${params}`)
  }

  async getUserActivity(options = {}) {
    const params = new URLSearchParams(options)
    return this.request(`/api/activity/user?${params}`)
  }

  // Guest user API
  async createGuestSession(displayName) {
    return this.request('/api/guest/create', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    })
  }

  async convertGuestToUser(email, password, name) {
    return this.request('/api/guest/convert', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async getGuestInfo() {
    return this.request('/api/guest/me')
  }

  async updateGuestSession(updates) {
    return this.request('/api/guest/update', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

// Create and export a singleton instance
const apiService = new ApiService()
export default apiService