import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import theme from '../theme'

export default function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/api/auth/signup', formData)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/requests')
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed')
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
        maxWidth: '440px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px'
          }}>
            <img
              src="/logo.svg"
              alt="Sway"
              style={{
                width: '50px',
                height: '50px'
              }}
            />
          </div>
          <p style={{
            fontSize: '20px',
            color: theme.colors.text.secondary,
            margin: 0,
            lineHeight: '1.5'
          }}>
            Create your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px',
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: '12px',
            color: theme.colors.text.primary,
            fontSize: '20px',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '22px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: theme.weight.medium
            }}>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                height: '56px',
                padding: '16px',
                background: theme.colors.bg.page,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: '12px',
                color: theme.colors.text.primary,
                fontSize: '16px',
                fontFamily: 'inherit',
                outline: 'none',
                              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.dark
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(64, 64, 64, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.medium
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '19px',
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
                height: '52px',
                padding: '16px',
                background: theme.colors.bg.page,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: '12px',
                color: theme.colors.text.primary,
                fontSize: '22px',
                fontFamily: 'inherit',
                outline: 'none',
                              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.dark
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(64, 64, 64, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.medium
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '19px',
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
              minLength={12}
              placeholder="Min 12 chars: upper, lower, number, special"
              style={{
                width: '100%',
                height: '52px',
                padding: '16px',
                background: theme.colors.bg.page,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: '12px',
                color: theme.colors.text.primary,
                fontSize: '22px',
                fontFamily: 'inherit',
                outline: 'none',
                              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.dark
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(64, 64, 64, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.medium
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '52px',
              padding: '0 24px',
              background: theme.colors.white,
              color: theme.colors.black,
              border: 'none',
              borderRadius: '12px',
              fontSize: '22px',
              fontWeight: theme.weight.medium,
              cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '32px',
          color: theme.colors.text.secondary,
          fontSize: '20px',
          lineHeight: '1.6'
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: theme.colors.white,
              textDecoration: 'none',
              fontWeight: theme.weight.medium,
              transition: `color ${theme.transition.fast}`
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
