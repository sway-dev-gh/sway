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
            <div style={theme.alerts.error}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: theme.layout.formFieldGap }}>
              <label style={theme.inputs.label}>
                Email address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="you@example.com"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
                }}
              />
            </div>

            <div style={{ marginBottom: theme.layout.formFieldGap }}>
              <label style={theme.inputs.label}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Enter your password"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
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
              fontWeight: theme.weight.medium
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
