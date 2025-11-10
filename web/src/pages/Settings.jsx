import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ email: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }

    setLoading(false)
  }, [navigate])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg.page
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: `2px solid ${theme.colors.border.medium}`,
          borderTopColor: theme.colors.white,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        marginTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: theme.spacing[6]
        }}>

          {/* Header */}
          <div style={{ marginBottom: theme.spacing[6], textAlign: 'center' }}>
            <h1 style={{
              fontSize: theme.fontSize.xl,
              fontWeight: '500',
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Settings
            </h1>
            <p style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              margin: '6px 0 0 0',
              lineHeight: '1.6'
            }}>
              Manage your account preferences
            </p>
          </div>

          {/* Settings Sections */}
          <div style={{
            maxWidth: '900px',
            margin: '0 auto'
          }}>

            {/* Account Information */}
            <div style={{
              padding: theme.spacing[5],
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[6],
                fontWeight: theme.weight.medium
              }}>
                Account
              </div>

              <div style={{ marginBottom: theme.spacing[8] }}>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  Email
                </div>
                <div style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text.primary,
                  fontWeight: theme.weight.medium
                }}>
                  {user.email}
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    alert('Account deletion would be processed here')
                  }
                }}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  color: theme.colors.error,
                  border: `1px solid ${theme.colors.error}`,
                  borderRadius: theme.radius.md,
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Delete Account
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
