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
        marginLeft: '60px',
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '60px 40px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '60px' }}>
            <h1 style={{
              fontSize: '72px',
              fontWeight: '300',
              margin: '0',
              letterSpacing: '-0.02em',
              lineHeight: '1'
            }}>
              Settings
            </h1>
          </div>

          {/* Settings Sections */}
          <div style={{
            display: 'grid',
            gap: '1px',
            background: theme.colors.border.light
          }}>

            {/* Account Information */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[4],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Account
              </div>

              <div style={{ marginBottom: theme.spacing[6] }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[2]
                }}>
                  Email Address
                </div>
                <div style={{
                  fontSize: '16px',
                  color: theme.colors.text.primary,
                  fontWeight: '400'
                }}>
                  {user.email}
                </div>
              </div>

              <div style={{ marginBottom: theme.spacing[6] }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[2]
                }}>
                  Account Status
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  fontSize: '12px',
                  color: theme.colors.text.primary
                }}>
                  Active
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[4],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Notifications
              </div>

              <div style={{ marginBottom: theme.spacing[4] }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: theme.spacing[3],
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  marginBottom: theme.spacing[2]
                }}>
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{
                      marginRight: theme.spacing[3],
                      width: '16px',
                      height: '16px',
                      accentColor: theme.colors.white,
                      filter: 'grayscale(1)'
                    }}
                  />
                  <div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Email notifications
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.muted
                    }}>
                      Receive email when files are uploaded
                    </div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: theme.spacing[3],
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.medium}`
                }}>
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{
                      marginRight: theme.spacing[3],
                      width: '16px',
                      height: '16px',
                      accentColor: theme.colors.white,
                      filter: 'grayscale(1)'
                    }}
                  />
                  <div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Request notifications
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.muted
                    }}>
                      Get notified about request activity
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Preferences */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[4],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Preferences
              </div>

              <div style={{ marginBottom: theme.spacing[4] }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[3]
                }}>
                  Default Request Type
                </div>
                <select style={{
                  width: '100%',
                  padding: '12px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  color: theme.colors.text.primary,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer'
                }}>
                  <option>Document Request</option>
                  <option>Form Submission</option>
                  <option>Media Collection</option>
                  <option>Portfolio Review</option>
                  <option>General Upload</option>
                </select>
              </div>

              <div style={{ marginBottom: theme.spacing[4] }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[3]
                }}>
                  File Size Limit
                </div>
                <select style={{
                  width: '100%',
                  padding: '12px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  color: theme.colors.text.primary,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer'
                }}>
                  <option>10 MB</option>
                  <option>50 MB</option>
                  <option>100 MB</option>
                  <option>500 MB</option>
                  <option>1 GB</option>
                </select>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[4],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Danger Zone
              </div>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    // Handle account deletion
                    alert('Account deletion would be processed here')
                  }
                }}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  fontSize: '14px',
                  fontWeight: '400',
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
