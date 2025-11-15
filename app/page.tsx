'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect authenticated users to dashboard
        router.replace('/dashboard')
      } else {
        // Redirect unauthenticated users to login
        router.replace('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while determining redirect
  return (
    <div className="min-h-screen bg-terminal-bg flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-terminal-text"></div>
        <p className="text-terminal-muted mt-4">Loading SwayFiles...</p>
      </div>
    </div>
  )
}