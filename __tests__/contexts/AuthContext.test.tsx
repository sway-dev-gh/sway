/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import * as authApi from '@/lib/auth'

// Mock the auth API module
jest.mock('@/lib/auth')
const mockAuthApi = authApi.authApi as jest.Mocked<typeof authApi.authApi>

// Test component to access the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, signup, logout } = useAuth()

  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <button data-testid="login" onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button data-testid="signup" onClick={() => signup('test@example.com', 'password', 'testuser')}>
        Signup
      </button>
      <button data-testid="logout" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should provide initial state with no authenticated user', () => {
    mockAuthApi.getUser.mockReturnValue(null)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('null')
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
  })

  it('should load existing user from localStorage on initialization', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' }
    mockAuthApi.getUser.mockReturnValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })
  })

  it('should handle successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' }
    mockAuthApi.getUser.mockReturnValue(null)
    mockAuthApi.login.mockResolvedValue({
      success: true,
      user: mockUser
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('login'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    })

    expect(mockAuthApi.login).toHaveBeenCalledWith('test@example.com', 'password')
  })

  it('should handle failed login', async () => {
    mockAuthApi.getUser.mockReturnValue(null)
    mockAuthApi.login.mockResolvedValue({
      success: false,
      message: 'Invalid credentials'
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('login'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    })

    expect(mockAuthApi.login).toHaveBeenCalledWith('test@example.com', 'password')
  })

  it('should handle successful signup', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' }
    mockAuthApi.getUser.mockReturnValue(null)
    mockAuthApi.signup.mockResolvedValue({
      success: true,
      user: mockUser
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('signup'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    })

    expect(mockAuthApi.signup).toHaveBeenCalledWith('test@example.com', 'password', 'testuser')
  })

  it('should handle failed signup', async () => {
    mockAuthApi.getUser.mockReturnValue(null)
    mockAuthApi.signup.mockResolvedValue({
      success: false,
      message: 'Email already exists'
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('signup'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    })

    expect(mockAuthApi.signup).toHaveBeenCalledWith('test@example.com', 'password', 'testuser')
  })

  it('should handle logout', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' }
    mockAuthApi.getUser.mockReturnValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    })

    fireEvent.click(screen.getByTestId('logout'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    })

    expect(mockAuthApi.logout).toHaveBeenCalled()
  })

  it('should handle login with missing user data', async () => {
    mockAuthApi.getUser.mockReturnValue(null)
    mockAuthApi.login.mockResolvedValue({
      success: true
      // Missing user data
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('login'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    })
  })

  it('should handle signup with missing user data', async () => {
    mockAuthApi.getUser.mockReturnValue(null)
    mockAuthApi.signup.mockResolvedValue({
      success: true
      // Missing user data
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByTestId('signup'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    })
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Mock console.error to suppress error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('should handle loading state properly', () => {
    mockAuthApi.getUser.mockReturnValue(null)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially loading should be false after useEffect
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
  })

  it('should handle user with all optional fields', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      plan: 'premium'
    }
    mockAuthApi.getUser.mockReturnValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    })
  })

  it('should handle user without optional fields', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com'
    }
    mockAuthApi.getUser.mockReturnValue(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    })
  })

  it('should maintain state consistency through multiple operations', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' }
    mockAuthApi.getUser.mockReturnValue(null)
    mockAuthApi.login.mockResolvedValue({ success: true, user: mockUser })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initial state
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')

    // Login
    fireEvent.click(screen.getByTestId('login'))
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    })

    // Logout
    fireEvent.click(screen.getByTestId('logout'))
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    })
  })
})