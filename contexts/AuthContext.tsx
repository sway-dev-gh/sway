'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '@/lib/auth'

interface User {
  id: string
  email: string
  username?: string
  plan?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, username?: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in on app start
    // HttpOnly cookies will be automatically validated by backend
    const checkUser = async () => {
      try {
        const savedUser = await authApi.getUser()
        if (savedUser) {
          setUser(savedUser)
        }
      } catch (error) {
        console.log('No saved user found')
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await authApi.login(email, password)
    if (result.success && result.user) {
      setUser(result.user)
      return true
    }
    return false
  }

  const signup = async (email: string, password: string, username?: string): Promise<boolean> => {
    const result = await authApi.signup(email, password, username)
    if (result.success && result.user) {
      setUser(result.user)
      return true
    }
    return false
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    // Refresh user data from localStorage (updated by successful API calls)
    try {
      const savedUser = await authApi.getUser()
      if (savedUser) {
        setUser(savedUser)
      }
    } catch (error) {
      console.log('Error refreshing user:', error)
    }
  }

  // Fixed auth context - removed token for HttpOnly cookies
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}