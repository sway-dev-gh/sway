'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'

// FORCE VERCEL REBUILD - Fix Cache Issue v4 - Thu Nov 14 06:16
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login, signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = isLogin
        ? await login(email, password)
        : await signup(email, password, username)

      if (success) {
        // Authentication state is now updated in context
        router.push('/dashboard')
      } else {
        setError('Authentication failed')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-terminal-bg font-mono flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-terminal-surface border-r border-terminal-border items-center justify-center p-12">
        <div className="text-center space-y-8">
          <div className="relative">
            <Image
              src="/logo.png"
              alt="Sway Logo"
              width={200}
              height={200}
              className="mx-auto filter brightness-0 invert opacity-90"
              priority
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-medium text-terminal-text">
              Welcome to Swayfiles
            </h1>
            <p className="text-terminal-muted leading-relaxed max-w-md text-sm">
              The world's first truly versionless collaborative workspace. Create, collaborate, and innovate in real-time.
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-terminal-muted border-t border-terminal-border pt-6">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-terminal-text rounded-full"></div>
                <span>Real-time collaboration</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-terminal-text rounded-full"></div>
                <span>Live presence</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/logo.png"
              alt="Sway Logo"
              width={60}
              height={60}
              className="mx-auto filter brightness-0 invert opacity-90"
              priority
            />
          </div>

          <div className="bg-terminal-surface border border-terminal-border p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-medium text-terminal-text mb-2">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-terminal-muted text-sm">
                {isLogin ? 'Welcome back to your workspace' : 'Join and start collaborating'}
              </p>
            </div>


            {/* Error Message */}
            {error && (
              <div className="bg-terminal-surface border border-terminal-border p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-terminal-text rounded-full flex-shrink-0"></div>
                  <p className="text-terminal-text text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm text-terminal-text mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-terminal-bg border border-terminal-border px-3 py-3 text-terminal-text placeholder-terminal-muted text-sm focus:outline-none focus:border-terminal-text transition-colors"
                    placeholder="Choose a username"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-terminal-text mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-3 text-terminal-text placeholder-terminal-muted text-sm focus:outline-none focus:border-terminal-text transition-colors"
                  placeholder="Enter your email"
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
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-3 text-terminal-text placeholder-terminal-muted text-sm focus:outline-none focus:border-terminal-text transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-terminal-text text-terminal-bg py-3 px-4 font-medium hover:bg-terminal-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 border border-terminal-bg border-t-transparent rounded-full animate-spin"></div>
                    <span>Please wait...</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-8 text-center">
              <p className="text-terminal-muted text-sm">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                  }}
                  className="text-terminal-text ml-2 hover:underline transition-all"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-terminal-muted text-xs">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}