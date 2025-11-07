import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import theme from '../theme'

export default function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/api/auth/login', formData)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/requests')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.colors.bg.page,
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '48px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '300',
            margin: '0 0 8px 0',
            color: theme.colors.text.primary,
            letterSpacing: '-0.02em'
          }}>
            Sway
          </h1>
          <p style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            margin: 0
          }}>
            Sign in to continue
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255, 59, 48, 0.1)',
            border: `1px solid rgba(255, 59, 48, 0.2)`,
            borderRadius: theme.radius.md,
            color: '#FF3B30',
            fontSize: '13px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: theme.weight.medium
            }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text.primary,
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: `all ${theme.transition.fast}`
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.text.secondary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.medium
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: theme.weight.medium
            }}>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text.primary,
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: `all ${theme.transition.fast}`
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.text.secondary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.medium
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: theme.colors.white,
              color: theme.colors.black,
              border: 'none',
              borderRadius: theme.radius.md,
              fontSize: '14px',
              fontWeight: theme.weight.medium,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: `all ${theme.transition.fast}`,
              fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = theme.colors.text.secondary
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = theme.colors.white
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '32px',
          color: theme.colors.text.secondary,
          fontSize: '13px'
        }}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              color: theme.colors.text.primary,
              textDecoration: 'none',
              fontWeight: theme.weight.medium,
              transition: `opacity ${theme.transition.fast}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
