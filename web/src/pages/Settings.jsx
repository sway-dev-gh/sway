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

          {/* Header - BIG */}
          <div style={{ marginBottom: theme.spacing[12] }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: theme.weight.bold,
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.03em'
            }}>
              Settings
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: '16px 0 0 0',
              lineHeight: '1.6'
            }}>
              Manage your account preferences and settings
            </p>
          </div>

          {/* Settings Sections */}
          <div style={{
            maxWidth: '900px'
          }}>

            {/* Account Information */}
            <div style={{
              background: theme.colors.bg.secondary,
              padding: '48px',
              borderRadius: '24px',
              border: `2px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.lg,
              marginBottom: theme.spacing[10]
            }}>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[8],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.bold
              }}>
                Account Information
              </div>

              <div style={{ marginBottom: theme.spacing[10] }}>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[3],
                  fontWeight: theme.weight.semibold
                }}>
                  Email Address
                </div>
                <div style={{
                  fontSize: '20px',
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
                  padding: '16px 32px',
                  background: 'transparent',
                  color: theme.colors.error,
                  border: `2px solid ${theme.colors.error}`,
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: theme.weight.bold,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: `0 0 0 0 ${theme.colors.error}`,
                  height: '56px'
                }}
              >
                Delete Account
              </button>
            </div>

            {/* Notifications */}
            <div style={{
              background: theme.colors.bg.secondary,
              padding: '48px',
              borderRadius: '24px',
              border: `2px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.lg,
              marginBottom: theme.spacing[10]
            }}>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[8],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.bold
              }}>
                Notifications
              </div>

              <div style={{ marginBottom: theme.spacing[8] }}>
                <div style={{
                  fontSize: '17px',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.semibold
                }}>
                  Email Notifications
                </div>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[4]
                }}>
                  Receive email alerts when someone uploads files to your requests
                </div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" defaultChecked style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '15px', color: theme.colors.text.primary }}>Enable email notifications</span>
                </label>
              </div>
            </div>

            {/* Storage */}
            <div style={{
              background: theme.colors.bg.secondary,
              padding: '48px',
              borderRadius: '24px',
              border: `2px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.lg
            }}>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[8],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.bold
              }}>
                Storage Usage
              </div>

              <div style={{ marginBottom: theme.spacing[6] }}>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[3],
                  fontWeight: theme.weight.semibold
                }}>
                  Current Plan
                </div>
                <div style={{
                  fontSize: '24px',
                  color: theme.colors.text.primary,
                  fontWeight: theme.weight.bold,
                  marginBottom: theme.spacing[2]
                }}>
                  Free Plan
                </div>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary
                }}>
                  2GB of 2GB used
                </div>
              </div>

              <div style={{
                height: '12px',
                background: theme.colors.bg.page,
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: theme.spacing[6]
              }}>
                <div style={{
                  height: '100%',
                  width: '100%',
                  background: theme.colors.white,
                  borderRadius: '12px'
                }} />
              </div>

              <button
                onClick={() => window.location.href = '/plan'}
                style={{
                  padding: '16px 32px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: theme.weight.bold,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  height: '56px',
                  boxShadow: theme.shadows.lg
                }}
              >
                Upgrade Plan
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
