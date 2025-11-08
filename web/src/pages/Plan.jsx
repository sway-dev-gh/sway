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
      tagline: 'Try it out',
      description: 'Perfect for testing Sway Files and collecting a few files from students, clients, or friends.',
      features: [
        { text: '1 active request', highlight: false },
        { text: 'Up to 10 uploads total', highlight: false },
        { text: 'Basic file types only', highlight: false },
        { text: 'Files kept 30 days', highlight: false },
        { text: 'Community support', highlight: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9',
      period: '/month',
      tagline: 'Most popular',
      description: 'Built for freelancers, teachers, and creators who regularly collect files from clients or students.',
      popular: true,
      features: [
        { text: 'Unlimited requests', highlight: true },
        { text: 'Unlimited uploads', highlight: true },
        { text: 'All file types supported', highlight: true },
        { text: 'Remove Sway branding', highlight: false },
        { text: 'Email notifications', highlight: false },
        { text: 'Files stored forever', highlight: false },
        { text: 'Priority support', highlight: false }
      ]
    },
    {
      id: 'business',
      name: 'Business',
      price: '$17',
      period: '/month',
      tagline: 'For growing teams',
      description: 'Everything in Pro, plus advanced features for teams, agencies, and businesses collecting files at scale.',
      features: [
        { text: 'Everything in Pro', highlight: false },
        { text: 'Custom domain (files.yourcompany.com)', highlight: true },
        { text: 'Team access (up to 5 members)', highlight: true },
        { text: 'Dropbox/Drive sync', highlight: true },
        { text: 'Large file limits (5GB)', highlight: true },
        { text: 'Priority support', highlight: false }
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
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '60px 40px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '60px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '400',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(to right, #ffffff, #a3a3a3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
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
              lineHeight: '1.6'
            }}>
              Start free. Upgrade when you need more. Cancel anytime.
            </p>
          </div>

          {/* Plans Grid - Modern 2025 Style */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '80px'
          }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '40px 32px',
                  borderRadius: '16px',
                  border: plan.popular ? `2px solid ${theme.colors.white}` : `1px solid ${theme.colors.border.light}`,
                  position: 'relative',
                  transition: `all ${theme.transition.normal}`,
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!plan.popular) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                    e.currentTarget.style.borderColor = theme.colors.border.medium
                  }
                }}
                onMouseLeave={(e) => {
                  if (!plan.popular) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                    e.currentTarget.style.borderColor = theme.colors.border.light
                  }
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    padding: '4px 16px',
                    borderRadius: '100px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Most Popular
                  </div>
                )}

                {/* Current Plan Badge */}
                {plan.id === currentPlan && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: theme.colors.text.secondary,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Current
                  </div>
                )}

                {/* Plan Name */}
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.tertiary,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  fontWeight: theme.weight.semibold
                }}>
                  {plan.name}
                </div>

                {/* Tagline */}
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.muted,
                  marginBottom: '8px',
                  minHeight: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '500'
                }}>
                  {plan.tagline}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  marginBottom: '24px',
                  lineHeight: '1.5',
                  minHeight: '42px'
                }}>
                  {plan.description}
                </div>

                {/* Price */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <div style={{
                      fontSize: '56px',
                      fontWeight: '300',
                      color: theme.colors.text.primary,
                      letterSpacing: '-0.04em',
                      lineHeight: '1'
                    }}>
                      {plan.price}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      color: theme.colors.text.muted,
                      marginBottom: '4px'
                    }}>
                      {plan.period}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div style={{ marginBottom: '32px', minHeight: '200px' }}>
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '14px',
                        color: feature.highlight ? theme.colors.text.primary : theme.colors.text.secondary,
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        fontWeight: feature.highlight ? '500' : '400'
                      }}
                    >
                      <span style={{
                        color: theme.colors.text.primary,
                        fontSize: '16px',
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
                    padding: '14px 28px',
                    background: plan.id === currentPlan ? 'transparent' : (plan.popular ? theme.colors.white : 'transparent'),
                    color: plan.id === currentPlan ? theme.colors.text.secondary : (plan.popular ? theme.colors.black : theme.colors.white),
                    border: `1px solid ${plan.id === currentPlan ? theme.colors.border.medium : (plan.popular ? theme.colors.white : theme.colors.border.medium)}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: plan.id === currentPlan || upgrading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: `all ${theme.transition.normal}`,
                    opacity: upgrading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (plan.id !== currentPlan && !upgrading) {
                      if (plan.popular) {
                        e.currentTarget.style.background = theme.colors.text.secondary
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      } else {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.id !== currentPlan && !upgrading) {
                      e.currentTarget.style.background = plan.popular ? theme.colors.white : 'transparent'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {upgrading ? 'Processing...' : (plan.id === currentPlan ? 'Current Plan' : (plan.id === 'free' ? 'Get Started Free' : 'Upgrade to ' + plan.name))}
                </button>
              </div>
            ))}
          </div>

          {/* Value Props */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '80px'
          }}>
            <div style={{
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '32px',
                marginBottom: '16px'
              }}>🔒</div>
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Secure & Private
              </div>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                lineHeight: '1.6'
              }}>
                Your files are encrypted and stored securely. We never share your data.
              </div>
            </div>

            <div style={{
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '32px',
                marginBottom: '16px'
              }}>⚡</div>
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Lightning Fast
              </div>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                lineHeight: '1.6'
              }}>
                Upload and download files at blazing speeds. No waiting around.
              </div>
            </div>

            <div style={{
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '32px',
                marginBottom: '16px'
              }}>💰</div>
              <div style={{
                fontSize: '16px',
                fontWeight: '500',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Cancel Anytime
              </div>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                lineHeight: '1.6'
              }}>
                No long-term contracts. Cancel your subscription whenever you want.
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: '0 0 40px 0',
              letterSpacing: '-0.02em',
              textAlign: 'center'
            }}>
              Frequently Asked Questions
            </h2>

            <div style={{
              display: 'grid',
              gap: '16px',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '28px 32px',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{
                  fontSize: '16px',
                  color: theme.colors.text.primary,
                  marginBottom: '12px',
                  fontWeight: '500'
                }}>
                  Can I change my plan at any time?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing.
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '28px 32px',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{
                  fontSize: '16px',
                  color: theme.colors.text.primary,
                  marginBottom: '12px',
                  fontWeight: '500'
                }}>
                  What happens if I hit my upload limit?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  On the Free plan, you can have 1 active request with up to 10 total uploads. You'll need to upgrade to Pro for unlimited uploads.
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '28px 32px',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{
                  fontSize: '16px',
                  color: theme.colors.text.primary,
                  marginBottom: '12px',
                  fontWeight: '500'
                }}>
                  Do you offer refunds?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
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
