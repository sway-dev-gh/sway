import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function Billing() {
  const navigate = useNavigate()
  const [usage, setUsage] = useState({
    currentPeriod: { requests: 0, uploads: 0, storage: 0 },
    limit: { requests: 100, uploads: 1000, storage: 10 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      // TODO: Fetch usage and billing data from backend
      // For now, show placeholder data
      setUsage({
        currentPeriod: { requests: 0, uploads: 0, storage: 0 },
        limit: { requests: 100, uploads: 1000, storage: 10 }
      })
    } catch (error) {
      console.error('Error fetching usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (current, limit) => {
    return Math.min((current / limit) * 100, 100)
  }

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
              Billing & Usage
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Track your usage and manage billing
            </p>
          </div>

          {/* Usage Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {/* Requests */}
            <div style={{
              padding: '24px',
              border: `1px solid ${theme.colors.border.medium}`,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.muted,
                marginBottom: '8px'
              }}>
                Requests
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                marginBottom: '16px'
              }}>
                {usage.currentPeriod.requests} / {usage.limit.requests}
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: theme.colors.border.medium,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${calculatePercentage(usage.currentPeriod.requests, usage.limit.requests)}%`,
                  height: '100%',
                  background: theme.colors.white,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Uploads */}
            <div style={{
              padding: '24px',
              border: `1px solid ${theme.colors.border.medium}`,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.muted,
                marginBottom: '8px'
              }}>
                Uploads
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                marginBottom: '16px'
              }}>
                {usage.currentPeriod.uploads} / {usage.limit.uploads}
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: theme.colors.border.medium,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${calculatePercentage(usage.currentPeriod.uploads, usage.limit.uploads)}%`,
                  height: '100%',
                  background: theme.colors.white,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Storage */}
            <div style={{
              padding: '24px',
              border: `1px solid ${theme.colors.border.medium}`,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.muted,
                marginBottom: '8px'
              }}>
                Storage
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                marginBottom: '16px'
              }}>
                {usage.currentPeriod.storage} GB / {usage.limit.storage} GB
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: theme.colors.border.medium,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${calculatePercentage(usage.currentPeriod.storage, usage.limit.storage)}%`,
                  height: '100%',
                  background: theme.colors.white,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div style={{
            border: `1px solid ${theme.colors.border.medium}`,
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '400',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary
            }}>
              Current Billing Period
            </h2>
            <div style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              marginBottom: '24px'
            }}>
              Your current billing period ends on {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()}
            </div>
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button style={{
                padding: '12px 24px',
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Upgrade Plan
              </button>
              <button style={{
                padding: '12px 24px',
                background: 'transparent',
                color: theme.colors.text.secondary,
                border: `1px solid ${theme.colors.border.medium}`,
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                View Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Billing
