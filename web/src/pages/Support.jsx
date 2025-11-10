import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function Support() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement support ticket submission
    setSubmitted(true)
    setTimeout(() => {
      setEmail('')
      setSubject('')
      setMessage('')
      setSubmitted(false)
    }, 3000)
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
          padding: '48px 32px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px', maxWidth: '900px', margin: '0 auto 48px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '56px',
              fontWeight: '700',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.03em'
            }}>
              Get Help
            </h1>
            <p style={{
              fontSize: '20px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.5'
            }}>
              We're here to help you collect files smoothly
            </p>
          </div>

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

            {submitted && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: theme.radius.md,
                color: '#22c55e',
                fontSize: '14px',
                marginBottom: '24px'
              }}>
                Message sent! We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.radius.md,
                      color: theme.colors.text.primary,
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.radius.md,
                      color: theme.colors.text.primary,
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Message
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.radius.md,
                      color: theme.colors.text.primary,
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    placeholder="Tell us what you need help with..."
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    ...theme.buttons.primary.base,
                    width: '100%'
                  }}
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </>
  )
}

export default Support
