/**
 * @jest-environment jsdom
 */

import React, { createRef } from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CollaborativeTextEditor, { CollaborativeTextEditorRef } from '@/components/CollaborativeTextEditor'
import * as socketModule from 'socket.io-client'

// Mock socket.io-client
jest.mock('socket.io-client')
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
  connected: true,
  _callbacks: {} as Record<string, Function> | undefined,
}
const mockSocketIO = socketModule as jest.Mocked<typeof socketModule>
mockSocketIO.io = jest.fn(() => mockSocket as any)

describe('CollaborativeTextEditor', () => {
  const defaultProps = {
    blockId: 'test-block-1',
    workspaceId: 'test-workspace-1',
    initialContent: '',
    placeholder: 'Start typing...',
    onSave: jest.fn(),
    className: '',
    showToolbar: true,
    allowComments: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSocket.on.mockImplementation((event, callback) => {
      // Store callbacks for later triggering
      if (!mockSocket._callbacks) {
        mockSocket._callbacks = {}
      }
      if (mockSocket._callbacks) {
        mockSocket._callbacks[event] = callback
      }
      return mockSocket
    })
  })

  afterEach(() => {
    if (mockSocket._callbacks) {
      delete mockSocket._callbacks
    }
  })

  it('should render with initial content', () => {
    render(
      <CollaborativeTextEditor
        {...defaultProps}
        initialContent="# Welcome\nStart typing here..."
      />
    )

    expect(screen.getByDisplayValue('# Welcome\nStart typing here...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Start typing...')).toBeInTheDocument()
  })

  it('should render with toolbar when showToolbar is true', () => {
    render(
      <CollaborativeTextEditor
        {...defaultProps}
        showToolbar={true}
      />
    )

    expect(screen.getByTestId('toolbar-bold')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-italic')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-heading')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-list')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-link')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-code')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-save')).toBeInTheDocument()
  })

  it('should not render toolbar when showToolbar is false', () => {
    render(
      <CollaborativeTextEditor
        {...defaultProps}
        showToolbar={false}
      />
    )

    expect(screen.queryByTestId('toolbar-bold')).not.toBeInTheDocument()
    expect(screen.queryByTestId('toolbar-italic')).not.toBeInTheDocument()
  })

  it('should establish socket connection on mount', () => {
    render(<CollaborativeTextEditor {...defaultProps} />)

    expect(mockSocketIO.io).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
      { withCredentials: true }
    )
    expect(mockSocket.emit).toHaveBeenCalledWith('join-document', {
      blockId: 'test-block-1',
      workspaceId: 'test-workspace-1'
    })
  })

  it('should handle text changes and emit operations', async () => {
    const user = userEvent.setup()
    render(<CollaborativeTextEditor {...defaultProps} />)

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.type(textarea, 'Hello World')
    })

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'text-operation',
      expect.objectContaining({
        blockId: 'test-block-1',
        operation: expect.objectContaining({
          type: 'insert',
          position: expect.any(Number),
          text: expect.any(String)
        })
      })
    )
  })

  it('should handle remote text operations', () => {
    render(<CollaborativeTextEditor {...defaultProps} />)

    // Simulate remote operation
    act(() => {
      mockSocket._callbacks?.['text-operation']?.({
        operation: {
          type: 'insert',
          position: 0,
          text: 'Remote text'
        },
        userId: 'remote-user-1'
      })
    })

    expect(screen.getByDisplayValue('Remote text')).toBeInTheDocument()
  })

  it('should handle document state sync', () => {
    render(<CollaborativeTextEditor {...defaultProps} />)

    act(() => {
      mockSocket._callbacks?.['document-state']?.({
        content: 'Synced content from server',
        activeUsers: [
          { id: 'user-1', name: 'Alice', cursor: 5 },
          { id: 'user-2', name: 'Bob', cursor: 10 }
        ]
      })
    })

    expect(screen.getByDisplayValue('Synced content from server')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('should handle cursor position updates', async () => {
    const user = userEvent.setup()
    render(<CollaborativeTextEditor {...defaultProps} />)

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.click(textarea)
      fireEvent.change(textarea, { target: { selectionStart: 5, selectionEnd: 5 } })
    })

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'cursor-position',
      expect.objectContaining({
        blockId: 'test-block-1',
        position: 5
      })
    )
  })

  it('should handle remote cursor updates', () => {
    render(<CollaborativeTextEditor {...defaultProps} />)

    act(() => {
      mockSocket._callbacks?.['cursor-update']?.({
        userId: 'remote-user-1',
        position: 10,
        user: { name: 'Remote User', color: '#ff0000' }
      })
    })

    // Check for cursor indicator
    expect(screen.getByText('Remote User')).toBeInTheDocument()
  })

  it('should handle user join/leave events', () => {
    render(<CollaborativeTextEditor {...defaultProps} />)

    // User joins
    act(() => {
      mockSocket._callbacks?.['user-joined']?.({
        userId: 'new-user-1',
        user: { name: 'New User', color: '#00ff00' }
      })
    })

    expect(screen.getByText('New User')).toBeInTheDocument()

    // User leaves
    act(() => {
      mockSocket._callbacks?.['user-left']?.({
        userId: 'new-user-1'
      })
    })

    expect(screen.queryByText('New User')).not.toBeInTheDocument()
  })

  it('should apply text formatting correctly', async () => {
    const user = userEvent.setup()
    render(<CollaborativeTextEditor {...defaultProps} />)

    const textarea = screen.getByRole('textbox')

    // Type some text
    await act(async () => {
      await user.type(textarea, 'Hello World')
    })

    // Select text
    await act(async () => {
      fireEvent.select(textarea, { target: { selectionStart: 0, selectionEnd: 5 } })
    })

    // Apply bold formatting
    await act(async () => {
      await user.click(screen.getByTestId('toolbar-bold'))
    })

    expect(screen.getByDisplayValue('**Hello** World')).toBeInTheDocument()
  })

  it('should handle italic formatting', async () => {
    const user = userEvent.setup()
    render(<CollaborativeTextEditor {...defaultProps} />)

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.type(textarea, 'Hello World')
      fireEvent.select(textarea, { target: { selectionStart: 0, selectionEnd: 5 } })
      await user.click(screen.getByTestId('toolbar-italic'))
    })

    expect(screen.getByDisplayValue('*Hello* World')).toBeInTheDocument()
  })

  it('should handle heading formatting', async () => {
    const user = userEvent.setup()
    render(<CollaborativeTextEditor {...defaultProps} />)

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.type(textarea, 'Heading Text')
      fireEvent.select(textarea, { target: { selectionStart: 0, selectionEnd: 12 } })
      await user.click(screen.getByTestId('toolbar-heading'))
    })

    expect(screen.getByDisplayValue('# Heading Text')).toBeInTheDocument()
  })

  it('should handle list formatting', async () => {
    const user = userEvent.setup()
    render(<CollaborativeTextEditor {...defaultProps} />)

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.type(textarea, 'List Item')
      fireEvent.select(textarea, { target: { selectionStart: 0, selectionEnd: 9 } })
      await user.click(screen.getByTestId('toolbar-list'))
    })

    expect(screen.getByDisplayValue('- List Item')).toBeInTheDocument()
  })

  it('should handle link formatting', async () => {
    const user = userEvent.setup()
    render(<CollaborativeTextEditor {...defaultProps} />)

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.type(textarea, 'Click here')
      fireEvent.select(textarea, { target: { selectionStart: 0, selectionEnd: 10 } })
      await user.click(screen.getByTestId('toolbar-link'))
    })

    expect(screen.getByDisplayValue('[Click here](url)')).toBeInTheDocument()
  })

  it('should handle code formatting', async () => {
    const user = userEvent.setup()
    render(<CollaborativeTextEditor {...defaultProps} />)

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.type(textarea, 'console.log')
      fireEvent.select(textarea, { target: { selectionStart: 0, selectionEnd: 11 } })
      await user.click(screen.getByTestId('toolbar-code'))
    })

    expect(screen.getByDisplayValue('`console.log`')).toBeInTheDocument()
  })

  it('should handle save functionality', async () => {
    const onSave = jest.fn()
    const user = userEvent.setup()

    render(
      <CollaborativeTextEditor
        {...defaultProps}
        onSave={onSave}
      />
    )

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.type(textarea, 'Content to save')
      await user.click(screen.getByTestId('toolbar-save'))
    })

    expect(onSave).toHaveBeenCalledWith('Content to save')
  })

  it('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup()
    render(<CollaborativeTextEditor {...defaultProps} />)

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.type(textarea, 'Hello World')
      fireEvent.select(textarea, { target: { selectionStart: 0, selectionEnd: 5 } })

      // Ctrl+B for bold
      await user.keyboard('{Control>}b{/Control}')
    })

    expect(screen.getByDisplayValue('**Hello** World')).toBeInTheDocument()
  })

  it('should handle Ctrl+S save shortcut', async () => {
    const onSave = jest.fn()
    const user = userEvent.setup()

    render(
      <CollaborativeTextEditor
        {...defaultProps}
        onSave={onSave}
      />
    )

    const textarea = screen.getByRole('textbox')

    await act(async () => {
      await user.type(textarea, 'Content to save')
      await user.keyboard('{Control>}s{/Control}')
    })

    expect(onSave).toHaveBeenCalledWith('Content to save')
  })

  it('should provide ref access to content', () => {
    const ref = createRef<CollaborativeTextEditorRef>()

    render(
      <CollaborativeTextEditor
        {...defaultProps}
        ref={ref}
        initialContent="Initial content"
      />
    )

    expect(ref.current?.getContent()).toBe('Initial content')
  })

  it('should provide ref access to focus method', () => {
    const ref = createRef<CollaborativeTextEditorRef>()

    render(
      <CollaborativeTextEditor
        {...defaultProps}
        ref={ref}
      />
    )

    expect(() => ref.current?.focus()).not.toThrow()
  })

  it('should handle connection status changes', () => {
    render(<CollaborativeTextEditor {...defaultProps} />)

    // Connection lost
    act(() => {
      mockSocket.connected = false
      mockSocket._callbacks?.['disconnect']()
    })

    expect(screen.getByText(/offline/i)).toBeInTheDocument()

    // Connection restored
    act(() => {
      mockSocket.connected = true
      mockSocket._callbacks?.['connect']()
    })

    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument()
  })

  it('should handle comment mode when allowComments is true', () => {
    render(
      <CollaborativeTextEditor
        {...defaultProps}
        allowComments={true}
      />
    )

    expect(screen.getByTestId('toolbar-comment')).toBeInTheDocument()
  })

  it('should not show comment button when allowComments is false', () => {
    render(
      <CollaborativeTextEditor
        {...defaultProps}
        allowComments={false}
      />
    )

    expect(screen.queryByTestId('toolbar-comment')).not.toBeInTheDocument()
  })

  it('should cleanup socket connection on unmount', () => {
    const { unmount } = render(<CollaborativeTextEditor {...defaultProps} />)

    unmount()

    expect(mockSocket.emit).toHaveBeenCalledWith('leave-document', {
      blockId: 'test-block-1'
    })
    expect(mockSocket.off).toHaveBeenCalledWith('text-operation')
    expect(mockSocket.off).toHaveBeenCalledWith('cursor-update')
    expect(mockSocket.off).toHaveBeenCalledWith('user-joined')
    expect(mockSocket.off).toHaveBeenCalledWith('user-left')
    expect(mockSocket.off).toHaveBeenCalledWith('document-state')
  })

  it('should handle invalid operations gracefully', () => {
    render(<CollaborativeTextEditor {...defaultProps} />)

    // Send invalid operation
    act(() => {
      mockSocket._callbacks?.['text-operation']?.({
        operation: {
          type: 'invalid',
          position: -1,
          text: null
        },
        userId: 'remote-user-1'
      })
    })

    // Should not crash
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should handle operations with position beyond text length', () => {
    render(<CollaborativeTextEditor {...defaultProps} initialContent="Short" />)

    act(() => {
      mockSocket._callbacks?.['text-operation']?.({
        operation: {
          type: 'insert',
          position: 1000, // Beyond text length
          text: 'New text'
        },
        userId: 'remote-user-1'
      })
    })

    // Should append at the end
    expect(screen.getByDisplayValue('ShortNew text')).toBeInTheDocument()
  })

  it('should handle delete operations', () => {
    render(<CollaborativeTextEditor {...defaultProps} initialContent="Hello World" />)

    act(() => {
      mockSocket._callbacks?.['text-operation']?.({
        operation: {
          type: 'delete',
          position: 5,
          length: 6
        },
        userId: 'remote-user-1'
      })
    })

    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument()
  })
})