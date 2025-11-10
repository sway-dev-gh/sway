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
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)

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

  const handleDowngradeToFree = () => {
    // Admin users can switch instantly
    const adminKey = localStorage.getItem('adminKey')
    if (adminKey) {
      handleAdminPlanSwitch('free')
      return
    }

    // For real users, cancel their subscription (to be implemented)
    // For now, just show a message
    alert('Downgrade feature coming soon! Contact support to downgrade your plan.')
    setShowDowngradeModal(false)
  }

  const handleUpgrade = async (planId) => {
    if (planId === currentPlan) {
      return
    }

    // If downgrading to free, show confirmation modal
    if (planId === 'free' && currentPlan === 'pro') {
      setShowDowngradeModal(true)
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
      description: 'Try it out, no credit card',
      features: [
        { text: '5 file requests', highlight: false },
        { text: '2GB storage', highlight: false },
        { text: 'Basic visual builder (5 elements max)', highlight: false },
        { text: 'Basic templates (Blank, Simple, Contact)', highlight: false },
        { text: 'Basic elements (Text, Input, File Upload)', highlight: false },
        { text: 'Basic analytics', highlight: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$15',
      period: '/month',
      description: 'For serious file collection',
      popular: true,
      features: [
        { text: 'Unlimited requests', highlight: true },
        { text: '50GB storage', highlight: true },
        { text: 'Advanced visual builder (unlimited elements)', highlight: true },
        { text: 'Pro templates (Onboarding, Product, Event, Job)', highlight: true },
        { text: 'Advanced elements (Dropdowns, Multi-file, Gallery)', highlight: true },
        { text: 'Rich inputs (Date, Color, Slider, Rating)', highlight: true },
        { text: 'Rich text editor & Email validation', highlight: true },
        { text: 'Keyboard shortcuts enabled', highlight: true },
        { text: 'Password protect pages', highlight: true },
        { text: 'Download everything (bulk downloads)', highlight: true },
        { text: 'Advanced analytics', highlight: true },
        { text: 'Priority support (4hr response)', highlight: true }
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
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '48px 32px',
          paddingBottom: '120px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
              Pricing
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Simple, transparent pricing for everyone
            </p>
          </div>

          {/* Plans Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing[6],
            maxWidth: '1000px',
            margin: '0 auto 60px auto'
          }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: theme.colors.bg.secondary,
                  padding: '20px',
                  borderRadius: '10px',
                  border: plan.popular ? `1px solid ${theme.colors.white}` : `1px solid ${theme.colors.border.light}`,
                  position: 'relative',
                  // boxShadow removed: theme.shadows.md
                }}
              >
                {/* Badge - Show CURRENT if on this plan, otherwise show PRO badge */}
                {plan.id === currentPlan ? (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    padding: '6px 20px',
                    borderRadius: theme.radius.full,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.weight.semibold,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Current
                  </div>
                ) : plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    padding: '6px 20px',
                    borderRadius: theme.radius.full,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.weight.semibold,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    PRO
                  </div>
                )}

                {/* Plan Name */}
                <div style={{
                  fontSize: '11px',
                  color: theme.colors.text.tertiary,
                  marginBottom: theme.spacing[2],
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  fontWeight: '600'
                }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom: theme.spacing[5] }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[1] }}>
                    <div style={{
                      fontSize: '42px',
                      fontWeight: '700',
                      color: theme.colors.text.primary,
                      letterSpacing: '-0.02em',
                      lineHeight: '1',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {plan.price}
                    </div>
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text.muted,
                      marginBottom: '4px'
                    }}>
                      {plan.period}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[5],
                  lineHeight: '1.5'
                }}>
                  {plan.description}
                </div>

                {/* Features */}
                <div style={{ marginBottom: theme.spacing[5] }}>
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '14px',
                        color: feature.highlight ? theme.colors.text.primary : theme.colors.text.secondary,
                        marginBottom: theme.spacing[2],
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing[2],
                        fontWeight: feature.highlight ? theme.weight.medium : theme.weight.normal
                      }}
                    >
                      <span style={{
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.xs,
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
                    ...(plan.id === currentPlan
                      ? { ...theme.buttons.secondary.base, cursor: 'not-allowed', opacity: 0.6 }
                      : plan.popular
                        ? { ...theme.buttons.primary.base, ...(upgrading && theme.buttons.primary.disabled) }
                        : { ...theme.buttons.secondary.base, ...(upgrading && theme.buttons.secondary.disabled) }
                    )
                  }}
                >
                  {upgrading ? 'Processing...' : (plan.id === currentPlan ? 'Current Plan' : (plan.id === 'free' ? (currentPlan === 'pro' ? 'Switch to Free' : 'Get Started') : 'Upgrade to Pro'))}
                </button>
              </div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto 80px auto'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '40px',
              color: theme.colors.text.primary
            }}>
              Compare Plans
            </h2>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              overflow: 'hidden'
            }}>
              {[
                { feature: 'Active Forms', free: '5', pro: 'Unlimited' },
                { feature: 'Storage', free: '2GB', pro: '50GB' },
                { feature: 'Visual Builder', free: '—', pro: '✓' },
                { feature: 'Password Protection', free: '—', pro: '✓' },
                { feature: 'Bulk Download', free: '—', pro: '✓' },
                { feature: 'Advanced Analytics', free: '—', pro: '✓' },
                { feature: 'Priority Support', free: '—', pro: '✓' }
              ].map((row, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  padding: '16px 24px',
                  borderBottom: index < 7 ? `1px solid ${theme.colors.border.light}` : 'none',
                  background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.text.primary,
                    fontWeight: '500'
                  }}>
                    {row.feature}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    textAlign: 'center'
                  }}>
                    {row.free}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.white,
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {row.pro}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing FAQ */}
          <div style={{
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '40px',
              color: theme.colors.text.primary
            }}>
              Pricing FAQ
            </h2>

            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {[
                {
                  q: 'Can I change plans at any time?',
                  a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
                },
                {
                  q: 'What happens if I exceed my limits?',
                  a: 'We\'ll notify you when you\'re approaching your limits. You can upgrade to Pro for unlimited forms and more storage.'
                },
                {
                  q: 'Do you offer refunds?',
                  a: 'Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked.'
                },
                {
                  q: 'Is my payment information secure?',
                  a: 'Absolutely. We use Stripe for payment processing, which is PCI compliant and trusted by millions of businesses worldwide.'
                }
              ].map((faq, index) => (
                <div key={index} style={{
                  padding: '20px 24px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.lg
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: '8px'
                  }}>
                    {faq.q}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    lineHeight: '1.6'
                  }}>
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div style={{
            maxWidth: '700px',
            margin: '80px auto 0',
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.radius.xl
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: '12px'
            }}>
              Ready to get started?
            </h3>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Start sharing files today with our Free plan. Upgrade to Pro anytime for unlimited forms and advanced features.
            </p>
            <button
              onClick={() => navigate('/requests')}
              style={{
                ...theme.buttons.primary.base,
                padding: '12px 32px',
                fontSize: '16px'
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Downgrade Confirmation Modal */}
      {showDowngradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowDowngradeModal(false)}
        >
          <div style={{
            background: theme.colors.bg.secondary,
            borderRadius: theme.radius['2xl'],
            padding: theme.spacing[12],
            maxWidth: '500px',
            width: '90%',
            border: `1px solid ${theme.colors.border.light}`,
            // boxShadow removed
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: theme.fontSize['2xl'],
              fontWeight: theme.weight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4]
            }}>
              Switch to Free Plan?
            </div>

            <div style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing[6],
              lineHeight: '1.6'
            }}>
              You'll lose access to these Pro features:
            </div>

            <div style={{
              background: theme.colors.bg.tertiary,
              padding: theme.spacing[6],
              borderRadius: theme.radius.xl,
              marginBottom: theme.spacing[8]
            }}>
              <ul style={{
                margin: 0,
                paddingLeft: theme.spacing[6],
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.sm,
                lineHeight: '1.8'
              }}>
                <li>Advanced analytics & insights</li>
                <li>Password-protected requests</li>
                <li>Custom request builder</li>
                <li>Bulk download (Download All)</li>
                <li>File type breakdown</li>
                <li>Top performing requests</li>
                <li>200 active requests → 20 active requests</li>
                <li>50GB storage → 2GB storage</li>
              </ul>
            </div>

            <div style={{
              display: 'flex',
              gap: theme.spacing[4]
            }}>
              <button
                onClick={() => setShowDowngradeModal(false)}
                style={{
                  ...theme.buttons.secondary.base,
                  flex: 1,
                  padding: '12px 24px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDowngradeToFree}
                style={{
                  ...theme.buttons.danger.base,
                  flex: 1,
                  padding: '12px 24px'
                }}
              >
                Yes, Switch to Free
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Plan
