import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

function Plan() {
  const navigate = useNavigate()
  const toast = useToast()
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
    toast.info('Downgrade feature coming soon! Contact support to downgrade your plan.')
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
      toast.error('Failed to start upgrade process. Please try again.')
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
      description: 'AI-powered workflow automation',
      popular: true,
      features: [
        { text: 'AI Assistant with GPT-4o integration', highlight: true },
        { text: 'AI file summarization & missing doc detection', highlight: true },
        { text: 'Smart scheduling suggestions & insights', highlight: true },
        { text: 'AI-powered follow-up email generation', highlight: true },
        { text: 'Unlimited requests', highlight: true },
        { text: '50GB storage', highlight: true },
        { text: 'Advanced visual builder (unlimited elements)', highlight: true },
        { text: 'Pro templates (Onboarding, Product, Event, Job)', highlight: true },
        { text: 'Advanced elements (Dropdowns, Multi-file, Gallery)', highlight: true },
        { text: 'Rich inputs (Date, Color, Slider, Rating)', highlight: true },
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
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px',
          paddingBottom: '160px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '80px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '56px',
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.03em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
              Pricing
            </h1>
            <p style={{
              fontSize: '17px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.5',
              fontWeight: '400'
            }}>
              Simple, transparent pricing for everyone
            </p>
          </div>

          {/* Plans Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
            maxWidth: '1000px',
            margin: '0 auto 120px auto'
          }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: theme.colors.bg.secondary,
                  padding: '40px',
                  borderRadius: '12px',
                  border: plan.popular ? `1px solid ${theme.colors.white}` : `1px solid ${theme.colors.border.light}`,
                  position: 'relative'
                }}
              >
                {/* Badge - Show CURRENT if on this plan, otherwise show POPULAR badge */}
                {plan.id === currentPlan ? (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    padding: '8px 24px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Current Plan
                  </div>
                ) : plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    padding: '8px 24px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Popular
                  </div>
                )}

                {/* Plan Name */}
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.tertiary,
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600'
                }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <div style={{
                      fontSize: '48px',
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                      letterSpacing: '-0.03em',
                      lineHeight: '1',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {plan.price}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      color: theme.colors.text.muted,
                      marginBottom: '6px',
                      fontWeight: '400'
                    }}>
                      {plan.period}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  marginBottom: '40px',
                  lineHeight: '1.5',
                  fontWeight: '400'
                }}>
                  {plan.description}
                </div>

                {/* Features */}
                <div style={{ marginBottom: '40px' }}>
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '14px',
                        color: feature.highlight ? theme.colors.text.primary : theme.colors.text.secondary,
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        fontWeight: feature.highlight ? '500' : '400',
                        lineHeight: '1.5'
                      }}
                    >
                      <span style={{
                        color: theme.colors.text.primary,
                        fontSize: '20px',
                        lineHeight: '1',
                        marginTop: '-2px',
                        flexShrink: 0
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
                    padding: '14px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: plan.id === currentPlan
                      ? `1px solid ${theme.colors.border.medium}`
                      : plan.popular
                        ? 'none'
                        : `1px solid ${theme.colors.border.medium}`,
                    background: plan.id === currentPlan
                      ? 'transparent'
                      : plan.popular
                        ? theme.colors.white
                        : 'transparent',
                    color: plan.id === currentPlan
                      ? theme.colors.text.muted
                      : plan.popular
                        ? theme.colors.black
                        : theme.colors.text.primary,
                    cursor: plan.id === currentPlan ? 'not-allowed' : 'pointer',
                    opacity: plan.id === currentPlan ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (plan.id !== currentPlan && !upgrading) {
                      e.target.style.opacity = '0.85'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.id !== currentPlan) {
                      e.target.style.opacity = '1'
                    }
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
            margin: '0 auto 120px auto'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '56px',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Compare Plans
            </h2>

            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {[
                { feature: 'AI Assistant', free: '—', pro: '✓' },
                { feature: 'AI File Summarization', free: '—', pro: '✓' },
                { feature: 'Smart Scheduling', free: '—', pro: '✓' },
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
                  padding: '24px 32px',
                  borderBottom: index < 9 ? `1px solid ${theme.colors.border.light}` : 'none'
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
                    textAlign: 'center',
                    fontWeight: '400'
                  }}>
                    {row.free}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.white,
                    fontWeight: '500',
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
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '56px',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Pricing FAQ
            </h2>

            <div style={{
              display: 'grid',
              gap: '20px'
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
                  padding: '32px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '12px'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: '12px',
                    lineHeight: '1.5'
                  }}>
                    {faq.q}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    lineHeight: '1.6',
                    fontWeight: '400'
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
            margin: '120px auto 0',
            textAlign: 'center',
            padding: '48px',
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: '16px',
              letterSpacing: '-0.02em'
            }}>
              Ready to get started?
            </h3>
            <p style={{
              fontSize: '15px',
              color: theme.colors.text.secondary,
              marginBottom: '32px',
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              Start sharing files today with our Free plan. Upgrade to Pro anytime for unlimited forms and advanced features.
            </p>
            <button
              onClick={() => navigate('/requests')}
              style={{
                padding: '14px 32px',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '8px',
                border: 'none',
                background: theme.colors.white,
                color: theme.colors.black,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => { e.target.style.opacity = '0.85' }}
              onMouseLeave={(e) => { e.target.style.opacity = '1' }}
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
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowDowngradeModal(false)}
        >
          <div style={{
            background: theme.colors.bg.secondary,
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            border: `1px solid ${theme.colors.border.light}`
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: '16px',
              letterSpacing: '-0.02em'
            }}>
              Switch to Free Plan?
            </div>

            <div style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              marginBottom: '24px',
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              You'll lose access to these Pro features:
            </div>

            <div style={{
              background: theme.colors.bg.tertiary,
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '32px'
            }}>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                lineHeight: '1.8',
                fontWeight: '400'
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
              gap: '12px'
            }}>
              <button
                onClick={() => setShowDowngradeModal(false)}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border.medium}`,
                  background: 'transparent',
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => { e.target.style.opacity = '0.7' }}
                onMouseLeave={(e) => { e.target.style.opacity = '1' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDowngradeToFree}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: 'none',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => { e.target.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.target.style.opacity = '1' }}
              >
                Yes, Switch to Free
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </>
  )
}

export default Plan
