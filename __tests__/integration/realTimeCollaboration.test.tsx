/**
 * Real-Time Collaboration Integration Tests
 * Comprehensive testing of WebSocket-based real-time features for world-class collaboration
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { CollaborationProvider } from '../../contexts/CollaborationContext'
import { NotificationProvider } from '../../contexts/NotificationContext'
import CollaborativeTextEditor from '../../components/CollaborativeTextEditor'
import NotificationCenter from '../../components/NotificationCenter'
import { analytics } from '../../lib/analytics'
import { errorMonitoring } from '../../lib/errorMonitoring'
import { performanceOptimizer } from '../../lib/performanceOptimization'

// Mock dependencies
jest.mock('../../lib/analytics')
jest.mock('../../lib/errorMonitoring')
jest.mock('../../lib/performanceOptimization')

const mockAnalytics = analytics as jest.Mocked<typeof analytics>
const mockErrorMonitoring = errorMonitoring as jest.Mocked<typeof errorMonitoring>
const mockPerformanceOptimizer = performanceOptimizer as jest.Mocked<typeof performanceOptimizer>

// Mock WebSocket with comprehensive real-time simulation
class MockWebSocket {
  public onopen: ((event: Event) => void) | null = null
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  public onclose: ((event: CloseEvent) => void) | null = null
  public readyState: number = WebSocket.CONNECTING

  private eventListeners: { [key: string]: Function[] } = {}

  constructor(public url: string) {
    // Simulate connection opening after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string) {
    // Simulate echo for testing
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }))
      }
    }, 5)
  }

  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }

  addEventListener(type: string, listener: Function) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = []
    }
    this.eventListeners[type].push(listener)
  }

  removeEventListener(type: string, listener: Function) {
    if (this.eventListeners[type]) {
      const index = this.eventListeners[type].indexOf(listener)
      if (index > -1) {
        this.eventListeners[type].splice(index, 1)
      }
    }
  }

  // Utility method for testing - trigger events manually
  triggerEvent(type: string, data?: any) {
    if (this.eventListeners[type]) {
      this.eventListeners[type].forEach(listener => {
        if (type === 'message') {
          listener(new MessageEvent('message', { data: JSON.stringify(data) }))
        } else {
          listener(new Event(type))
        }
      })
    }
  }
}

// Mock Socket.IO client
const mockSocket = {
  connected: false,
  id: 'test-socket-id',
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(() => {
    mockSocket.connected = true
  }),
  disconnect: jest.fn(() => {
    mockSocket.connected = false
  }),
  // Helper methods for testing
  triggerEvent: (event: string, data: any) => {
    const handlers = mockSocket.on.mock.calls
      .filter(call => call[0] === event)
      .map(call => call[1])
    handlers.forEach(handler => handler(data))
  }
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket)
}))

// Mock global WebSocket
global.WebSocket = MockWebSocket as any

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

describe('Real-Time Collaboration Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSocket.connected = false
    mockSocket.on.mockClear()
    mockSocket.off.mockClear()
    mockSocket.emit.mockClear()
  })

  describe('WebSocket Connection Management', () => {
    it('should establish and maintain WebSocket connection', async () => {
      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      // Verify connection attempt
      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
        expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function))
      })

      // Simulate successful connection
      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      // Verify connection status
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
      })

      expect(mockAnalytics.track).toHaveBeenCalledWith('websocket_connected', {
        projectId: 'test-project'
      })
    })

    it('should handle connection failures and retry logic', async () => {
      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      // Simulate connection error
      act(() => {
        mockSocket.triggerEvent('error', new Error('Connection failed'))
      })

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected')
      })

      expect(mockErrorMonitoring.captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'websocket',
          severity: 'high'
        })
      )

      // Verify retry attempt
      await waitFor(() => {
        expect(mockSocket.connect).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should handle graceful disconnection and reconnection', async () => {
      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      // Connect first
      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
      })

      // Simulate disconnection
      act(() => {
        mockSocket.triggerEvent('disconnect', { reason: 'transport close' })
      })

      // Verify disconnection handling
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Reconnecting...')
      })

      // Simulate successful reconnection
      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
      })

      expect(mockAnalytics.track).toHaveBeenCalledWith('websocket_reconnected', {
        projectId: 'test-project',
        downtime: expect.any(Number)
      })
    })
  })

  describe('Real-Time Text Collaboration', () => {
    it('should synchronize text changes between users', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      // Connect and wait for editor to be ready
      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      const editor = await screen.findByTestId('editor-textarea')

      // User types text
      await user.type(editor, 'Hello, world!')

      // Verify local change
      expect(editor).toHaveValue('Hello, world!')

      // Verify change is sent to server
      expect(mockSocket.emit).toHaveBeenCalledWith('text-change', {
        projectId: 'test-project',
        content: 'Hello, world!',
        cursor: expect.any(Object),
        userId: expect.any(String)
      })

      // Simulate receiving change from another user
      act(() => {
        mockSocket.triggerEvent('text-change', {
          projectId: 'test-project',
          content: 'Hello, world! How are you?',
          cursor: { line: 1, column: 26 },
          userId: 'other-user',
          userName: 'Other User'
        })
      })

      // Verify text is synchronized
      await waitFor(() => {
        expect(editor).toHaveValue('Hello, world! How are you?')
      })

      expect(mockAnalytics.track).toHaveBeenCalledWith('collaboration_sync', {
        projectId: 'test-project',
        changeType: 'text',
        userId: expect.any(String)
      })
    })

    it('should handle concurrent editing with operational transforms', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      const editor = await screen.findByTestId('editor-textarea')

      // Set initial text
      await user.type(editor, 'The quick brown fox')

      // Simulate concurrent edits
      // User 1 inserts at position 4
      await user.click(editor)
      fireEvent.change(editor, { target: { value: 'The very quick brown fox' } })

      // Simulate User 2 inserting at position 16 (original position)
      act(() => {
        mockSocket.triggerEvent('text-change', {
          projectId: 'test-project',
          content: 'The quick brown lazy fox',
          operations: [{
            type: 'insert',
            position: 16,
            text: 'lazy ',
            userId: 'user-2'
          }],
          userId: 'user-2'
        })
      })

      // Verify operational transform resolved conflict correctly
      await waitFor(() => {
        expect(editor).toHaveValue('The very quick brown lazy fox')
      })

      expect(mockAnalytics.track).toHaveBeenCalledWith('operational_transform', {
        projectId: 'test-project',
        conflictType: 'concurrent_edit',
        resolved: true
      })
    })

    it('should track and display user cursors in real-time', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      const editor = await screen.findByTestId('editor-textarea')

      // Move cursor
      await user.click(editor)
      fireEvent.change(editor, { target: { selectionStart: 10, selectionEnd: 10 } })

      // Verify cursor position is sent
      expect(mockSocket.emit).toHaveBeenCalledWith('cursor-move', {
        projectId: 'test-project',
        position: 10,
        userId: expect.any(String),
        userName: expect.any(String)
      })

      // Simulate receiving other user's cursor
      act(() => {
        mockSocket.triggerEvent('cursor-move', {
          projectId: 'test-project',
          position: 5,
          userId: 'other-user',
          userName: 'Other User',
          color: '#ff6b6b'
        })
      })

      // Verify other user's cursor is displayed
      await waitFor(() => {
        expect(screen.getByTestId('cursor-other-user')).toBeInTheDocument()
      })

      const otherCursor = screen.getByTestId('cursor-other-user')
      expect(otherCursor).toHaveStyle('background-color: #ff6b6b')
    })
  })

  describe('Real-Time Notifications', () => {
    it('should receive and display real-time notifications', async () => {
      render(
        <TestWrapper>
          <NotificationCenter />
        </TestWrapper>
      )

      // Simulate receiving notification
      act(() => {
        mockSocket.triggerEvent('notification', {
          id: 'notif-1',
          type: 'collaboration',
          message: 'Someone joined your project',
          timestamp: new Date().toISOString(),
          userId: 'current-user'
        })
      })

      // Verify notification appears
      await waitFor(() => {
        expect(screen.getByText('Someone joined your project')).toBeInTheDocument()
      })

      // Verify notification badge updates
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('1')

      expect(mockAnalytics.track).toHaveBeenCalledWith('real_time_notification', {
        type: 'collaboration',
        source: 'websocket'
      })
    })

    it('should handle notification preferences and filtering', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <NotificationCenter />
        </TestWrapper>
      )

      // Open notification settings
      const settingsButton = screen.getByTestId('notification-settings')
      await user.click(settingsButton)

      // Disable collaboration notifications
      const collaborationToggle = screen.getByTestId('notification-toggle-collaboration')
      await user.click(collaborationToggle)

      // Simulate receiving disabled notification type
      act(() => {
        mockSocket.triggerEvent('notification', {
          id: 'notif-2',
          type: 'collaboration',
          message: 'This should be filtered',
          timestamp: new Date().toISOString()
        })
      })

      // Verify notification is filtered
      await waitFor(() => {
        expect(screen.queryByText('This should be filtered')).not.toBeInTheDocument()
      })

      // Send allowed notification type
      act(() => {
        mockSocket.triggerEvent('notification', {
          id: 'notif-3',
          type: 'system',
          message: 'System update available',
          timestamp: new Date().toISOString()
        })
      })

      // Verify it appears
      await waitFor(() => {
        expect(screen.getByText('System update available')).toBeInTheDocument()
      })
    })
  })

  describe('Collaborative File Management', () => {
    it('should handle real-time file operations', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      // Simulate file upload by another user
      act(() => {
        mockSocket.triggerEvent('file-uploaded', {
          projectId: 'test-project',
          file: {
            id: 'file-1',
            name: 'document.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedBy: 'other-user',
            uploadedByName: 'Other User'
          }
        })
      })

      // Verify file appears in project
      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
        expect(screen.getByText('Uploaded by Other User')).toBeInTheDocument()
      })

      // Simulate file deletion
      const deleteButton = screen.getByTestId('delete-file-file-1')
      await user.click(deleteButton)

      // Verify delete event is sent
      expect(mockSocket.emit).toHaveBeenCalledWith('file-delete', {
        projectId: 'test-project',
        fileId: 'file-1',
        userId: expect.any(String)
      })

      // Simulate receiving delete confirmation
      act(() => {
        mockSocket.triggerEvent('file-deleted', {
          projectId: 'test-project',
          fileId: 'file-1',
          deletedBy: 'current-user'
        })
      })

      // Verify file is removed
      await waitFor(() => {
        expect(screen.queryByText('document.pdf')).not.toBeInTheDocument()
      })
    })
  })

  describe('Performance Under Load', () => {
    it('should handle high-frequency updates efficiently', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      const editor = await screen.findByTestId('editor-textarea')

      // Simulate rapid typing
      const startTime = Date.now()

      for (let i = 0; i < 100; i++) {
        await user.type(editor, 'a')

        // Simulate receiving updates from other users
        act(() => {
          mockSocket.triggerEvent('text-change', {
            projectId: 'test-project',
            content: editor.value + 'b',
            cursor: { line: 1, column: editor.value.length + 2 },
            userId: `user-${i % 5}` // Simulate 5 concurrent users
          })
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Verify performance optimization was triggered
      expect(mockPerformanceOptimizer.optimizeComponent).toHaveBeenCalledWith(
        'CollaborativeTextEditor',
        expect.objectContaining({
          updateFrequency: expect.any(Number),
          concurrentUsers: expect.any(Number)
        })
      )

      // Verify performance metrics
      expect(mockAnalytics.trackPerformance).toHaveBeenCalledWith(
        'high_frequency_collaboration',
        {
          duration,
          updateCount: 100,
          averageLatency: expect.any(Number),
          concurrentUsers: 5
        }
      )

      // Should remain responsive
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
    })

    it('should implement message queuing for offline scenarios', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      // Start connected
      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      const editor = await screen.findByTestId('editor-textarea')

      // Type while connected
      await user.type(editor, 'Online text')

      // Simulate disconnection
      act(() => {
        mockSocket.connected = false
        mockSocket.triggerEvent('disconnect', { reason: 'transport close' })
      })

      // Continue typing while offline
      await user.type(editor, ' - offline text')

      // Verify changes are queued
      expect(screen.getByTestId('queued-changes-count')).toHaveTextContent('1')

      // Simulate reconnection
      act(() => {
        mockSocket.connected = true
        mockSocket.triggerEvent('connect', {})
      })

      // Verify queued changes are sent
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('sync-queued-changes', {
          projectId: 'test-project',
          changes: expect.arrayContaining([
            expect.objectContaining({
              content: 'Online text - offline text'
            })
          ])
        })
      })

      expect(screen.getByTestId('queued-changes-count')).toHaveTextContent('0')
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle WebSocket message corruption', async () => {
      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      // Simulate corrupted message
      act(() => {
        mockSocket.triggerEvent('text-change', 'invalid-json-data')
      })

      // Verify error handling
      expect(mockErrorMonitoring.captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'websocket_message',
          severity: 'medium'
        })
      )

      // Verify system remains functional
      const editor = screen.getByTestId('editor-textarea')
      expect(editor).toBeEnabled()
    })

    it('should handle server-side errors gracefully', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      // Simulate server error response
      act(() => {
        mockSocket.triggerEvent('error-response', {
          type: 'SAVE_FAILED',
          message: 'Failed to save document',
          code: 'SERVER_ERROR'
        })
      })

      // Verify error notification
      await waitFor(() => {
        expect(screen.getByText('Failed to save document')).toBeInTheDocument()
      })

      // Verify retry mechanism
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      expect(mockSocket.emit).toHaveBeenCalledWith('retry-last-operation', {
        projectId: 'test-project'
      })
    })

    it('should maintain data integrity during network issues', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      const editor = await screen.findByTestId('editor-textarea')

      // Type initial content
      await user.type(editor, 'Important document content')

      // Simulate network instability (rapid disconnect/reconnect)
      for (let i = 0; i < 5; i++) {
        act(() => {
          mockSocket.triggerEvent('disconnect', { reason: 'ping timeout' })
        })

        act(() => {
          mockSocket.triggerEvent('connect', {})
        })
      }

      // Verify content integrity is maintained
      expect(editor).toHaveValue('Important document content')

      // Verify conflict resolution request
      expect(mockSocket.emit).toHaveBeenCalledWith('request-document-sync', {
        projectId: 'test-project',
        localVersion: expect.any(String)
      })
    })
  })

  describe('Security and Authorization', () => {
    it('should validate user permissions for collaborative actions', async () => {
      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      // Simulate unauthorized user trying to edit
      act(() => {
        mockSocket.triggerEvent('permission-error', {
          action: 'text-change',
          message: 'Insufficient permissions',
          requiredRole: 'editor'
        })
      })

      // Verify permission error handling
      await waitFor(() => {
        expect(screen.getByText('You do not have permission to edit this document')).toBeInTheDocument()
      })

      // Verify editor is disabled
      const editor = screen.getByTestId('editor-textarea')
      expect(editor).toBeDisabled()
    })

    it('should handle session validation and re-authentication', async () => {
      render(
        <TestWrapper>
          <CollaborativeTextEditor projectId="test-project" />
        </TestWrapper>
      )

      act(() => {
        mockSocket.triggerEvent('connect', {})
      })

      // Simulate session expiry
      act(() => {
        mockSocket.triggerEvent('session-expired', {
          message: 'Session has expired'
        })
      })

      // Verify re-authentication prompt
      await waitFor(() => {
        expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument()
      })

      // Verify redirect to login
      expect(screen.getByTestId('login-redirect')).toBeInTheDocument()
    })
  })
})