import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

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

      // Check for admin plan override
      const adminPlanOverride = localStorage.getItem('adminPlanOverride')
      if (adminPlanOverride) {
        userData.plan = adminPlanOverride
      }

      const finalPlan = (userData.plan || 'free').toLowerCase()
      setUser(userData)
      setCurrentPlan(finalPlan)
      console.log('[Plan] Setting current plan to:', finalPlan)
    }
    setLoading(false)
  }, [navigate])

  const handleAdminPlanSwitch = (planId) => {
    // Check if user is admin
    const adminKey = localStorage.getItem('adminKey')
    if (!adminKey) return

    // Set the plan override
    localStorage.setItem('adminPlanOverride', planId)

    // Update state
    setCurrentPlan(planId)
    const userData = { ...user, plan: planId }
    setUser(userData)

    // Reload to apply changes
    window.location.reload()
  }

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === currentPlan) {
      return
    }

    setUpgrading(true)
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.post('/api/stripe/create-checkout-session', { planId }, {
        headers: { Authorization: `Bearer ${token}` }
      })

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
      description: 'Perfect for trying out Sway',
      features: [
        { text: '20 active requests', highlight: false },
        { text: '2GB storage', highlight: false },
        { text: 'Limited request types', highlight: false },
        { text: 'Basic analytics', highlight: false },
        { text: 'Standard support', highlight: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$15',
      period: '/month',
      description: 'Unlimited power for professionals',
      popular: true,
      features: [
        { text: '200 active requests', highlight: true },
        { text: '50GB storage', highlight: true },
        { text: 'All request types', highlight: true },
        { text: 'Password-protected requests', highlight: true },
        { text: 'Custom request builder', highlight: true },
        { text: 'Bulk download (Download All)', highlight: true },
        { text: 'Advanced analytics & insights', highlight: true },
        { text: 'File type breakdown', highlight: true },
        { text: 'Top performing requests', highlight: true },
        { text: 'Priority support', highlight: true }
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

          {/* Header - BIG AND BOLD */}
          <div style={{ marginBottom: '100px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: theme.fontSize['3xl'],
              fontWeight: theme.weight.bold,
              margin: '0 0 20px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.03em'
            }}>
              Simple Pricing
            </h1>
            <p style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.7'
            }}>
              Start free. Upgrade when you need more. Cancel anytime.
            </p>
          </div>

          {/* Admin Plan Switcher */}
          {localStorage.getItem('adminKey') && (
            <div style={{
              background: theme.colors.bg.secondary,
              border: `2px solid ${theme.colors.accent.yellow}`,
              borderRadius: theme.radius.xl,
              padding: theme.spacing[8],
              marginBottom: theme.spacing[12],
              maxWidth: '600px',
              margin: `0 auto ${theme.spacing[12]}px auto`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing[4]
              }}>
                <div style={{
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary
                }}>
                  Admin Plan Switcher
                </div>
                <div style={{
                  padding: '4px 12px',
                  background: theme.colors.accent.yellow,
                  borderRadius: theme.radius.full,
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.weight.bold,
                  color: theme.colors.bg.page,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ADMIN
                </div>
              </div>
              <div style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[6]
              }}>
                Current plan: <span style={{ fontWeight: theme.weight.semibold, color: theme.colors.accent.blue }}>{currentPlan.toUpperCase()}</span>
              </div>
              <div style={{
                display: 'flex',
                gap: theme.spacing[4]
              }}>
                <button
                  onClick={() => handleAdminPlanSwitch('free')}
                  style={{
                    flex: 1,
                    padding: theme.spacing[4],
                    background: currentPlan === 'free' ? theme.colors.accent.blue : theme.colors.bg.tertiary,
                    color: currentPlan === 'free' ? theme.colors.white : theme.colors.text.secondary,
                    border: 'none',
                    borderRadius: theme.radius.lg,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer',
                    transition: `all ${theme.transition.fast}`,
                    fontFamily: 'inherit'
                  }}
                >
                  Switch to Free
                </button>
                <button
                  onClick={() => handleAdminPlanSwitch('pro')}
                  style={{
                    flex: 1,
                    padding: theme.spacing[4],
                    background: currentPlan === 'pro' ? theme.colors.accent.blue : theme.colors.bg.tertiary,
                    color: currentPlan === 'pro' ? theme.colors.white : theme.colors.text.secondary,
                    border: 'none',
                    borderRadius: theme.radius.lg,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer',
                    transition: `all ${theme.transition.fast}`,
                    fontFamily: 'inherit'
                  }}
                >
                  Switch to Pro
                </button>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing[6],
            marginBottom: theme.spacing[16],
            maxWidth: '900px',
            margin: '0 auto 80px auto'
          }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: theme.colors.bg.secondary,
                  padding: theme.spacing[10],
                  borderRadius: theme.radius['2xl'],
                  border: plan.popular ? `1px solid ${theme.colors.white}` : `1px solid ${theme.colors.border.light}`,
                  position: 'relative',
                  boxShadow: plan.popular ? theme.shadows.glowStrong : theme.shadows.md
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    padding: '6px 20px',
                    borderRadius: theme.radius.full,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.weight.semibold,
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
                    top: theme.spacing[5],
                    right: theme.spacing[5],
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: theme.colors.text.secondary,
                    padding: '4px 12px',
                    borderRadius: theme.radius.md,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.weight.semibold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px'
                  }}>
                    Current
                  </div>
                )}

                {/* Plan Name */}
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.tertiary,
                  marginBottom: theme.spacing[2],
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  fontWeight: theme.weight.medium
                }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom: theme.spacing[5] }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[1] }}>
                    <div style={{
                      fontSize: '48px',
                      fontWeight: theme.weight.semibold,
                      color: theme.colors.text.primary,
                      letterSpacing: '-0.02em',
                      lineHeight: '1'
                    }}>
                      {plan.price}
                    </div>
                    <div style={{
                      fontSize: theme.fontSize.base,
                      color: theme.colors.text.muted,
                      marginBottom: '6px'
                    }}>
                      {plan.period}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[8],
                  lineHeight: '1.5'
                }}>
                  {plan.description}
                </div>

                {/* Features */}
                <div style={{ marginBottom: theme.spacing[8] }}>
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: theme.fontSize.base,
                        color: feature.highlight ? theme.colors.text.primary : theme.colors.text.secondary,
                        marginBottom: theme.spacing[3],
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing[2],
                        fontWeight: feature.highlight ? theme.weight.medium : theme.weight.normal
                      }}
                    >
                      <span style={{
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.sm,
                        lineHeight: '1'
                      }}>✓</span>
                      <span>{feature.text}</span>
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
                    borderRadius: '12px',
                    fontSize: theme.fontSize.base,
                    fontWeight: '500',
                    cursor: plan.id === currentPlan || upgrading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: upgrading ? 0.6 : 1
                  }}
                >
                  {upgrading ? 'Processing...' : (plan.id === currentPlan ? 'Current Plan' : (plan.id === 'free' ? 'Get Started' : 'Upgrade to Pro'))}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div style={{ marginTop: theme.spacing[16] }}>
            <h2 style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.weight.medium,
              margin: '0 0 32px 0',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              color: theme.colors.text.primary
            }}>
              Frequently Asked Questions
            </h2>

            <div style={{
              display: 'grid',
              gap: theme.spacing[4],
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <div style={{
                background: theme.colors.bg.secondary,
                padding: theme.spacing[8],
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md
              }}>
                <div style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  Can I change my plan at any time?
                </div>
                <div style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing.
                </div>
              </div>

              <div style={{
                background: theme.colors.bg.secondary,
                padding: theme.spacing[8],
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md
              }}>
                <div style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  What happens if I hit my upload limit?
                </div>
                <div style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  On the Free plan, you can have up to 20 active requests with 2GB total storage. You'll need to upgrade to Pro for 200 active requests and 50GB storage.
                </div>
              </div>

              <div style={{
                background: theme.colors.bg.secondary,
                padding: theme.spacing[8],
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md
              }}>
                <div style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  Do you offer refunds?
                </div>
                <div style={{
                  fontSize: theme.fontSize.base,
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
