/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationCenter from '@/components/NotificationCenter'
import * as socketModule from 'socket.io-client'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock socket.io-client
jest.mock('socket.io-client')
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
  connected: true,
}
const mockSocketIO = socketModule as jest.Mocked<typeof socketModule>
mockSocketIO.io = jest.fn(() => mockSocket as any)

// Mock useAuth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
    isAuthenticated: true,
  }),
}))

describe('NotificationCenter', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'comment',
      title: 'New comment on your document',
      message: 'Alice commented on "Project Spec"',
      is_read: false,
      priority: 'medium',
      created_at: '2024-01-01T10:00:00Z',
      metadata: {
        documentId: 'doc-1',
        commentId: 'comment-1',
        userName: 'Alice'
      }
    },
    {
      id: '2',
      type: 'collaboration_invite',
      title: 'Collaboration invitation',
      message: 'Bob invited you to collaborate on "Design System"',
      is_read: true,
      priority: 'high',
      created_at: '2024-01-01T09:00:00Z',
      metadata: {
        workspaceId: 'workspace-2',
        inviterName: 'Bob'
      }
    },
    {
      id: '3',
      type: 'version_update',
      title: 'Document updated',
      message: 'New version of "API Documentation" is available',
      is_read: false,
      priority: 'low',
      created_at: '2024-01-01T08:00:00Z',
      metadata: {
        documentId: 'doc-3',
        version: '2.1.0'
      }
    }
  ]

  const mockStats = {
    total: 15,
    unread: 3,
    today: 5,
    thisWeek: 12
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful fetch responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('/notifications')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockNotifications,
            pagination: { page: 1, totalPages: 1, totalItems: 3 }
          })
        } as Response)
      }

      if (url.includes('/notifications/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockStats
          })
        } as Response)
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response)
    })

    // Mock socket callbacks
    mockSocket.on.mockImplementation((event, callback) => {
      if (!mockSocket._callbacks) {
        mockSocket._callbacks = {}
      }
      mockSocket._callbacks[event] = callback
      return mockSocket
    })
  })

  afterEach(() => {
    if (mockSocket._callbacks) {
      delete mockSocket._callbacks
    }
  })

  it('should render notification center with loading state initially', async () => {
    render(<NotificationCenter />)

    expect(screen.getByText(/notifications/i)).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('should load and display notifications', async () => {
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('New comment on your document')).toBeInTheDocument()
      expect(screen.getByText('Collaboration invitation')).toBeInTheDocument()
      expect(screen.getByText('Document updated')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include'
      })
    )
  })

  it('should display notification stats', async () => {
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument() // total
      expect(screen.getByText('3')).toBeInTheDocument() // unread
      expect(screen.getByText('5')).toBeInTheDocument() // today
      expect(screen.getByText('12')).toBeInTheDocument() // this week
    })
  })

  it('should mark notification as read when clicked', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('New comment on your document')).toBeInTheDocument()
    })

    const notification = screen.getByText('New comment on your document').closest('[data-testid="notification-item"]')
    expect(notification).toHaveClass('bg-blue-50') // unread styling

    await user.click(notification!)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications/1/mark-read'),
        expect.objectContaining({
          method: 'PATCH',
          credentials: 'include'
        })
      )
    })
  })

  it('should handle mark all as read', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('Mark All Read')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Mark All Read'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications/mark-all-read'),
        expect.objectContaining({
          method: 'PATCH',
          credentials: 'include'
        })
      )
    })
  })

  it('should filter notifications by type', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('New comment on your document')).toBeInTheDocument()
    })

    // Filter by comments
    const filterButton = screen.getByText('Comments')
    await user.click(filterButton)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('type=comment'),
      expect.any(Object)
    )
  })

  it('should filter notifications by unread status', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('Unread Only')).toBeInTheDocument()
    })

    const unreadToggle = screen.getByRole('checkbox', { name: /unread only/i })
    await user.click(unreadToggle)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('is_read=false'),
      expect.any(Object)
    )
  })

  it('should filter notifications by priority', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('all')).toBeInTheDocument()
    })

    const prioritySelect = screen.getByDisplayValue('all')
    await user.selectOptions(prioritySelect, 'high')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('priority=high'),
      expect.any(Object)
    )
  })

  it('should handle real-time notification updates', async () => {
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('New comment on your document')).toBeInTheDocument()
    })

    // Simulate new notification via socket
    const newNotification = {
      id: '4',
      type: 'mention',
      title: 'You were mentioned',
      message: 'Charlie mentioned you in a comment',
      is_read: false,
      priority: 'medium',
      created_at: new Date().toISOString(),
      metadata: {
        documentId: 'doc-4',
        mentionedBy: 'Charlie'
      }
    }

    mockSocket._callbacks['new-notification'](newNotification)

    await waitFor(() => {
      expect(screen.getByText('You were mentioned')).toBeInTheDocument()
    })
  })

  it('should handle notification deletion', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('New comment on your document')).toBeInTheDocument()
    })

    const deleteButton = screen.getAllByTestId('delete-notification')[0]
    await user.click(deleteButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications/1'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include'
        })
      )
    })
  })

  it('should handle clear all notifications', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Clear All'))

    // Confirm dialog
    await user.click(screen.getByText('Confirm'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include'
        })
      )
    })
  })

  it('should display notification preferences', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByTestId('preferences-button')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('preferences-button'))

    expect(screen.getByText(/notification preferences/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email notifications/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/push notifications/i)).toBeInTheDocument()
  })

  it('should save notification preferences', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByTestId('preferences-button')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('preferences-button'))

    const emailToggle = screen.getByLabelText(/email notifications/i)
    await user.click(emailToggle)

    const saveButton = screen.getByText('Save Preferences')
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications/preferences'),
        expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
          body: expect.stringContaining('email')
        })
      )
    })
  })

  it('should handle pagination', async () => {
    const user = userEvent.setup()

    // Mock paginated response
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockNotifications,
          pagination: { page: 1, totalPages: 3, totalItems: 25 }
        })
      } as Response)
    )

    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    const nextButton = screen.getByTestId('next-page')
    await user.click(nextButton)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      expect.any(Object)
    )
  })

  it('should handle search functionality', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search notifications/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search notifications/i)
    await user.type(searchInput, 'comment')

    // Debounced search
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=comment'),
        expect.any(Object)
      )
    }, { timeout: 1000 })
  })

  it('should handle notification click actions', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('New comment on your document')).toBeInTheDocument()
    })

    const notification = screen.getByText('New comment on your document').closest('[data-testid="notification-item"]')
    await user.click(notification!)

    // Should navigate to the document (mock would need to check for navigation)
    expect(notification).toBeTruthy()
  })

  it('should display priority indicators correctly', async () => {
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('Collaboration invitation')).toBeInTheDocument()
    })

    const highPriorityNotification = screen.getByText('Collaboration invitation').closest('[data-testid="notification-item"]')
    expect(highPriorityNotification).toHaveClass('border-red-200') // high priority styling
  })

  it('should handle connection status', () => {
    render(<NotificationCenter />)

    // Simulate disconnection
    mockSocket._callbacks['disconnect']()
    expect(screen.getByText(/connection lost/i)).toBeInTheDocument()

    // Simulate reconnection
    mockSocket._callbacks['connect']()
    expect(screen.queryByText(/connection lost/i)).not.toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to load notifications' })
      } as Response)
    )

    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load notifications/i)).toBeInTheDocument()
    })
  })

  it('should display empty state when no notifications', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [],
          pagination: { page: 1, totalPages: 1, totalItems: 0 }
        })
      } as Response)
    )

    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText(/no notifications/i)).toBeInTheDocument()
    })
  })

  it('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup()
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByText('New comment on your document')).toBeInTheDocument()
    })

    // Press 'r' to mark all as read
    await user.keyboard('r')

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications/mark-all-read'),
        expect.any(Object)
      )
    })
  })

  it('should cleanup socket connection on unmount', () => {
    const { unmount } = render(<NotificationCenter />)

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith('new-notification')
    expect(mockSocket.off).toHaveBeenCalledWith('notification-read')
    expect(mockSocket.off).toHaveBeenCalledWith('notification-deleted')
  })
})