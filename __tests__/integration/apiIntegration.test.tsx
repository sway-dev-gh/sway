/**
 * API Integration Tests
 * Comprehensive testing of frontend-backend API communication for world-class reliability
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { NotificationProvider } from '../../contexts/NotificationContext'
import App from '../../App'
import { analytics } from '../../lib/analytics'
import { errorMonitoring } from '../../lib/errorMonitoring'

// Mock dependencies
jest.mock('../../lib/analytics')
jest.mock('../../lib/errorMonitoring')

const mockAnalytics = analytics as jest.Mocked<typeof analytics>
const mockErrorMonitoring = errorMonitoring as jest.Mocked<typeof errorMonitoring>

// API Response types for type safety
interface User {
  id: string
  email: string
  name: string
  created_at?: string
}

interface Project {
  id: string
  name: string
  description: string
  owner_id: string
  created_at: string
  updated_at: string
}

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'collaboration'
  message: string
  read: boolean
  timestamp: string
  user_id: string
}

// Mock API server with comprehensive endpoints
const server = setupServer(
  // Authentication endpoints
  rest.post('/api/auth/signup', async (req, res, ctx) => {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return res(ctx.status(400), ctx.json({
        success: false,
        error: 'Email and password are required'
      }))
    }

    if (password.length < 8) {
      return res(ctx.status(400), ctx.json({
        success: false,
        error: 'Password must be at least 8 characters'
      }))
    }

    const user: User = {
      id: 'new-user-' + Date.now(),
      email,
      name: name || email.split('@')[0],
      created_at: new Date().toISOString()
    }

    return res(ctx.json({ success: true, user }))
  }),

  rest.post('/api/auth/login', async (req, res, ctx) => {
    const { email, password } = await req.json()

    if (email === 'invalid@example.com') {
      return res(ctx.status(401), ctx.json({
        success: false,
        error: 'Invalid credentials'
      }))
    }

    const user: User = {
      id: 'user-1',
      email,
      name: 'Test User'
    }

    return res(
      ctx.cookie('authToken', 'mock-jwt-token', { httpOnly: true }),
      ctx.json({ success: true, user })
    )
  }),

  rest.get('/api/auth/verify', (req, res, ctx) => {
    const authCookie = req.cookies.authToken

    if (!authCookie) {
      return res(ctx.status(401), ctx.json({
        success: false,
        error: 'No token provided'
      }))
    }

    const user: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    }

    return res(ctx.json({ success: true, user }))
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.cookie('authToken', '', { maxAge: 0 }),
      ctx.json({ success: true, message: 'Logged out successfully' })
    )
  }),

  // Projects endpoints
  rest.get('/api/projects', (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || '1'
    const limit = req.url.searchParams.get('limit') || '10'
    const search = req.url.searchParams.get('search')

    let projects: Project[] = [
      {
        id: 'project-1',
        name: 'Test Project 1',
        description: 'First test project',
        owner_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'project-2',
        name: 'Test Project 2',
        description: 'Second test project',
        owner_id: 'user-1',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ]

    if (search) {
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    return res(ctx.json({
      success: true,
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: projects.length,
        totalPages: Math.ceil(projects.length / parseInt(limit))
      }
    }))
  }),

  rest.post('/api/projects', async (req, res, ctx) => {
    const { name, description } = await req.json()

    if (!name) {
      return res(ctx.status(400), ctx.json({
        success: false,
        error: 'Project name is required'
      }))
    }

    const project: Project = {
      id: 'project-' + Date.now(),
      name,
      description: description || '',
      owner_id: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return res(ctx.status(201), ctx.json({ success: true, project }))
  }),

  rest.get('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params

    const project: Project = {
      id: id as string,
      name: 'Test Project',
      description: 'A test project for integration testing',
      owner_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    return res(ctx.json({ success: true, project }))
  }),

  rest.put('/api/projects/:id', async (req, res, ctx) => {
    const { id } = req.params
    const { name, description } = await req.json()

    const project: Project = {
      id: id as string,
      name,
      description,
      owner_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString()
    }

    return res(ctx.json({ success: true, project }))
  }),

  rest.delete('/api/projects/:id', (req, res, ctx) => {
    return res(ctx.json({ success: true, message: 'Project deleted successfully' }))
  }),

  // Notifications endpoints
  rest.get('/api/notifications', (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || '1'
    const limit = req.url.searchParams.get('limit') || '20'
    const unreadOnly = req.url.searchParams.get('unreadOnly') === 'true'

    let notifications: Notification[] = [
      {
        id: 'notif-1',
        type: 'info',
        message: 'Welcome to the platform!',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        user_id: 'user-1'
      },
      {
        id: 'notif-2',
        type: 'collaboration',
        message: 'Someone shared a project with you',
        read: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        user_id: 'user-1'
      }
    ]

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read)
    }

    return res(ctx.json({
      success: true,
      notifications,
      total: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length
    }))
  }),

  rest.put('/api/notifications/:id/read', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),

  rest.put('/api/notifications/mark-all-read', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),

  // Collaboration endpoints
  rest.get('/api/projects/:id/collaborators', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      collaborators: [
        { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'owner' },
        { id: 'user-2', name: 'Collaborator', email: 'collab@example.com', role: 'editor' }
      ]
    }))
  }),

  rest.post('/api/projects/:id/invite', async (req, res, ctx) => {
    const { email, role } = await req.json()

    if (!email) {
      return res(ctx.status(400), ctx.json({
        success: false,
        error: 'Email is required'
      }))
    }

    return res(ctx.json({
      success: true,
      message: 'Invitation sent successfully'
    }))
  }),

  // File upload endpoints
  rest.post('/api/projects/:id/files', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      file: {
        id: 'file-1',
        name: 'test-file.txt',
        size: 1024,
        type: 'text/plain',
        url: '/uploads/test-file.txt'
      }
    }))
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  jest.clearAllMocks()
})
afterAll(() => server.close())

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
)

describe('API Integration Tests', () => {
  describe('Authentication API Integration', () => {
    it('should handle complete authentication flow with proper error handling', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      // Test signup with validation
      const signupLink = screen.getByTestId('signup-link')
      await user.click(signupLink)

      // Test validation errors
      const signupButton = screen.getByRole('button', { name: /sign up/i })
      await user.click(signupButton)

      await waitFor(() => {
        expect(screen.getByText(/email.*required/i)).toBeInTheDocument()
      })

      // Test password validation
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, '123') // Too short
      await user.click(signupButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })

      // Test successful signup
      await user.clear(passwordInput)
      await user.type(passwordInput, 'validpassword123')
      await user.click(signupButton)

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      })

      // Verify analytics tracking
      expect(mockAnalytics.track).toHaveBeenCalledWith('user_signup', {
        email: 'test@example.com',
        method: 'email'
      })
    })

    it('should handle authentication state persistence', async () => {
      const user = userEvent.setup()

      // Mock existing auth token
      document.cookie = 'authToken=mock-jwt-token'

      render(<App />, { wrapper: TestWrapper })

      // Should automatically verify and login
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      })

      expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument()
    })

    it('should handle logout and clear authentication state', async () => {
      const user = userEvent.setup()
      document.cookie = 'authToken=mock-jwt-token'

      render(<App />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      })

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)

      await waitFor(() => {
        expect(screen.getByTestId('login-form')).toBeInTheDocument()
      })

      // Verify cookie is cleared
      expect(document.cookie).not.toContain('authToken')
    })
  })

  describe('Projects API Integration', () => {
    beforeEach(async () => {
      // Login first
      document.cookie = 'authToken=mock-jwt-token'
    })

    it('should handle project CRUD operations', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      // Navigate to projects
      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      // Verify projects load
      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument()
        expect(screen.getByText('Test Project 2')).toBeInTheDocument()
      })

      // Test project creation
      const createButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createButton)

      const nameInput = screen.getByLabelText(/project name/i)
      const descriptionInput = screen.getByLabelText(/description/i)

      await user.type(nameInput, 'API Integration Test Project')
      await user.type(descriptionInput, 'Testing API integration')

      const saveButton = screen.getByRole('button', { name: /create/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('API Integration Test Project')).toBeInTheDocument()
      })

      // Test project editing
      const editButton = screen.getByTestId('edit-project-project-1')
      await user.click(editButton)

      const editNameInput = screen.getByDisplayValue('Test Project 1')
      await user.clear(editNameInput)
      await user.type(editNameInput, 'Updated Project Name')

      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText('Updated Project Name')).toBeInTheDocument()
      })

      // Test project deletion
      const deleteButton = screen.getByTestId('delete-project-project-1')
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.queryByText('Updated Project Name')).not.toBeInTheDocument()
      })
    })

    it('should handle project search and pagination', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await user.type(searchInput, 'Project 1')

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument()
        expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument()
      })

      // Clear search
      await user.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument()
        expect(screen.getByText('Test Project 2')).toBeInTheDocument()
      })
    })

    it('should handle collaboration features', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      // Open project
      const projectCard = screen.getByTestId('project-card-project-1')
      await user.click(projectCard)

      // Test collaborator invitation
      const inviteButton = screen.getByRole('button', { name: /invite collaborator/i })
      await user.click(inviteButton)

      const emailInput = screen.getByLabelText(/collaborator email/i)
      const roleSelect = screen.getByLabelText(/role/i)

      await user.type(emailInput, 'newcollaborator@example.com')
      await user.selectOptions(roleSelect, 'editor')

      const sendInviteButton = screen.getByRole('button', { name: /send invite/i })
      await user.click(sendInviteButton)

      await waitFor(() => {
        expect(screen.getByText(/invitation sent successfully/i)).toBeInTheDocument()
      })

      // Verify existing collaborators are displayed
      expect(screen.getByText('Test User (owner)')).toBeInTheDocument()
      expect(screen.getByText('Collaborator (editor)')).toBeInTheDocument()
    })
  })

  describe('Notifications API Integration', () => {
    beforeEach(() => {
      document.cookie = 'authToken=mock-jwt-token'
    })

    it('should handle notification management', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      // Open notifications
      const notificationButton = screen.getByTestId('notifications-button')
      await user.click(notificationButton)

      // Verify notifications load
      await waitFor(() => {
        expect(screen.getByText('Welcome to the platform!')).toBeInTheDocument()
        expect(screen.getByText('Someone shared a project with you')).toBeInTheDocument()
      })

      // Test marking notification as read
      const unreadNotification = screen.getByTestId('notification-notif-1')
      expect(unreadNotification).toHaveClass('unread')

      const markReadButton = within(unreadNotification).getByRole('button', { name: /mark as read/i })
      await user.click(markReadButton)

      await waitFor(() => {
        expect(unreadNotification).toHaveClass('read')
      })

      // Test mark all as read
      const markAllReadButton = screen.getByRole('button', { name: /mark all as read/i })
      await user.click(markAllReadButton)

      await waitFor(() => {
        expect(screen.getAllByTestId(/notification-/).every(el => el.classList.contains('read'))).toBe(true)
      })
    })

    it('should handle notification filtering', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      const notificationButton = screen.getByTestId('notifications-button')
      await user.click(notificationButton)

      // Test unread filter
      const unreadOnlyToggle = screen.getByRole('checkbox', { name: /unread only/i })
      await user.click(unreadOnlyToggle)

      await waitFor(() => {
        expect(screen.getByText('Welcome to the platform!')).toBeInTheDocument()
        expect(screen.queryByText('Someone shared a project with you')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling and Resilience', () => {
    beforeEach(() => {
      document.cookie = 'authToken=mock-jwt-token'
    })

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock server error
      server.use(
        rest.get('/api/projects', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({
            success: false,
            error: 'Internal server error'
          }))
        })
      )

      render(<App />, { wrapper: TestWrapper })

      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
      })

      // Verify error monitoring
      expect(mockErrorMonitoring.captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'api',
          statusCode: 500
        })
      )

      // Test retry functionality
      server.resetHandlers() // Restore normal behavior

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument()
      })
    })

    it('should handle network timeouts', async () => {
      const user = userEvent.setup()

      // Mock network timeout
      server.use(
        rest.get('/api/projects', (req, res, ctx) => {
          return res(ctx.delay('infinite'))
        })
      )

      render(<App />, { wrapper: TestWrapper })

      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      // After timeout, should show error
      await waitFor(() => {
        expect(screen.getByText(/request timed out/i)).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('should handle unauthorized access', async () => {
      const user = userEvent.setup()

      // Clear auth token
      document.cookie = 'authToken='

      // Mock unauthorized response
      server.use(
        rest.get('/api/projects', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({
            success: false,
            error: 'Unauthorized'
          }))
        })
      )

      render(<App />, { wrapper: TestWrapper })

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByTestId('login-form')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Caching', () => {
    beforeEach(() => {
      document.cookie = 'authToken=mock-jwt-token'
    })

    it('should implement request caching', async () => {
      const user = userEvent.setup()

      let requestCount = 0
      server.use(
        rest.get('/api/projects', (req, res, ctx) => {
          requestCount++
          return res(ctx.json({
            success: true,
            projects: [{ id: 'project-1', name: 'Test Project', description: 'Test' }],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
          }))
        })
      )

      render(<App />, { wrapper: TestWrapper })

      // Navigate to projects twice
      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument()
      })

      // Navigate away and back
      const dashboardLink = screen.getByTestId('dashboard-nav')
      await user.click(dashboardLink)

      await user.click(projectsLink)

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument()
      })

      // Should have made only one request due to caching
      expect(requestCount).toBe(1)
    })

    it('should track API performance metrics', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument()
      })

      // Verify performance tracking
      expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith(
        'api_request',
        expect.objectContaining({
          endpoint: '/api/projects',
          method: 'GET',
          duration: expect.any(Number),
          success: true
        })
      )
    })
  })
})

// Helper function to work within specific elements
function within(element: HTMLElement) {
  return {
    getByRole: (role: string, options?: any) => {
      const elements = screen.getAllByRole(role, options)
      return elements.find(el => element.contains(el)) || elements[0]
    },
    getByText: (text: string | RegExp) => {
      return screen.getByText(text, { container: element })
    }
  }
}