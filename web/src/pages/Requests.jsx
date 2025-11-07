import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

const REQUEST_TYPES = [
  { id: 'general-upload', name: 'General Upload', description: 'Simple file collection' },
  { id: 'photos', name: 'Photos', description: 'Collect images' },
  { id: 'videos', name: 'Videos', description: 'Collect video files' },
  { id: 'documents', name: 'Documents', description: 'PDFs, Word docs, spreadsheets' },
  { id: 'code-submission', name: 'Code', description: 'Code files or repositories' },
  { id: 'design-assets', name: 'Design', description: 'Logos, mockups, design files' },
  { id: 'event-photos', name: 'Event Photos', description: 'Photos from events' },
  { id: 'application-materials', name: 'Applications', description: 'Resumes, portfolios' },
  { id: 'invoices', name: 'Invoices', description: 'Billing documents' },
  { id: 'forms', name: 'Forms', description: 'Form responses' },
  { id: 'client-deliverables', name: 'Deliverables', description: 'Final work files' },
  { id: 'feedback', name: 'Feedback', description: 'Reviews, testimonials' },
  { id: 'content', name: 'Content', description: 'Articles, written content' },
  { id: 'assignments', name: 'Assignments', description: 'Homework, projects' },
  { id: 'contracts', name: 'Contracts', description: 'Signed documents' },
  { id: 'audio', name: 'Audio', description: 'Podcasts, recordings' },
  { id: 'spreadsheets', name: 'Spreadsheets', description: 'Excel, CSV data' },
  { id: 'presentations', name: 'Presentations', description: 'PowerPoint, Keynote' },
  { id: 'legal', name: 'Legal Docs', description: 'Legal forms' },
  { id: 'id-verification', name: 'ID Verification', description: 'Identification docs' },
  { id: 'medical', name: 'Medical Records', description: 'Health documentation' },
  { id: 'tax-documents', name: 'Tax Docs', description: 'W2s, 1099s' },
  { id: 'property', name: 'Property Photos', description: 'Real estate images' },
  { id: 'products', name: 'Product Images', description: 'E-commerce photos' },
  { id: 'marketing', name: 'Marketing', description: 'Promotional content' },
  { id: 'social-media', name: 'Social Media', description: 'Posts, stories' },
  { id: 'surveys', name: 'Surveys', description: 'Survey responses' },
  { id: 'research', name: 'Research Data', description: 'Research findings' },
  { id: 'screenshots', name: 'Screenshots', description: 'Proof, verification images' }
]

function Requests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '' })
  const [requestType, setRequestType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expiryType, setExpiryType] = useState('preset') // 'preset' or 'custom'
  const [customExpiryValue, setCustomExpiryValue] = useState('')
  const [customExpiryUnit, setCustomExpiryUnit] = useState('days') // 'minutes', 'hours', 'days'
  const [createdLink, setCreatedLink] = useState(null) // Store the created link

  useEffect(() => {
    fetchRequests()
    // Load default request type from settings
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      if (settings.defaultRequestType) {
        setRequestType(settings.defaultRequestType)
      }
    }
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const { data } = await api.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const requestsList = data.requests || []
      setRequests(requestsList)
    } catch (err) {
      console.error('Failed to fetch requests:', err)
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setRequestType('')
    setFormData({ title: '', description: '' })
    setExpiryType('preset')
    setCustomExpiryValue('')
    setCustomExpiryUnit('days')
    setCreatedLink(null)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy. Please copy manually.')
    })
  }

  const handleCreateRequest = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !requestType) return

    // Validate custom expiry
    if (expiryType === 'custom') {
      const value = parseInt(customExpiryValue)
      if (!value || value < 1) {
        alert('Please enter a valid expiry time')
        return
      }
      // Minimum 5 minutes validation
      if (customExpiryUnit === 'minutes' && value < 5) {
        alert('Minimum expiry time is 5 minutes')
        return
      }
    }

    try {
      setCreating(true)
      const token = localStorage.getItem('token')

      // Calculate timeLimit in minutes for custom expiry
      let timeLimit = formData.timeLimit || '7' // default preset
      if (expiryType === 'custom') {
        const value = parseInt(customExpiryValue)
        let minutes = value
        if (customExpiryUnit === 'hours') {
          minutes = value * 60
        } else if (customExpiryUnit === 'days') {
          minutes = value * 60 * 24
        }
        timeLimit = `custom:${minutes}` // Send as "custom:XXX" where XXX is minutes
      }

      const { data } = await api.post('/api/requests', {
        title: formData.title,
        description: formData.description,
        type: requestType,
        timeLimit: timeLimit,
        fields: formData.fields || {}
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Store the shareable link
      const shareableLink = `${window.location.origin}/r/${data.shortCode}`
      setCreatedLink(shareableLink)

      await fetchRequests()
      // Don't close modal yet - show the link first
    } catch (err) {
      console.error('Failed to create request:', err)
      alert(err.response?.data?.error || 'Failed to create request')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (requestId) => {
    if (!confirm('Delete this request? This cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      await api.delete(`/api/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete')
    }
  }

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

          {/* Simple Header with Action */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '400',
                margin: 0,
                color: theme.colors.text.primary
              }}>
                Requests
              </h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: theme.weight.medium,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: `all ${theme.transition.fast}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.text.secondary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.white
              }}
            >
              + New
            </button>
          </div>

          {/* Request List - WhatsApp Style */}
          <div>
            {requests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '120px 40px',
                color: theme.colors.text.muted
              }}>
                <div style={{
                  fontSize: '15px',
                  marginBottom: '16px'
                }}>
                  No requests yet
                </div>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.tertiary
                }}>
                  Tap the + button to create your first request
                </div>
              </div>
            ) : (
              <div>
                {requests
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((req, index) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '20px 0',
                      borderBottom: index < requests.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: `all ${theme.transition.fast}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.colors.bg.hover
                      e.currentTarget.style.paddingLeft = '12px'
                      e.currentTarget.style.paddingRight = '12px'
                      e.currentTarget.style.marginLeft = '-12px'
                      e.currentTarget.style.marginRight = '-12px'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.paddingLeft = '0'
                      e.currentTarget.style.paddingRight = '0'
                      e.currentTarget.style.marginLeft = '0'
                      e.currentTarget.style.marginRight = '0'
                    }}
                  >
                    {/* Icon/Avatar */}
                    <div
                      onClick={() => navigate(`/requests/${req.id}`)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: theme.colors.bg.secondary,
                        border: `1px solid ${theme.colors.border.medium}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '300',
                        color: theme.colors.text.secondary,
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}>
                      {req.uploadCount || 0}
                    </div>

                    {/* Content */}
                    <div
                      onClick={() => navigate(`/requests/${req.id}`)}
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '400',
                        marginBottom: '4px',
                        color: theme.colors.text.primary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {req.title}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: theme.colors.text.muted,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {req.uploadCount || 0} {req.uploadCount === 1 ? 'file' : 'files'}
                      </div>
                    </div>

                    {/* Time */}
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.tertiary,
                      flexShrink: 0
                    }}>
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexShrink: 0
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/requests/${req.id}`)
                        }}
                        style={{
                          padding: '8px 16px',
                          background: theme.colors.white,
                          color: theme.colors.black,
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '400',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(req.id)
                        }}
                        style={{
                          padding: '8px 16px',
                          background: 'transparent',
                          color: theme.colors.text.secondary,
                          border: `1px solid ${theme.colors.border.medium}`,
                          fontSize: '13px',
                          fontWeight: '400',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Request Modal */}
          {showModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '40px'
              }}
              onClick={closeModal}
            >
              <div
                style={{
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.medium}`,
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '32px',
                  borderBottom: `1px solid ${theme.colors.border.medium}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '300',
                    margin: 0,
                    letterSpacing: '-0.01em'
                  }}>
                    Create New Request
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setRequestType('')
                      setFormData({ title: '', description: '' })
                    }}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${theme.colors.border.medium}`,
                      fontSize: '20px',
                      color: theme.colors.text.muted,
                      cursor: 'pointer',
                      padding: '8px 14px',
                      lineHeight: '1',
                      fontFamily: 'inherit'
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Modal Content */}
                {createdLink ? (
                  /* Success Screen */
                  <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                    <div style={{
                      fontSize: '18px',
                      color: theme.colors.text.primary,
                      marginBottom: '24px',
                      fontWeight: '400'
                    }}>
                      Request Created Successfully!
                    </div>

                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.text.muted,
                      marginBottom: '32px'
                    }}>
                      Share this link with people to collect files
                    </div>

                    {/* Link Display */}
                    <div style={{
                      padding: '16px',
                      background: theme.colors.bg.secondary,
                      border: `1px solid ${theme.colors.border.medium}`,
                      marginBottom: '24px',
                      wordBreak: 'break-all',
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      fontFamily: 'monospace'
                    }}>
                      {createdLink}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button
                        onClick={() => copyToClipboard(createdLink)}
                        style={{
                          padding: '12px 24px',
                          background: theme.colors.white,
                          color: theme.colors.black,
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: '400',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={closeModal}
                        style={{
                          padding: '12px 24px',
                          background: 'transparent',
                          color: theme.colors.text.secondary,
                          border: `1px solid ${theme.colors.border.medium}`,
                          fontSize: '14px',
                          fontWeight: '400',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : !requestType ? (
                  <div style={{ padding: '32px' }}>
                    {/* Search Bar */}
                    <input
                      type="text"
                      placeholder="Search request types..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: theme.colors.bg.secondary,
                        border: `1px solid ${theme.colors.border.medium}`,
                        color: theme.colors.text.primary,
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        marginBottom: theme.spacing[5]
                      }}
                    />

                    <div style={{
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                      marginBottom: theme.spacing[4],
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Choose a type
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      paddingRight: '8px'
                    }}
                    className="custom-scrollbar"
                    >
                      {REQUEST_TYPES
                        .filter(type =>
                          type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          type.description.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((type) => (
                        <div
                          key={type.id}
                          onClick={() => {
                            setRequestType(type.id)
                            setSearchQuery('')
                          }}
                          style={{
                            padding: '16px',
                            background: theme.colors.bg.secondary,
                            border: `1px solid ${theme.colors.border.medium}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = theme.colors.bg.hover
                            e.currentTarget.style.borderColor = theme.colors.border.dark
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = theme.colors.bg.secondary
                            e.currentTarget.style.borderColor = theme.colors.border.medium
                          }}
                        >
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '400',
                            color: theme.colors.text.primary,
                            marginBottom: theme.spacing[1]
                          }}>
                            {type.name}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: theme.colors.text.tertiary,
                            lineHeight: '1.3'
                          }}>
                            {type.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateRequest}>
                    <div style={{ padding: '32px' }}>
                      <div style={{ marginBottom: theme.spacing[5] }}>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: theme.colors.text.muted,
                          marginBottom: theme.spacing[2],
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Type
                        </label>
                        <div style={{
                          padding: '12px 16px',
                          background: theme.colors.bg.secondary,
                          border: `1px solid ${theme.colors.border.medium}`,
                          fontSize: '14px',
                          color: theme.colors.text.primary,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          {requestType}
                          <button
                            type="button"
                            onClick={() => setRequestType('')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: theme.colors.text.secondary,
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: 0
                            }}
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: theme.spacing[5] }}>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: theme.colors.text.muted,
                          marginBottom: theme.spacing[2],
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Title
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          autoFocus
                          required
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: theme.colors.bg.page,
                            border: `1px solid ${theme.colors.border.medium}`,
                            color: theme.colors.text.primary,
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                          placeholder="Enter request title"
                        />
                      </div>

                      <div style={{ marginBottom: theme.spacing[6] }}>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: theme.colors.text.muted,
                          marginBottom: theme.spacing[2],
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Description (optional)
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: theme.colors.bg.page,
                            border: `1px solid ${theme.colors.border.medium}`,
                            color: theme.colors.text.primary,
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                          placeholder="Enter description"
                        />
                      </div>

                      <div style={{ marginBottom: theme.spacing[6] }}>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: theme.colors.text.muted,
                          marginBottom: theme.spacing[2],
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Link Expires In
                        </label>

                        {/* Expiry Type Selection */}
                        <div style={{ marginBottom: theme.spacing[3] }}>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: theme.spacing[2],
                            cursor: 'pointer'
                          }}>
                            <input
                              type="radio"
                              name="expiryType"
                              value="preset"
                              checked={expiryType === 'preset'}
                              onChange={(e) => setExpiryType(e.target.value)}
                              style={{
                                marginRight: theme.spacing[2],
                                accentColor: theme.colors.white,
                                filter: 'grayscale(1)'
                              }}
                            />
                            <span style={{ fontSize: '14px', color: theme.colors.text.primary }}>Preset time</span>
                          </label>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}>
                            <input
                              type="radio"
                              name="expiryType"
                              value="custom"
                              checked={expiryType === 'custom'}
                              onChange={(e) => setExpiryType(e.target.value)}
                              style={{
                                marginRight: theme.spacing[2],
                                accentColor: theme.colors.white,
                                filter: 'grayscale(1)'
                              }}
                            />
                            <span style={{ fontSize: '14px', color: theme.colors.text.primary }}>Custom time</span>
                          </label>
                        </div>

                        {expiryType === 'preset' ? (
                          <select
                            value={formData.timeLimit || '7'}
                            onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              background: theme.colors.bg.page,
                              border: `1px solid ${theme.colors.border.medium}`,
                              color: theme.colors.text.primary,
                              fontSize: '14px',
                              fontFamily: 'inherit',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="1">1 day</option>
                            <option value="3">3 days</option>
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                            <option value="never">Never</option>
                          </select>
                        ) : (
                          <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                            <input
                              type="number"
                              min={customExpiryUnit === 'minutes' ? '5' : '1'}
                              value={customExpiryValue}
                              onChange={(e) => setCustomExpiryValue(e.target.value)}
                              placeholder="Enter time"
                              style={{
                                flex: 1,
                                padding: '12px 16px',
                                background: theme.colors.bg.page,
                                border: `1px solid ${theme.colors.border.medium}`,
                                color: theme.colors.text.primary,
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                outline: 'none'
                              }}
                            />
                            <select
                              value={customExpiryUnit}
                              onChange={(e) => {
                                setCustomExpiryUnit(e.target.value)
                                // Reset value if switching to minutes and current value is less than 5
                                if (e.target.value === 'minutes' && parseInt(customExpiryValue) < 5) {
                                  setCustomExpiryValue('5')
                                }
                              }}
                              style={{
                                padding: '12px 16px',
                                background: theme.colors.bg.page,
                                border: `1px solid ${theme.colors.border.medium}`,
                                color: theme.colors.text.primary,
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                outline: 'none',
                                cursor: 'pointer',
                                minWidth: '120px'
                              }}
                            >
                              <option value="minutes">Minutes</option>
                              <option value="hours">Hours</option>
                              <option value="days">Days</option>
                            </select>
                          </div>
                        )}
                        {expiryType === 'custom' && customExpiryUnit === 'minutes' && (
                          <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.muted,
                            marginTop: theme.spacing[2]
                          }}>
                            Minimum: 5 minutes
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false)
                            setRequestType('')
                            setFormData({ title: '', description: '' })
                          }}
                          style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            color: theme.colors.text.secondary,
                            border: `1px solid ${theme.colors.border.medium}`,
                            fontSize: '14px',
                            fontWeight: '400',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creating}
                          style={{
                            padding: '12px 24px',
                            background: theme.colors.white,
                            color: theme.colors.black,
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '400',
                            cursor: creating ? 'not-allowed' : 'pointer',
                            opacity: creating ? 0.5 : 1,
                            fontFamily: 'inherit'
                          }}
                        >
                          {creating ? 'Creating...' : 'Create Request'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme.colors.border.medium};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme.colors.border.dark};
        }
      `}</style>
    </>
  )
}

export default Requests
