'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ForceRefresh() {
  const { logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Clear all localStorage
    localStorage.clear()

    // Clear session storage
    sessionStorage.clear()

    // Force logout to clear auth state
    logout()

    // Redirect to login after 1 second
    setTimeout(() => {
      router.push('/login')
    }, 1000)
  }, [logout, router])

  return (
    <div className="min-h-screen bg-terminal-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-terminal-text text-xl mb-4">🚨 Emergency Fix: Refreshing User Data</h1>
        <p className="text-terminal-muted">Clearing cache and forcing fresh login...</p>
        <p className="text-terminal-muted mt-2">You will be redirected to login in a moment.</p>
      </div>
    </div>
  )
}