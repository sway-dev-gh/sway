import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Billing() {
  const navigate = useNavigate()
  const [usage, setUsage] = useState({
    currentPeriod: { requests: 0, uploads: 0, storage: 0 },
    limit: { requests: 'Unlimited', uploads: 'Unlimited', storage: 1 }, // GB
    plan: 'free'
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

      const { data } = await api.get('/api/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Get user plan for storage limit
      const userStr = localStorage.getItem('user')
      let storageLimit = 1 // Default to 1 GB for free
      let plan = 'free'

      if (userStr) {
        const user = JSON.parse(userStr)
        plan = user.plan || 'free'
        // Set storage limits based on plan
        if (plan === 'pro') storageLimit = 50
        else if (plan === 'business') storageLimit = 200
        else storageLimit = 1
      }

      setUsage({
        currentPeriod: {
          requests: data.totalRequests,
          uploads: data.totalUploads,
          storage: (data.storageMB / 1024).toFixed(2) // Convert MB to GB
        },
        limit: {
          requests: 'Unlimited',
          uploads: 'Unlimited',
          storage: storageLimit
        },
        plan
      })
    } catch (error) {
      console.error('Error fetching usage:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (current, limit) => {
    return Math.min((current / limit) * 100, 100)
  }

  const getStorageWarning = () => {
    const percentage = calculatePercentage(usage.currentPeriod.storage, usage.limit.storage)
    if (percentage >= 90) {
      return { show: true, message: 'You are running out of storage space', severity: 'critical' }
    } else if (percentage >= 75) {
      return { show: true, message: 'You are approaching your storage limit', severity: 'warning' }
    }
    return { show: false }
  }

  const storageWarning = getStorageWarning()

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

          {/* Storage Warning Banner */}
          {storageWarning.show && (
            <div style={{
              padding: '16px 24px',
              background: storageWarning.severity === 'critical' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${storageWarning.severity === 'critical' ? theme.colors.border.medium : theme.colors.border.light}`,
              marginBottom: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.colors.text.primary,
                  marginBottom: '4px'
                }}>
                  {storageWarning.message}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.muted
                }}>
                  You're using {usage.currentPeriod.storage} GB of {usage.limit.storage} GB ({calculatePercentage(usage.currentPeriod.storage, usage.limit.storage).toFixed(1)}%)
                </div>
              </div>
              <button
                onClick={() => navigate('/plan')}
                style={{
                  padding: '10px 20px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Upgrade Plan
              </button>
            </div>
          )}

          {/* Usage Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: theme.colors.border.light,
            marginBottom: '60px'
          }}>
            {/* Requests */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Requests
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: '-0.03em',
                lineHeight: '1',
                marginBottom: '16px'
              }}>
                {usage.currentPeriod.requests}
              </div>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.muted
              }}>
                of {usage.limit.requests}
              </div>
            </div>

            {/* Uploads */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Uploads
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: '-0.03em',
                lineHeight: '1',
                marginBottom: '16px'
              }}>
                {usage.currentPeriod.uploads}
              </div>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.muted
              }}>
                of {usage.limit.uploads}
              </div>
            </div>

            {/* Storage */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Storage
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: '-0.03em',
                lineHeight: '1',
                marginBottom: '16px'
              }}>
                {usage.currentPeriod.storage} GB
              </div>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.muted,
                marginBottom: '12px'
              }}>
                of {usage.limit.storage} GB
              </div>
              {/* Storage Progress Bar */}
              <div style={{
                width: '100%',
                height: '4px',
                background: theme.colors.border.light,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(calculatePercentage(usage.currentPeriod.storage, usage.limit.storage), 100)}%`,
                  height: '100%',
                  background: calculatePercentage(usage.currentPeriod.storage, usage.limit.storage) >= 90
                    ? theme.colors.text.primary
                    : calculatePercentage(usage.currentPeriod.storage, usage.limit.storage) >= 75
                      ? theme.colors.text.secondary
                      : theme.colors.text.tertiary,
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
