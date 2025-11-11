import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Scheduling() {
  const navigate = useNavigate()
  const [scheduledRequests, setScheduledRequests] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch regular requests
      const { data: requestsData } = await api.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRequests(requestsData.requests || [])

      // Fetch scheduled requests
      const { data: scheduledData } = await api.get('/api/scheduled-requests', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { scheduled: [] } }))

      setScheduledRequests(scheduledData.scheduled || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateScheduled = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)

      await api.post('/api/scheduled-requests', {
        requestId: selectedRequest,
        scheduledFor: scheduledDateTime.toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setShowCreateModal(false)
      setSelectedRequest('')
      setScheduledDate('')
      setScheduledTime('')
      fetchData()
    } catch (error) {
      console.error('Failed to schedule request:', error)
      alert(error.response?.data?.message || 'Failed to schedule request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelScheduled = async (id) => {
    if (!confirm('Cancel this scheduled request?')) return

    try {
      const token = localStorage.getItem('token')
      await api.delete(`/api/scheduled-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchData()
    } catch (error) {
      console.error('Failed to cancel scheduled request:', error)
      alert('Failed to cancel scheduled request')
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getRequestTitle = (requestId) => {
    const request = requests.find(r => r._id === requestId)
    return request?.title || 'Untitled Request'
  }

  const getMinDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.colors.bg.page }}>
        <Sidebar />
        <div style={{ flex: 1, marginTop: '54px', padding: '80px 120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.colors.bg.page }}>
      <Sidebar />

      <div style={{ flex: 1, marginTop: '54px', padding: '80px 120px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '64px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              marginBottom: '12px',
              letterSpacing: '-0.03em'
            }}>
              Scheduled Requests
            </h1>
            <p style={{
              fontSize: '15px',
              color: theme.colors.text.tertiary,
              lineHeight: '1.6'
            }}>
              Automate request sending at specific dates and times
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              background: theme.colors.white,
              color: theme.colors.black,
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: theme.weight.semibold,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#a3a3a3'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.white
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Schedule Request
          </button>
        </div>

        {scheduledRequests.length === 0 ? (
          <div style={{
            padding: '120px 40px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px',
            background: theme.colors.bg.card
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px',
              opacity: 0.3
            }}>

            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              marginBottom: '12px'
            }}>
              No scheduled requests
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.tertiary,
              marginBottom: '32px'
            }}>
              Create your first automated request to send at a specific time
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: theme.weight.semibold,
                cursor: 'pointer'
              }}
            >
              Schedule Request
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {scheduledRequests.map((scheduled) => (
              <div
                key={scheduled._id}
                style={{
                  padding: '24px',
                  background: theme.colors.bg.card,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: theme.weight.semibold,
                    color: theme.colors.text.primary,
                    marginBottom: '8px'
                  }}>
                    {getRequestTitle(scheduled.requestId)}
                  </h3>
                  <div style={{
                    fontSize: '13px',
                    color: theme.colors.text.tertiary
                  }}>
                    Scheduled for {formatDateTime(scheduled.scheduledFor)}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginTop: '8px',
                    display: 'inline-block',
                    padding: '4px 8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '4px'
                  }}>
                    {scheduled.status || 'pending'}
                  </div>
                </div>

                <button
                  onClick={() => handleCancelScheduled(scheduled._id)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: theme.colors.text.secondary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.dark
                    e.currentTarget.style.color = theme.colors.text.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.light
                    e.currentTarget.style.color = theme.colors.text.secondary
                  }}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Scheduled Request Modal */}
      {showCreateModal && (
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
        }}>
          <div style={{
            background: theme.colors.bg.card,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: '12px',
            padding: '40px',
            width: '100%',
            maxWidth: '520px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              marginBottom: '24px'
            }}>
              Schedule Request
            </h2>

            <form onSubmit={handleCreateScheduled}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: '12px'
                }}>
                  Select Request
                </label>
                <select
                  value={selectedRequest}
                  onChange={(e) => setSelectedRequest(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.page,
                    color: theme.colors.text.primary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Choose a request...</option>
                  {requests.map((request) => (
                    <option key={request._id} value={request._id}>
                      {request.title || 'Untitled Request'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: '12px'
                }}>
                  Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={getMinDateTime()}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.page,
                    color: theme.colors.text.primary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: '12px'
                }}>
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.page,
                    color: theme.colors.text.primary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    color: theme.colors.text.secondary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: theme.weight.semibold,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.5 : 1
                  }}
                >
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Scheduling
