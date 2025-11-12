import React, { useState } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'

const AuthForm = () => {
  const { actions } = useWorkspace()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isLogin) {
        await actions.login(formData.email, formData.password)
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }
        await actions.signup(formData.name, formData.email, formData.password)
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    }

    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    })
    setError('')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff'
    }}>
      <div style={{
        width: '400px',
        border: '1px solid #333333',
        background: '#000000',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            SwayFiles
          </div>
          <div style={{
            fontSize: '12px',
            color: '#666666'
          }}>
            Developer-first workspace
          </div>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          marginBottom: '24px',
          border: '1px solid #333333'
        }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              background: isLogin ? '#111111' : 'transparent',
              border: 'none',
              color: isLogin ? '#ffffff' : '#666666',
              padding: '12px',
              fontSize: '12px',
              cursor: 'pointer',
              borderBottom: isLogin ? '2px solid #ffffff' : '2px solid transparent'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              background: !isLogin ? '#111111' : 'transparent',
              border: 'none',
              color: !isLogin ? '#ffffff' : '#666666',
              padding: '12px',
              fontSize: '12px',
              cursor: 'pointer',
              borderBottom: !isLogin ? '2px solid #ffffff' : '2px solid transparent'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                color: '#999999',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
                style={{
                  width: '100%',
                  background: '#111111',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  padding: '12px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#999999',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                background: '#111111',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '12px',
                fontSize: '14px',
                outline: 'none',
                WebkitTextFillColor: '#ffffff',
                WebkitBoxShadow: '0 0 0 1000px #111111 inset',
                transition: 'background-color 5000s ease-in-out 0s'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#999999',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                background: '#111111',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '12px',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                color: '#999999',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required={!isLogin}
                style={{
                  width: '100%',
                  background: '#111111',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  padding: '12px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Confirm your password"
              />
            </div>
          )}

          {error && (
            <div style={{
              background: '#ff4757',
              color: '#ffffff',
              padding: '8px 12px',
              fontSize: '12px',
              marginBottom: '16px',
              border: '1px solid #ff4757'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading ? '#333333' : '#ffffff',
              color: isLoading ? '#666666' : '#000000',
              border: 'none',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '11px',
          color: '#666666'
        }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '11px',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '10px',
          color: '#333333'
        }}>
          v2.0 • Secure workspace collaboration
        </div>
      </div>
    </div>
  )
}

export default AuthForm