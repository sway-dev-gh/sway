import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'
import ConfirmModal from '../components/ConfirmModal'

function Settings() {
  const navigate = useNavigate()
  const toast = useToast()
  const [user, setUser] = useState({ email: '' })
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [upgrading, setUpgrading] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [expandedFAQIndex, setExpandedFAQIndex] = useState(null)
  const [supportEmail, setSupportEmail] = useState('')
  const [supportSubject, setSupportSubject] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportSubmitted, setSupportSubmitted] = useState(false)

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

      // Check for admin plan override
      const adminPlanOverride = localStorage.getItem('adminPlanOverride')
      if (adminPlanOverride) {
        userData.plan = adminPlanOverride
      }

      const finalPlan = (userData.plan || 'free').toLowerCase()
      setCurrentPlan(finalPlan)
    }

    setLoading(false)
  }, [navigate])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    setChangingPassword(true)

    try {
      const token = localStorage.getItem('token')
      await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setPasswordSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

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

  const toggleFAQ = (index) => {
    setExpandedFAQIndex(expandedFAQIndex === index ? null : index)
  }

  const handleSupportSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement support ticket submission
    setSupportSubmitted(true)
    setTimeout(() => {
      setSupportEmail('')
      setSupportSubject('')
      setSupportMessage('')
      setSupportSubmitted(false)
    }, 3000)
  }

  // Plan data
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

  // FAQ data
  const faqs = [
    {
      question: "Can I change my plan at any time?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing."
    },
    {
      question: "What happens if I hit my upload limit?",
      answer: "On the Free plan, you can have up to 20 active requests with 2GB total storage. You'll need to upgrade to Pro for 200 active requests and 50GB storage."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, we'll refund you in full. No questions asked."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. All uploads are protected with HTTPS encryption, malware scanning, filename sanitization, magic byte validation, and rate limiting. We block executable files (.exe, .sh, .bat) and scan for malicious content. Your data is never shared with third parties."
    },
    {
      question: "What file types can I request?",
      answer: "You can request any file type - documents, images, videos, PDFs, and more. Pro users can create custom request types and specify exactly what they need."
    },
    {
      question: "How does password protection work?",
      answer: "Pro users can add password protection to any request. Recipients will need to enter the password before they can upload files, adding an extra layer of security."
    },
    {
      question: "Can I use Sway for business?",
      answer: "Yes! Many businesses use Sway to collect client documents, vendor files, and team submissions. Pro gives you the tools you need for professional use."
    },
    {
      question: "What's the difference between Free and Pro analytics?",
      answer: "Free users get basic stats like total requests and uploads. Pro users get advanced insights including file type breakdown, top performing requests, upload trends, and detailed analytics per request."
    },
    {
      question: "How long are files stored?",
      answer: "Files are stored indefinitely as long as you stay within your storage limit. You can delete requests and files anytime to free up space."
    },
    {
      question: "Why is Sway better than email attachments?",
      answer: "Email has size limits (usually 25MB), gets lost in inboxes, and lacks organization. Sway gives you a dedicated link, unlimited file types, up to 50MB per file, automatic notifications, and all uploads in one organized dashboard."
    },
    {
      question: "Can people upload without creating an account?",
      answer: "Yes! Recipients just click your link and upload - no signup required. They can optionally provide their name and email, making it incredibly easy for anyone to send you files."
    },
    {
      question: "What happens when someone uploads a file?",
      answer: "You get an instant notification, and the file appears in your dashboard. You can download individual files or use the bulk download feature (Pro) to get everything at once as a zip file."
    },
    {
      question: "Can I try Pro features before paying?",
      answer: "Start with Free to test the core features. When you're ready for password protection, custom fields, advanced analytics, and bulk downloads, upgrade to Pro. Plus, we offer a 30-day money-back guarantee."
    },
    {
      question: "How do I get my files out if I cancel?",
      answer: "You keep full access to download all your files even after canceling. No lock-in, no hostage situations - your data is always yours. Just download everything before your storage limit decreases."
    },
    {
      question: "Do you sell my data or show ads?",
      answer: "Never. We make money from Pro subscriptions, not from your data. No ads, no tracking, no selling your information to third parties. Your files and privacy are sacred."
    },
    {
      question: "What makes Sway different from Dropbox or Google Drive?",
      answer: "Sway is purpose-built for collecting files FROM others, not sharing files TO others. No folders to navigate, no permissions to manage - just send a link and receive. It's the reverse of traditional file sharing."
    },
    {
      question: "Can I set expiration dates on requests?",
      answer: "Yes! Every request can have a custom expiration date. After the date passes, the upload link stops accepting new files. Perfect for deadlines, time-sensitive collections, or limiting exposure."
    },
    {
      question: "Is there a mobile app?",
      answer: "Sway works perfectly in any mobile browser - no app needed. The interface is fully responsive, and uploaders can send files from their phones just as easily as desktop. Simple and universal."
    },
    {
      question: "How does the visual Builder work?",
      answer: "The Builder is a drag-and-drop canvas where you design custom upload forms. Drag elements from the left sidebar onto the canvas, customize their properties in the right panel, and arrange everything visually. It's like Canva meets Typeform - no coding required."
    },
    {
      question: "What's the difference between Save and Publish?",
      answer: "Save creates a draft that you can continue editing later - it appears in your Tracking page but isn't live yet. Publish makes your form live and generates a shareable link that people can use to upload files. You can edit published forms anytime."
    },
    {
      question: "Can I use templates to start building?",
      answer: "Yes! Free users get 3 professional templates (Simple Contact, Quick Feedback, Basic File Request). Pro users get 5 additional advanced templates (Client Onboarding, Event Registration, Job Application, Survey Form, Document Collection). Just click a template to start customizing."
    },
    {
      question: "What elements can I use in Free vs Pro?",
      answer: "Free gives you 6 essential elements: Text Block, Heading, Text Input, Text Area, File Upload, and Button. Pro unlocks 16 additional elements including Multi-File Upload, Image Gallery, Date Picker, Rich Text Editor, Star Rating, Signature Pad, and more - 22 elements total."
    },
    {
      question: "What keyboard shortcuts are available in the Builder?",
      answer: "Delete key removes selected elements. Cmd+Z/Cmd+Y (or Ctrl+Z/Ctrl+Y on Windows) for undo/redo. Cmd+C/Cmd+V/Cmd+D for copy/paste/duplicate. Arrow keys move selected elements. Shift+click to select multiple elements at once."
    },
    {
      question: "How do I customize form elements?",
      answer: "Click any element on the canvas to select it. The right panel shows all customizable properties - change labels, placeholders, colors, sizes, required fields, and more. Changes apply instantly. Different element types have different properties available."
    },
    {
      question: "Can I move multiple elements at once?",
      answer: "Yes! Hold Shift and click multiple elements to select them together. Once selected, you can drag them as a group or delete them all at once. Click anywhere on the canvas to deselect."
    }
  ]

  // Render Account Tab Content
  const renderAccountTab = () => (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      display: 'grid',
      gap: theme.spacing[5]
    }}>
      {/* Email Address */}
      <div style={{
        padding: '24px 32px',
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border.light}`,
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          fontSize: '14px',
          color: theme.colors.text.secondary,
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          Email
        </div>
        <div style={{
          fontSize: '16px',
          color: theme.colors.text.primary,
          fontWeight: '400'
        }}>
          {user.email}
        </div>
      </div>

      {/* Change Password */}
      <div style={{
        padding: '32px',
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border.light}`,
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          fontSize: '18px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          marginBottom: '24px'
        }}>
          Change Password
        </div>

        <form onSubmit={handleChangePassword}>
          {passwordError && (
            <div style={theme.alerts.error}>
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div style={theme.alerts.success}>
              {passwordSuccess}
            </div>
          )}

          <div style={{ display: 'grid', gap: theme.layout.formFieldGap }}>
            <div>
              <label style={theme.inputs.label}>
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
                }}
              />
            </div>

            <div>
              <label style={theme.inputs.label}>
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a new password"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
                }}
              />
              <div style={theme.inputs.helper}>
                Minimum 6 characters
              </div>
            </div>

            <div>
              <label style={theme.inputs.label}>
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
                }}
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              style={{
                ...theme.buttons.primary.base,
                width: '100%',
                marginTop: '8px',
                ...(changingPassword && theme.buttons.primary.disabled)
              }}
            >
              {changingPassword ? 'Updating password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div style={{
        padding: '32px',
        borderRadius: theme.radius.lg,
        border: `1px solid rgba(239, 68, 68, 0.3)`,
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          fontSize: '18px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          marginBottom: '24px'
        }}>
          Danger Zone
        </div>

        <div style={{
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border.light}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: theme.spacing[4]
        }}>
          <div>
            <div style={{
              fontSize: '15px',
              color: theme.colors.text.primary,
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              Delete Account
            </div>
            <div style={{
              fontSize: '13px',
              color: theme.colors.text.tertiary
            }}>
              Permanently delete your account and all data
            </div>
          </div>
          <button
            onClick={() => setConfirmDeleteAccount(true)}
            style={{
              ...theme.buttons.danger.base,
              whiteSpace: 'nowrap'
            }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )

  // Render Plan Tab Content
  const renderPlanTab = () => (
    <div>
      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '24px',
        maxWidth: '1000px',
        margin: '0 auto 80px auto'
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
                  }}>•</span>
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
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '6px',
                border: plan.id === currentPlan
                  ? `1px solid ${theme.colors.border.light}`
                  : plan.popular
                    ? 'none'
                    : `1px solid ${theme.colors.border.light}`,
                background: plan.id === currentPlan
                  ? 'transparent'
                  : plan.popular
                    ? theme.colors.white
                    : 'transparent',
                color: plan.id === currentPlan
                  ? theme.colors.text.tertiary
                  : plan.popular
                    ? theme.colors.black
                    : theme.colors.text.primary,
                cursor: plan.id === currentPlan ? 'not-allowed' : 'pointer',
                opacity: plan.id === currentPlan ? 0.4 : 1,
                outline: 'none'
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
            { feature: 'Active Forms', free: '5', pro: 'Unlimited' },
            { feature: 'Storage', free: '2GB', pro: '50GB' },
            { feature: 'Visual Builder', free: '-', pro: 'Yes' },
            { feature: 'Password Protection', free: '-', pro: 'Yes' },
            { feature: 'Bulk Download', free: '-', pro: 'Yes' },
            { feature: 'Advanced Analytics', free: '-', pro: 'Yes' },
            { feature: 'Priority Support', free: '-', pro: 'Yes' }
          ].map((row, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              padding: '24px 32px',
              borderBottom: index < 6 ? `1px solid ${theme.colors.border.light}` : 'none'
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
    </div>
  )

  // Render FAQ Tab Content
  const renderFAQTab = () => (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {faqs.map((faq, index) => {
        const isExpanded = expandedFAQIndex === index

        return (
          <div
            key={index}
            style={{
              marginBottom: '48px',
              paddingBottom: '48px',
              borderBottom: index === faqs.length - 1 ? 'none' : `1px solid ${theme.colors.border.light}`
            }}
          >
            <button
              onClick={() => toggleFAQ(index)}
              style={{
                width: '100%',
                padding: 0,
                background: 'transparent',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '24px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit'
              }}
            >
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.primary,
                fontWeight: '500',
                lineHeight: '1.5',
                flex: 1
              }}>
                {faq.question}
              </div>
              <div style={{
                fontSize: '16px',
                color: theme.colors.text.secondary,
                lineHeight: '1',
                flexShrink: 0,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                marginTop: '2px'
              }}>
                ▼
              </div>
            </button>

            {isExpanded && (
              <div style={{
                paddingTop: '16px',
                fontSize: '14px',
                color: theme.colors.text.secondary,
                lineHeight: '1.6',
                fontWeight: '400',
                paddingRight: '48px'
              }}>
                {faq.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // Render Support Tab Content
  const renderSupportTab = () => (
    <div>
      {/* Support Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '24px',
        maxWidth: '900px',
        margin: '0 auto 48px'
      }}>
        {/* Email Support */}
        <div style={{
          padding: '32px',
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: theme.radius.lg,
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            Email Support
          </div>
          <div style={{
            fontSize: '24px',
            color: theme.colors.text.primary,
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            support@swayfiles.com
          </div>
          <div style={{
            fontSize: '15px',
            color: theme.colors.text.secondary,
            marginBottom: '16px'
          }}>
            We typically respond within 24 hours
          </div>
          <button
            onClick={() => window.location.href = 'mailto:support@swayfiles.com'}
            style={{
              ...theme.buttons.secondary.base
            }}
          >
            Send Email
          </button>
        </div>

        {/* Pro Support */}
        <div style={{
          padding: '32px',
          border: `1px solid ${theme.colors.white}`,
          borderRadius: theme.radius.lg,
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            Priority Support
          </div>
          <div style={{
            fontSize: '24px',
            color: theme.colors.text.primary,
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            Pro Members Only
          </div>
          <div style={{
            fontSize: '15px',
            color: theme.colors.text.secondary,
            marginBottom: '16px'
          }}>
            Get help within 4 hours, Monday-Friday
          </div>
          <button
            onClick={() => navigate('/plan')}
            style={{
              ...theme.buttons.primary.base
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>

      {/* Contact Form */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '32px',
        border: `1px solid ${theme.colors.border.light}`,
        borderRadius: theme.radius.lg,
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.colors.text.primary,
          marginBottom: '24px'
        }}>
          Send us a message
        </div>

        {supportSubmitted && (
          <div style={theme.alerts.success}>
            Message sent successfully. We'll get back to you soon.
          </div>
        )}

        <form onSubmit={handleSupportSubmit}>
          <div style={{ display: 'grid', gap: theme.layout.formFieldGap }}>
            <div>
              <label style={theme.inputs.label}>
                Email address
              </label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="you@example.com"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
                }}
              />
            </div>

            <div>
              <label style={theme.inputs.label}>
                Subject
              </label>
              <input
                type="text"
                required
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder="How can we help you?"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
                }}
              />
            </div>

            <div>
              <label style={theme.inputs.label}>
                Message
              </label>
              <textarea
                required
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                style={theme.inputs.textarea.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.textarea.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.textarea.base)
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                ...theme.buttons.primary.base,
                width: '100%',
                marginTop: '8px'
              }}
            >
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  )

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
          padding: '80px 40px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Settings
            </h1>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Manage your account and preferences
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{
            borderBottom: `1px solid ${theme.colors.border.light}`,
            marginBottom: '48px'
          }}>
            <div style={{
              display: 'flex',
              gap: '32px'
            }}>
              {[
                { id: 'account', label: 'Account' },
                { id: 'faq', label: 'FAQ' },
                { id: 'support', label: 'Support' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '16px 0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: activeTab === tab.id ? theme.colors.white : theme.colors.text.secondary,
                    cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                    fontFamily: 'inherit',
                    marginBottom: '-1px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'account' && renderAccountTab()}
          {activeTab === 'faq' && renderFAQTab()}
          {activeTab === 'support' && renderSupportTab()}

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
                <li>200 active requests to 20 active requests</li>
                <li>50GB storage to 2GB storage</li>
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
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors.border.light}`,
                  background: 'transparent',
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDowngradeToFree}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Yes, Switch to Free
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal
        isOpen={confirmDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This cannot be undone."
        onConfirm={() => {
          setConfirmDeleteAccount(false)
          toast.info('Account deletion would be processed here')
        }}
        onCancel={() => setConfirmDeleteAccount(false)}
        confirmText="Delete Account"
        cancelText="Cancel"
        danger={true}
      />
    </>
  )
}

export default Settings
