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
          <div style={{ marginBottom: theme.spacing[6] }}>
            <h1 style={{
              fontSize: theme.fontSize.xl,
              fontWeight: '500',
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Settings
            </h1>
          </div>

          {/* Settings Sections */}
          <div style={{
            maxWidth: '900px'
          }}>

            {/* Account Information */}
            <div style={{
              background: theme.colors.bg.secondary,
              padding: '20px',
              borderRadius: '10px',
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.md
            }}>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[6],
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: theme.weight.medium
              }}>
                Account Information
              </div>

              <div style={{ marginBottom: theme.spacing[10] }}>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[3],
                  fontWeight: theme.weight.semibold
                }}>
                  Email Address
                </div>
                <div style={{
                  fontSize: theme.fontSize.sm,
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
                  padding: '8px 16px',
                  background: 'transparent',
                  color: theme.colors.error,
                  border: `2px solid ${theme.colors.error}`,
                  borderRadius: '8px',
                  fontSize: theme.fontSize.xs,
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: `0 0 0 0 ${theme.colors.error}`
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
