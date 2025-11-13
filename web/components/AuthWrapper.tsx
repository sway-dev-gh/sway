'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Pages that don't require authentication
const PUBLIC_PATHS = ['/login', '/signup']

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    // Only redirect if not loading and not on public path and not authenticated
    if (!isLoading && !isAuthenticated && !isPublicPath) {
      window.location.href = '/login'
    }
  }, [isLoading, isAuthenticated, isPublicPath])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-terminal-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-terminal-border border-t-terminal-text rounded-full animate-spin mb-4"></div>
          <p className="text-terminal-text text-sm font-mono">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated and not on public path
  if (!isAuthenticated && !isPublicPath) {
    return null // Will redirect via useEffect
  }

  // If authenticated but on login page, redirect to dashboard
  if (isAuthenticated && isPublicPath) {
    window.location.href = '/'
    return null
  }

  return <>{children}</>
}