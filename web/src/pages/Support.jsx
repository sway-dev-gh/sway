import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Support() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [loading, setLoading] = useState(false)

  // Check if user has access (Pro/Business or Admin)
  useEffect(() => {
    const adminKey = localStorage.getItem('adminKey')
    const isAdmin = !!adminKey

    if (!isAdmin) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const userPlan = user.plan?.toLowerCase() || 'free'
        if (userPlan !== 'pro' && userPlan !== 'business') {
          navigate('/plan')
        }
      }
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      await api.post('/api/support/tickets', {
        subject,
        message,
        priority
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Support ticket submitted! We\'ll get back to you within 24 hours.')
      setSubject('')
      setMessage('')
      setPriority('normal')
    } catch (error) {
      console.error('Error submitting support ticket:', error)
      if (error.response?.status === 403) {
        alert('Pro or Business plan required for priority support')
      } else {
        alert('Failed to submit support ticket. Please try again.')
      }
    } finally {
      setLoading(false)
    }
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
          maxWidth: '900px',
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
              Priority Support
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Get help from our team within 24 hours
            </p>
          </div>

          {/* Support Form */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            padding: '40px'
          }}>
            <form onSubmit={handleSubmit}>
              {/* Priority Level */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: '8px'
                }}>
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '8px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="low">Low - General question</option>
                  <option value="normal">Normal - Need assistance</option>
                  <option value="high">High - Urgent issue</option>
                </select>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: '8px'
                }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What do you need help with?"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '8px',
                    color: theme.colors.text.primary,
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: '8px'
                }}>
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  required
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '8px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 32px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: theme.weight.medium,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: `all ${theme.transition.normal}`
                }}
              >
                {loading ? 'Submitting...' : 'Submit Support Request'}
              </button>
            </form>
          </div>

          {/* Support Info */}
          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border.light}`
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.primary,
              margin: '0 0 12px 0'
            }}>
              Response Times
            </h3>
            <div style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              lineHeight: '1.6'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: theme.colors.text.secondary }}>Pro Plan:</strong> Within 24 hours
              </div>
              <div>
                <strong style={{ color: theme.colors.text.secondary }}>Business Plan:</strong> Within 4 hours for high priority
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Support
