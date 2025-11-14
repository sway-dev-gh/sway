/**
 * Comprehensive Integration Tests for User Workflows
 * Tests complete end-to-end user journeys for world-class quality assurance
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { NotificationProvider } from '../../contexts/NotificationContext'
import { CollaborationProvider } from '../../contexts/CollaborationContext'
import App from '../../App'
import { analytics } from '../../lib/analytics'
import { errorMonitoring } from '../../lib/errorMonitoring'
import { performanceOptimizer } from '../../lib/performanceOptimization'

// Mock external dependencies
jest.mock('../../lib/analytics')
jest.mock('../../lib/errorMonitoring')
jest.mock('../../lib/performanceOptimization')
jest.mock('socket.io-client')

const mockAnalytics = analytics as jest.Mocked<typeof analytics>
const mockErrorMonitoring = errorMonitoring as jest.Mocked<typeof errorMonitoring>
const mockPerformanceOptimizer = performanceOptimizer as jest.Mocked<typeof performanceOptimizer>

// Mock WebSocket for real-time features
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connected: true,
  disconnect: jest.fn(),
  connect: jest.fn()
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket)
}))

// Mock API server
const server = setupServer(
  rest.post('/api/auth/signup', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      user: { id: '1', email: 'test@example.com', name: 'Test User' }
    }))
  }),
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      user: { id: '1', email: 'test@example.com', name: 'Test User' }
    }))
  }),
  rest.get('/api/auth/verify', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      user: { id: '1', email: 'test@example.com', name: 'Test User' }
    }))
  }),
  rest.get('/api/projects', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      projects: [
        { id: '1', name: 'Test Project', description: 'A test project' }
      ]
    }))
  }),
  rest.post('/api/projects', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      project: { id: '2', name: 'New Project', description: 'New test project' }
    }))
  }),
  rest.get('/api/notifications', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      notifications: [
        { id: '1', type: 'info', message: 'Welcome!', read: false, timestamp: new Date().toISOString() }
      ],
      total: 1
    }))
  }),
  rest.put('/api/notifications/:id/read', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <CollaborationProvider>
          {children}
        </CollaborationProvider>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
)

describe('End-to-End User Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    mockAnalytics.track.mockClear()
    mockErrorMonitoring.captureError.mockClear()
    mockPerformanceOptimizer.optimizeComponent.mockClear()
  })

  describe('Complete Authentication Flow', () => {
    it('should handle complete signup → login → dashboard workflow', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      // Step 1: Navigate to signup
      const signupLink = await screen.findByTestId('signup-link')
      await user.click(signupLink)

      // Step 2: Fill signup form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const nameInput = screen.getByLabelText(/name/i)
      const signupButton = screen.getByRole('button', { name: /sign up/i })

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'SecurePassword123!')
      await user.type(nameInput, 'New User')

      // Step 3: Submit signup
      await user.click(signupButton)

      // Step 4: Verify redirect to dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      })

      // Step 5: Verify analytics tracking
      expect(mockAnalytics.track).toHaveBeenCalledWith('user_signup', {
        email: 'newuser@example.com',
        method: 'email'
      })

      // Step 6: Verify user state
      expect(screen.getByText('Welcome, New User!')).toBeInTheDocument()

      // Step 7: Test logout
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)

      // Step 8: Verify redirect to login
      await waitFor(() => {
        expect(screen.getByTestId('login-form')).toBeInTheDocument()
      })

      // Step 9: Login with same credentials
      const loginEmailInput = screen.getByLabelText(/email/i)
      const loginPasswordInput = screen.getByLabelText(/password/i)
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(loginEmailInput, 'newuser@example.com')
      await user.type(loginPasswordInput, 'SecurePassword123!')
      await user.click(loginButton)

      // Step 10: Verify successful login
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      })

      expect(mockAnalytics.track).toHaveBeenCalledWith('user_login', {
        email: 'newuser@example.com',
        method: 'email'
      })
    }, 15000)

    it('should handle authentication errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock failed login
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({
            success: false,
            error: 'Invalid credentials'
          }))
        })
      )

      render(<App />, { wrapper: TestWrapper })

      // Attempt login with invalid credentials
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'invalid@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(loginButton)

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })

      expect(mockErrorMonitoring.captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'authentication',
          severity: 'medium'
        })
      )
    })
  })

  describe('Project Management Workflow', () => {
    it('should handle complete project creation and collaboration', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      // Step 1: Login first
      await loginUser(user)

      // Step 2: Navigate to projects
      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      await waitFor(() => {
        expect(screen.getByTestId('projects-page')).toBeInTheDocument()
      })

      // Step 3: Create new project
      const createProjectButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createProjectButton)

      const projectNameInput = screen.getByLabelText(/project name/i)
      const projectDescriptionInput = screen.getByLabelText(/description/i)

      await user.type(projectNameInput, 'Integration Test Project')
      await user.type(projectDescriptionInput, 'A project for testing integration workflows')

      const saveProjectButton = screen.getByRole('button', { name: /create/i })
      await user.click(saveProjectButton)

      // Step 4: Verify project creation
      await waitFor(() => {
        expect(screen.getByText('Integration Test Project')).toBeInTheDocument()
      })

      expect(mockAnalytics.track).toHaveBeenCalledWith('project_created', {
        projectName: 'Integration Test Project',
        userId: '1'
      })

      // Step 5: Open project for collaboration
      const projectCard = screen.getByTestId('project-card-2')
      await user.click(projectCard)

      // Step 6: Verify collaborative editor loads
      await waitFor(() => {
        expect(screen.getByTestId('collaborative-editor')).toBeInTheDocument()
      })

      // Step 7: Test real-time typing
      const editor = screen.getByTestId('editor-textarea')
      await user.type(editor, 'This is collaborative text!')

      // Simulate receiving real-time updates
      act(() => {
        const collaborativeUpdate = {
          type: 'text-change',
          content: 'This is collaborative text! (Updated by peer)',
          cursor: { line: 1, column: 45 }
        }
        mockSocket.on.mock.calls.find(call => call[0] === 'collaborative-update')?.[1]?.(collaborativeUpdate)
      })

      // Step 8: Verify real-time updates
      await waitFor(() => {
        expect(editor).toHaveValue('This is collaborative text! (Updated by peer)')
      })

      expect(mockAnalytics.track).toHaveBeenCalledWith('collaboration_event', {
        type: 'text_change',
        projectId: '2',
        userId: '1'
      })
    }, 20000)
  })

  describe('Notification System Integration', () => {
    it('should handle complete notification workflow', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      // Step 1: Login
      await loginUser(user)

      // Step 2: Open notifications
      const notificationButton = screen.getByTestId('notifications-button')
      await user.click(notificationButton)

      // Step 3: Verify notifications load
      await waitFor(() => {
        expect(screen.getByText('Welcome!')).toBeInTheDocument()
      })

      // Step 4: Mark notification as read
      const notificationItem = screen.getByTestId('notification-1')
      const markReadButton = within(notificationItem).getByRole('button', { name: /mark as read/i })
      await user.click(markReadButton)

      // Step 5: Verify read state
      await waitFor(() => {
        expect(notificationItem).toHaveClass('read')
      })

      // Step 6: Test real-time notifications
      act(() => {
        const newNotification = {
          id: '2',
          type: 'collaboration',
          message: 'Someone shared a project with you',
          read: false,
          timestamp: new Date().toISOString()
        }
        mockSocket.on.mock.calls.find(call => call[0] === 'notification')?.[1]?.(newNotification)
      })

      // Step 7: Verify new notification appears
      await waitFor(() => {
        expect(screen.getByText('Someone shared a project with you')).toBeInTheDocument()
      })

      expect(mockAnalytics.track).toHaveBeenCalledWith('notification_received', {
        type: 'collaboration',
        userId: '1'
      })
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle network failures gracefully', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      // Step 1: Login successfully
      await loginUser(user)

      // Step 2: Simulate network failure
      server.use(
        rest.get('/api/projects', (req, res, ctx) => {
          return res.networkError('Network connection failed')
        })
      )

      // Step 3: Try to load projects
      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      // Step 4: Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Step 5: Verify retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i })

      // Restore network
      server.resetHandlers()

      await user.click(retryButton)

      // Step 6: Verify successful recovery
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument()
      })

      expect(mockErrorMonitoring.captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'network',
          severity: 'high'
        })
      )
    })
  })

  describe('Performance and Optimization', () => {
    it('should optimize performance during heavy usage', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      await loginUser(user)

      // Simulate heavy collaborative editing
      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      const projectCard = screen.getByTestId('project-card-1')
      await user.click(projectCard)

      const editor = await screen.findByTestId('editor-textarea')

      // Simulate rapid typing and updates
      for (let i = 0; i < 50; i++) {
        await user.type(editor, `Line ${i} of content. `)

        // Simulate collaborative updates
        act(() => {
          const update = {
            type: 'text-change',
            content: editor.textContent + ` (Update ${i})`,
            cursor: { line: i + 1, column: 20 }
          }
          mockSocket.on.mock.calls.find(call => call[0] === 'collaborative-update')?.[1]?.(update)
        })
      }

      // Verify performance optimization was called
      expect(mockPerformanceOptimizer.optimizeComponent).toHaveBeenCalledWith(
        'CollaborativeTextEditor',
        expect.any(Object)
      )

      // Verify analytics tracked performance
      expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith(
        'heavy_editing_session',
        expect.objectContaining({
          operationCount: expect.any(Number),
          duration: expect.any(Number)
        })
      )
    }, 25000)
  })

  describe('Cross-Component Integration', () => {
    it('should handle complex interactions between all components', async () => {
      const user = userEvent.setup()

      render(<App />, { wrapper: TestWrapper })

      // Step 1: Complete authentication
      await loginUser(user)

      // Step 2: Create project
      const projectsLink = screen.getByTestId('projects-nav')
      await user.click(projectsLink)

      const createProjectButton = screen.getByRole('button', { name: /create project/i })
      await user.click(createProjectButton)

      const projectNameInput = screen.getByLabelText(/project name/i)
      await user.type(projectNameInput, 'Cross-Component Test')

      const saveProjectButton = screen.getByRole('button', { name: /create/i })
      await user.click(saveProjectButton)

      // Step 3: Start collaboration
      const newProjectCard = screen.getByText('Cross-Component Test')
      await user.click(newProjectCard)

      const editor = await screen.findByTestId('editor-textarea')
      await user.type(editor, 'Testing cross-component integration')

      // Step 4: Trigger notifications through collaboration
      act(() => {
        const collaborationNotification = {
          id: '3',
          type: 'collaboration',
          message: 'User started editing your project',
          read: false,
          timestamp: new Date().toISOString()
        }
        mockSocket.on.mock.calls.find(call => call[0] === 'notification')?.[1]?.(collaborationNotification)
      })

      // Step 5: Verify notification appears while in editor
      await waitFor(() => {
        expect(screen.getByTestId('notification-badge')).toHaveTextContent('1')
      })

      // Step 6: Handle error in one component, verify others remain stable
      server.use(
        rest.put('/api/notifications/3/read', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }))
        })
      )

      const notificationButton = screen.getByTestId('notifications-button')
      await user.click(notificationButton)

      const markReadButton = screen.getByTestId('mark-read-3')
      await user.click(markReadButton)

      // Step 7: Verify error handling doesn't break other components
      await waitFor(() => {
        expect(screen.getByText(/failed to mark as read/i)).toBeInTheDocument()
      })

      // Editor should still work
      expect(editor).toBeEnabled()

      // Can still type in editor
      await user.type(editor, ' - Still working!')

      // Step 8: Verify all components report metrics correctly
      expect(mockAnalytics.track).toHaveBeenCalledWith('cross_component_interaction', {
        components: ['auth', 'projects', 'editor', 'notifications'],
        sessionId: expect.any(String)
      })
    }, 30000)
  })
})

// Helper function for login
async function loginUser(user: any) {
  const emailInput = screen.getByLabelText(/email/i)
  const passwordInput = screen.getByLabelText(/password/i)
  const loginButton = screen.getByRole('button', { name: /sign in/i })

  await user.type(emailInput, 'test@example.com')
  await user.type(passwordInput, 'password123')
  await user.click(loginButton)

  await waitFor(() => {
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })
}

// Helper function to test within component
function within(element: HTMLElement) {
  return {
    getByRole: (role: string, options?: any) => {
      return screen.getByRole(role, { ...options, container: element })
    },
    getByText: (text: string | RegExp) => {
      return screen.getByText(text, { container: element })
    },
    getByTestId: (testId: string) => {
      return screen.getByTestId(testId, { container: element })
    }
  }
}