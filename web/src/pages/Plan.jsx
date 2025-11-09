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
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.swayfiles.com'
      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
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
      period: '',
      tagline: 'Get started',
      description: 'Perfect for trying out Sway.',
      features: [
        { text: '20 active requests', highlight: false },
        { text: '2GB storage', highlight: false },
        { text: 'Limited request types', highlight: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$15',
      period: '/month',
      tagline: 'Most popular',
      description: 'Unlimited power for serious users.',
      popular: true,
      features: [
        { text: '200 active requests', highlight: true },
        { text: '50GB storage', highlight: true },
        { text: 'Unlimited request types', highlight: true }
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
        marginTop: '72px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: theme.spacing[12]
        }}>

          {/* Header */}
          <div style={{ marginBottom: theme.spacing[16], textAlign: 'center' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '500',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.03em'
            }}>
              Simple, Predictable Pricing
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: 0,
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: '1.7'
            }}>
              Start free. Upgrade when you need more. Cancel anytime.
            </p>
          </div>

          {/* Plans Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing[8],
            marginBottom: theme.spacing[20],
            maxWidth: '1000px',
            margin: '0 auto 120px auto'
          }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: theme.colors.bg.secondary,
                  padding: theme.spacing[12],
                  borderRadius: theme.radius['2xl'],
                  border: plan.popular ? `2px solid ${theme.colors.white}` : `1px solid ${theme.colors.border.light}`,
                  position: 'relative',
                  boxShadow: plan.popular ? theme.shadows.glowStrong : theme.shadows.md,
                  transition: `all ${theme.transition.normal}`,
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!plan.popular) {
                    e.currentTarget.style.background = theme.colors.bg.hover
                    e.currentTarget.style.borderColor = theme.colors.border.medium
                    e.currentTarget.style.boxShadow = theme.shadows.glowStrong
                    e.currentTarget.style.transform = 'scale(1.02)'
                  } else {
                    e.currentTarget.style.transform = 'scale(1.07)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!plan.popular) {
                    e.currentTarget.style.background = theme.colors.bg.secondary
                    e.currentTarget.style.borderColor = theme.colors.border.light
                    e.currentTarget.style.boxShadow = theme.shadows.md
                    e.currentTarget.style.transform = 'scale(1)'
                  } else {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    padding: '8px 24px',
                    borderRadius: theme.radius.full,
                    fontSize: '12px',
                    fontWeight: theme.weight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Most Popular
                  </div>
                )}

                {/* Current Plan Badge */}
                {plan.id === currentPlan && (
                  <div style={{
                    position: 'absolute',
                    top: theme.spacing[6],
                    right: theme.spacing[6],
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: theme.colors.text.secondary,
                    padding: '6px 14px',
                    borderRadius: theme.radius.md,
                    fontSize: '11px',
                    fontWeight: theme.weight.semibold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px'
                  }}>
                    Current
                  </div>
                )}

                {/* Plan Name */}
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.tertiary,
                  marginBottom: theme.spacing[2],
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  fontWeight: theme.weight.semibold
                }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom: theme.spacing[6] }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[1] }}>
                    <div style={{
                      fontSize: plan.popular ? '80px' : '64px',
                      fontWeight: theme.weight.bold,
                      color: theme.colors.text.primary,
                      letterSpacing: '-0.05em',
                      lineHeight: '1'
                    }}>
                      {plan.price}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      color: theme.colors.text.muted,
                      marginBottom: theme.spacing[2]
                    }}>
                      {plan.period}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[10],
                  lineHeight: '1.6',
                  minHeight: '48px'
                }}>
                  {plan.description}
                </div>

                {/* Features */}
                <div style={{ marginBottom: theme.spacing[10], minHeight: '180px' }}>
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '15px',
                        color: feature.highlight ? theme.colors.text.primary : theme.colors.text.secondary,
                        marginBottom: theme.spacing[4],
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: theme.spacing[3],
                        fontWeight: feature.highlight ? theme.weight.medium : theme.weight.normal
                      }}
                    >
                      <span style={{
                        color: theme.colors.text.primary,
                        fontSize: '18px',
                        lineHeight: '1'
                      }}>✓</span>
                      <span style={{ flex: 1 }}>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.id === currentPlan || upgrading}
                  style={{
                    width: '100%',
                    padding: '16px 32px',
                    background: plan.id === currentPlan ? 'transparent' : (plan.popular ? theme.colors.white : 'transparent'),
                    color: plan.id === currentPlan ? theme.colors.text.secondary : (plan.popular ? theme.colors.black : theme.colors.white),
                    border: `1px solid ${plan.id === currentPlan ? theme.colors.border.medium : (plan.popular ? theme.colors.white : theme.colors.border.medium)}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: plan.id === currentPlan || upgrading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: `all ${theme.transition.normal}`,
                    opacity: upgrading ? 0.6 : 1,
                    height: '56px'
                  }}
                  onMouseEnter={(e) => {
                    if (plan.id !== currentPlan && !upgrading) {
                      if (plan.popular) {
                        e.currentTarget.style.background = theme.colors.text.secondary
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      } else {
                        e.currentTarget.style.background = theme.colors.bg.hover
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.id !== currentPlan && !upgrading) {
                      if (plan.popular) {
                        e.currentTarget.style.background = theme.colors.white
                        e.currentTarget.style.transform = 'translateY(0)'
                      } else {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }
                  }}
                >
                  {upgrading ? 'Processing...' : (plan.id === currentPlan ? 'Current Plan' : (plan.id === 'free' ? 'Get Started Free' : 'Upgrade to ' + plan.name))}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: theme.weight.normal,
              margin: '0 0 48px 0',
              letterSpacing: '-0.02em',
              textAlign: 'center'
            }}>
              Frequently Asked Questions
            </h2>

            <div style={{
              display: 'grid',
              gap: theme.spacing[5],
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              <div style={{
                background: theme.colors.bg.secondary,
                padding: theme.spacing[10],
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md,
                transition: `all ${theme.transition.normal}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.hover
                e.currentTarget.style.borderColor = theme.colors.border.medium
                e.currentTarget.style.boxShadow = theme.shadows.glowStrong
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
                e.currentTarget.style.boxShadow = theme.shadows.md
              }}>
                <div style={{
                  fontSize: '18px',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[3],
                  fontWeight: theme.weight.medium
                }}>
                  Can I change my plan at any time?
                </div>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.7'
                }}>
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing.
                </div>
              </div>

              <div style={{
                background: theme.colors.bg.secondary,
                padding: theme.spacing[10],
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md,
                transition: `all ${theme.transition.normal}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.hover
                e.currentTarget.style.borderColor = theme.colors.border.medium
                e.currentTarget.style.boxShadow = theme.shadows.glowStrong
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
                e.currentTarget.style.boxShadow = theme.shadows.md
              }}>
                <div style={{
                  fontSize: '18px',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[3],
                  fontWeight: theme.weight.medium
                }}>
                  What happens if I hit my upload limit?
                </div>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.7'
                }}>
                  On the Free plan, you can have up to 20 active requests with 2GB total storage. You'll need to upgrade to Pro for 200 active requests and 50GB storage.
                </div>
              </div>

              <div style={{
                background: theme.colors.bg.secondary,
                padding: theme.spacing[10],
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md,
                transition: `all ${theme.transition.normal}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.hover
                e.currentTarget.style.borderColor = theme.colors.border.medium
                e.currentTarget.style.boxShadow = theme.shadows.glowStrong
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
                e.currentTarget.style.boxShadow = theme.shadows.md
              }}>
                <div style={{
                  fontSize: '18px',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[3],
                  fontWeight: theme.weight.medium
                }}>
                  Do you offer refunds?
                </div>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.7'
                }}>
                  Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, we'll refund you in full. No questions asked.
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
