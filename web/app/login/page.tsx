'use client'

import { useState } from 'react'
import { authApi } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = isLogin
        ? await authApi.login(email, password)
        : await authApi.signup(email, password, username)

      if (result.success) {
        router.push('/')
      } else {
        setError(result.message || 'Authentication failed')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-terminal-bg flex items-center justify-center font-mono">
      <div className="bg-terminal-surface border border-terminal-border p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Sway Logo */}
          <div className="mb-6">
            <img
              src="/sway-logo.svg"
              alt="Sway"
              className="h-12 mx-auto"
            />
          </div>

          <h1 className="text-2xl text-terminal-text font-medium mb-2">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-terminal-muted text-sm">
            {isLogin ? 'Welcome back to your workspace' : 'Join and start collaborating'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 p-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm text-terminal-text mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text placeholder-terminal-muted text-sm focus:outline-none focus:border-terminal-text"
                placeholder="Enter username"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-terminal-text mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text placeholder-terminal-muted text-sm focus:outline-none focus:border-terminal-text"
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-terminal-text mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text placeholder-terminal-muted text-sm focus:outline-none focus:border-terminal-text"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terminal-text text-terminal-bg py-2 px-4 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <p className="text-terminal-muted text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-terminal-text ml-1 hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}