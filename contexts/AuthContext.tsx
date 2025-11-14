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
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, username?: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in on app start
    const savedToken = authApi.getToken()
    const savedUser = authApi.getUser()

    if (savedToken && savedUser) {
      setUser(savedUser)
      setToken(savedToken)
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await authApi.login(email, password)
    if (result.success && result.user && result.token) {
      setUser(result.user)
      setToken(result.token)
      return true
    }
    return false
  }

  const signup = async (email: string, password: string, username?: string): Promise<boolean> => {
    const result = await authApi.signup(email, password, username)
    if (result.success && result.user && result.token) {
      setUser(result.user)
      setToken(result.token)
      return true
    }
    return false
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
    setToken(null)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    token,
    login,
    signup,
    logout
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