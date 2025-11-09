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
        marginTop: '72px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: theme.spacing[12]
        }}>

          {/* Header */}
          <div style={{ marginBottom: theme.spacing[12] }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '500',
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Settings
            </h1>
            <p style={{
              fontSize: '15px',
              color: theme.colors.text.secondary,
              margin: '12px 0 0 0',
              lineHeight: '1.6'
            }}>
              Manage your account preferences and settings
            </p>
          </div>

          {/* Settings Sections */}
          <div style={{
            maxWidth: '800px'
          }}>

            {/* Account Information */}
            <div style={{
              background: theme.colors.bg.secondary,
              padding: theme.spacing[12],
              borderRadius: theme.radius['2xl'],
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.md,
              marginBottom: theme.spacing[10]
            }}>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[8],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Account Information
              </div>

              <div style={{ marginBottom: theme.spacing[10] }}>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[3],
                  fontWeight: theme.weight.medium
                }}>
                  Email Address
                </div>
                <div style={{
                  fontSize: '18px',
                  color: theme.colors.text.primary,
                  fontWeight: theme.weight.normal
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
                  padding: '14px 28px',
                  background: 'transparent',
                  color: theme.colors.error,
                  border: `2px solid ${theme.colors.error}`,
                  borderRadius: theme.radius.lg,
                  fontSize: '14px',
                  fontWeight: theme.weight.semibold,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: `0 0 0 0 ${theme.colors.error}`,
                                    height: '48px'
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
