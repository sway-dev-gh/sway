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
      padding: theme.spacing[5]
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: theme.spacing[6],
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing[2]
          }}>
            <img
              src="/logo.svg"
              alt="Sway"
              style={{
                width: '40px',
                height: '40px'
              }}
            />
          </div>
          <p style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.text.secondary,
            margin: 0,
            lineHeight: '1.5'
          }}>
            Sign in to continue
          </p>
        </div>

        {/* Form Container */}
        <div style={{
          padding: theme.spacing[6],
          borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.border.light}`
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              padding: theme.spacing[3],
              background: 'rgba(255, 59, 48, 0.1)',
              border: `1px solid rgba(255, 59, 48, 0.2)`,
              borderRadius: theme.radius.md,
              color: theme.colors.error,
              fontSize: theme.fontSize.xs,
              marginBottom: theme.spacing[4],
              lineHeight: '1.4'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: theme.spacing[4] }}>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
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
                  height: '36px',
                  padding: `0 ${theme.spacing[3]}`,
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.sm,
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.dark
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.light
                }}
              />
            </div>

            <div style={{ marginBottom: theme.spacing[5] }}>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
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
                  height: '36px',
                  padding: `0 ${theme.spacing[3]}`,
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.sm,
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.dark
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.light
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...theme.buttons.primary.base,
                width: '100%',
                ...(loading && theme.buttons.primary.disabled)
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  Object.assign(e.currentTarget.style, theme.buttons.primary.hover)
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = theme.buttons.primary.base.background
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: theme.spacing[5],
          color: theme.colors.text.secondary,
          fontSize: theme.fontSize.xs,
          lineHeight: '1.5'
        }}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              color: theme.colors.white,
              textDecoration: 'none',
              fontWeight: theme.weight.medium,
              transition: `color ${theme.transition.fast}`
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
