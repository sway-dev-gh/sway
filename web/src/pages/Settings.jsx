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
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '48px 32px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px', maxWidth: '900px', margin: '0 auto 48px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
              Settings
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Manage your account preferences
            </p>
          </div>

          {/* Settings Sections */}
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gap: theme.spacing[5]
          }}>

            {/* Profile Section */}
            <div style={{
              padding: '32px',
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.colors.border.light}`,
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{
                marginBottom: theme.spacing[6]
              }}>
                <div style={{
                  fontSize: '20px',
                  color: theme.colors.text.primary,
                  fontWeight: '600',
                  marginBottom: '4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                  Profile
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.tertiary
                }}>
                  Your account information
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{
                  fontSize: '11px',
                  color: theme.colors.text.tertiary,
                  marginBottom: theme.spacing[2],
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Email Address
                </div>
                <div style={{
                  fontSize: '16px',
                  color: theme.colors.text.primary,
                  fontWeight: '500',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                  {user.email}
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div style={{
              padding: '32px',
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.colors.border.light}`,
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{
                marginBottom: theme.spacing[6]
              }}>
                <div style={{
                  fontSize: '20px',
                  color: theme.colors.text.primary,
                  fontWeight: '600',
                  marginBottom: '4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                  Security
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.tertiary
                }}>
                  Manage your account security
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border.light}`,
                marginBottom: theme.spacing[4]
              }}>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.primary,
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Password
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.tertiary,
                  marginBottom: theme.spacing[4]
                }}>
                  Last changed: Never
                </div>
                <button
                  style={theme.buttons.secondary.base}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, theme.buttons.secondary.hover)
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, theme.buttons.secondary.base)
                  }}
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{
              padding: '32px',
              borderRadius: theme.radius.lg,
              border: `1px solid rgba(239, 68, 68, 0.3)`,
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{
                marginBottom: theme.spacing[6]
              }}>
                <div style={{
                  fontSize: '20px',
                  color: theme.colors.text.primary,
                  fontWeight: '600',
                  marginBottom: '4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                  Danger Zone
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.tertiary
                }}>
                  Irreversible and destructive actions
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border.light}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: theme.spacing[4]
              }}>
                <div>
                  <div style={{
                    fontSize: '15px',
                    color: theme.colors.text.primary,
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    Delete Account
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: theme.colors.text.tertiary
                  }}>
                    Permanently delete your account and all data
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                      alert('Account deletion would be processed here')
                    }
                  }}
                  style={{
                    ...theme.buttons.danger.base,
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, theme.buttons.danger.hover)
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, theme.buttons.danger.base)
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
