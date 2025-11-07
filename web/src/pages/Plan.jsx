import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function Plan() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ email: '' })
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      setCurrentPlan(userData.plan || 'free')
    }
    setLoading(false)
  }, [navigate])

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === currentPlan) {
      return
    }

    setUpgrading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      storage: '1 GB',
      features: [
        '1 GB total storage',
        'Unlimited requests',
        'All file types',
        'Email support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9',
      period: '/month',
      storage: '50 GB',
      features: [
        '50 GB total storage',
        'Unlimited requests',
        'All file types',
        'Email support'
      ]
    },
    {
      id: 'business',
      name: 'Business',
      price: '$29',
      period: '/month',
      storage: '200 GB',
      features: [
        '200 GB total storage',
        'Unlimited requests',
        'All file types',
        'Email support'
      ]
    }
  ]

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
              margin: '0 0 16px 0',
              letterSpacing: '-0.02em',
              lineHeight: '1'
            }}>
              Plan
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              margin: 0
            }}>
              Choose the plan that works for you
            </p>
          </div>

          {/* Current Plan Badge */}
          <div style={{
            marginBottom: '60px',
            padding: '24px',
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.medium}`
          }}>
            <div style={{
              fontSize: '11px',
              color: theme.colors.text.muted,
              marginBottom: theme.spacing[2],
              textTransform: 'uppercase',
              letterSpacing: '1.5px'
            }}>
              Current Plan
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '300',
              color: theme.colors.text.primary,
              letterSpacing: '-0.01em'
            }}>
              {plans.find(p => p.id === currentPlan)?.name}
            </div>
          </div>

          {/* Plans Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: theme.colors.border.light
          }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: theme.colors.bg.page,
                  padding: '40px',
                  position: 'relative'
                }}
              >
                {/* Plan Name */}
                <div style={{
                  fontSize: '9px',
                  color: theme.colors.text.tertiary,
                  marginBottom: theme.spacing[4],
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  fontWeight: theme.weight.semibold
                }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom: theme.spacing[6] }}>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: '-0.03em',
                    lineHeight: '1'
                  }}>
                    {plan.price}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.text.muted,
                    marginTop: theme.spacing[2],
                    height: '20px'
                  }}>
                    {plan.period || '\u00A0'}
                  </div>
                </div>

                {/* Storage */}
                <div style={{
                  marginBottom: theme.spacing[6],
                  paddingBottom: theme.spacing[6],
                  borderBottom: `1px solid ${theme.colors.border.light}`
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing[1]
                  }}>
                    {plan.storage} total storage
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: theme.colors.text.muted
                  }}>
                    Keep files indefinitely
                  </div>
                </div>

                {/* Features */}
                <div style={{ marginBottom: theme.spacing[6] }}>
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '13px',
                        color: theme.colors.text.secondary,
                        marginBottom: theme.spacing[2],
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: theme.spacing[2]
                      }}
                    >
                      <span style={{ color: theme.colors.text.muted }}>—</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.id === currentPlan || upgrading}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: plan.id === currentPlan ? 'transparent' : theme.colors.white,
                    color: plan.id === currentPlan ? theme.colors.text.secondary : theme.colors.black,
                    border: `1px solid ${plan.id === currentPlan ? theme.colors.border.medium : theme.colors.white}`,
                    fontSize: '14px',
                    fontWeight: '400',
                    cursor: plan.id === currentPlan || upgrading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    opacity: upgrading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (plan.id !== currentPlan && !upgrading) {
                      e.currentTarget.style.background = theme.colors.text.secondary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.id !== currentPlan && !upgrading) {
                      e.currentTarget.style.background = theme.colors.white
                    }
                  }}
                >
                  {upgrading ? 'Processing...' : (plan.id === currentPlan ? 'Current Plan' : 'Upgrade')}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div style={{ marginTop: '80px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '300',
              margin: '0 0 40px 0',
              letterSpacing: '-0.01em'
            }}>
              Frequently Asked Questions
            </h2>

            <div style={{
              display: 'grid',
              gap: '1px',
              background: theme.colors.border.light
            }}>
              <div style={{
                background: theme.colors.bg.page,
                padding: '24px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  Can I change my plan at any time?
                </div>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </div>
              </div>

              <div style={{
                background: theme.colors.bg.page,
                padding: '24px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  What happens if I exceed my storage limit?
                </div>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  You'll receive a notification when you reach 80% of your storage limit. You can upgrade your plan or delete old files to free up space.
                </div>
              </div>

              <div style={{
                background: theme.colors.bg.page,
                padding: '24px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  Do you offer refunds?
                </div>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Plan
