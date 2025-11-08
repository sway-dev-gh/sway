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
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '60px 40px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: 0,
              color: theme.colors.text.primary
            }}>
              Settings
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
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
              background: theme.colors.bg.page,
              padding: '0 0 40px 0'
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

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
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
                  fontFamily: 'inherit',
                  transition: `all ${theme.transition.fast}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.white
                  e.currentTarget.style.color = theme.colors.white
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                  e.currentTarget.style.color = theme.colors.text.secondary
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
