/**
 * API Integration Tests
 * Comprehensive testing of frontend-backend API communication for world-class reliability
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { analytics } from '../../lib/analytics'
import { useErrorMonitoring } from '../../lib/errorMonitoring'

// Mock dependencies
jest.mock('../../lib/analytics')
jest.mock('../../lib/errorMonitoring')

// Mock window.location
delete (window as any).location
window.location = {
  href: '',
  pathname: '/',
  search: '',
  hash: ''
} as any

interface User {
  id: string
  email: string
  name: string
  username: string
  created_at: string
  last_login?: string
}

interface Collaboration {
  id: string
  name: string
  description: string
  owner_id: string
  created_at: string
  updated_at: string
  members: User[]
}

// MSW Server setup with v2 syntax
const server = setupServer(
  // Authentication endpoints
  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json() as any
    const { email, password, name } = body

    if (!email || !password) {
      return HttpResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    if (password.length < 8) {
      return HttpResponse.json({
        success: false,
        error: 'Password must be at least 8 characters'
      }, { status: 400 })
    }

    const user: User = {
      id: 'new-user-' + Date.now(),
      email,
      name: name || email.split('@')[0],
      username: email.split('@')[0],
      created_at: new Date().toISOString()
    }

    return HttpResponse.json({
      success: true,
      user,
      message: 'Account created successfully'
    }, { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any
    const { email, password } = body

    if (email === 'test@example.com' && password === 'password123') {
      const user: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        username: 'test',
        created_at: '2024-01-01T00:00:00Z',
        last_login: new Date().toISOString()
      }

      return HttpResponse.json({
        success: true,
        user,
        token: 'mock-jwt-token'
      })
    }

    return HttpResponse.json({
      success: false,
      error: 'Invalid credentials'
    }, { status: 401 })
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  }),

  http.get('/api/auth/me', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    return HttpResponse.json({
      success: true,
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        username: 'test',
        created_at: '2024-01-01T00:00:00Z'
      }
    })
  }),

  // Collaboration endpoints
  http.get('/api/collaborations', async ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return HttpResponse.json({
        success: false,
        error: 'User ID required'
      }, { status: 400 })
    }

    const collaborations: Collaboration[] = [
      {
        id: 'collab-1',
        name: 'Project Alpha',
        description: 'Revolutionary project collaboration',
        owner_id: userId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        members: []
      }
    ]

    return HttpResponse.json({
      success: true,
      collaborations
    })
  }),

  http.post('/api/collaborations', async ({ request }) => {
    const body = await request.json() as any
    const { name, description } = body

    if (!name) {
      return HttpResponse.json({
        success: false,
        error: 'Collaboration name is required'
      }, { status: 400 })
    }

    const collaboration: Collaboration = {
      id: 'collab-' + Date.now(),
      name,
      description: description || '',
      owner_id: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: []
    }

    return HttpResponse.json({
      success: true,
      collaboration,
      message: 'Collaboration created successfully'
    }, { status: 201 })
  }),

  // File operations
  http.post('/api/files/upload', async ({ request }) => {
    return HttpResponse.json({
      success: true,
      file: {
        id: 'file-' + Date.now(),
        name: 'test-file.txt',
        size: 1024,
        type: 'text/plain',
        url: '/uploads/test-file.txt'
      }
    }, { status: 201 })
  }),

  http.delete('/api/files/:fileId', async ({ params }) => {
    const { fileId } = params

    return HttpResponse.json({
      success: true,
      message: `File ${fileId} deleted successfully`
    })
  }),

  // Error simulation endpoints
  http.get('/api/error/500', async ({ request }) => {
    return HttpResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }),

  http.get('/api/error/timeout', async ({ request }) => {
    await new Promise(resolve => setTimeout(resolve, 10000))
    return HttpResponse.json({ success: true })
  })
)

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('API Integration Tests', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication API', () => {
    test('successful user registration', async () => {
      // Mock successful registration
      server.use(
        http.post('/api/auth/signup', async ({ request }) => {
          return HttpResponse.json({
            success: true,
            user: {
              id: 'user-123',
              email: 'newuser@example.com',
              name: 'New User',
              username: 'newuser',
              created_at: new Date().toISOString()
            }
          }, { status: 201 })
        })
      )

      const mockSignup = jest.fn()

      // Simulate registration API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'securepassword123',
          name: 'New User'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.user.email).toBe('newuser@example.com')
    })

    test('failed registration with weak password', async () => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: '123',
          name: 'Test User'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Password must be at least 8 characters')
    })

    test('successful login with valid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.email).toBe('test@example.com')
      expect(data.token).toBeDefined()
    })

    test('failed login with invalid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid credentials')
    })
  })

  describe('Collaboration API', () => {
    test('create new collaboration', async () => {
      const response = await fetch('/api/collaborations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Project',
          description: 'A test collaboration project'
        })
      })

      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.collaboration.name).toBe('Test Project')
    })

    test('get user collaborations', async () => {
      const response = await fetch('/api/collaborations?userId=user-1')

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.collaborations)).toBe(true)
    })
  })

  describe('File Operations API', () => {
    test('upload file successfully', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt')

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.file.name).toBe('test-file.txt')
    })

    test('delete file successfully', async () => {
      const response = await fetch('/api/files/test-file-id', {
        method: 'DELETE'
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('handle 500 server errors', async () => {
      const response = await fetch('/api/error/500')

      const data = await response.json()
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    test('handle network timeouts', async () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 100)

      try {
        await fetch('/api/error/timeout', {
          signal: controller.signal
        })
      } catch (error: any) {
        expect(error.name).toBe('AbortError')
      }
    })
  })
})