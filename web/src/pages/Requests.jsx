import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

const CACHE_VERSION = '2.0.1'

const REQUEST_TYPES = [
  {
    id: 'documents',
    name: 'Documents',
    description: 'PDFs, Word docs, spreadsheets',
    titleLabel: 'Document Collection Name',
    descriptionLabel: 'Document Guidelines (optional)',
    fields: [
      { id: 'docType', label: 'Document Type', type: 'select', options: ['PDF', 'Word', 'Excel', 'PowerPoint', 'Any'] },
      { id: 'pageLimit', label: 'Max Pages (optional)', type: 'number', placeholder: 'e.g., 20' }
    ],
    planRequired: 'free'
  },
  {
    id: 'design-assets',
    name: 'Design',
    description: 'Logos, mockups, design files',
    titleLabel: 'Design Project Name',
    descriptionLabel: 'Design Specifications (optional)',
    fields: [
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['PNG', 'SVG', 'AI', 'PSD', 'Figma', 'Any'] },
      { id: 'dimensions', label: 'Dimensions (optional)', type: 'text', placeholder: 'e.g., 1920x1080' }
    ],
    planRequired: 'free'
  },
  {
    id: 'forms',
    name: 'Forms',
    description: 'Form responses',
    titleLabel: 'Form Collection Name',
    descriptionLabel: 'Form Instructions (optional)',
    fields: [
      { id: 'formName', label: 'Form Name', type: 'text', placeholder: 'e.g., Customer Survey' },
      { id: 'submissionCount', label: 'Expected Submissions', type: 'number', placeholder: 'e.g., 50' }
    ],
    planRequired: 'free'
  },
  {
    id: 'feedback',
    name: 'Feedback',
    description: 'Reviews, testimonials',
    titleLabel: 'Feedback Collection Name',
    descriptionLabel: 'Feedback Guidelines (optional)',
    fields: [
      { id: 'feedbackType', label: 'Feedback Type', type: 'select', options: ['Review', 'Testimonial', 'Bug Report', 'Feature Request', 'Other'] },
      { id: 'topic', label: 'Topic', type: 'text', placeholder: 'What is this feedback about?' }
    ],
    planRequired: 'free'
  },
  {
    id: 'videos',
    name: 'Videos',
    description: 'Collect video files',
    titleLabel: 'Video Project Name',
    descriptionLabel: 'Video Requirements (optional)',
    fields: [
      { id: 'duration', label: 'Max Duration (minutes)', type: 'number', placeholder: 'e.g., 5' },
      { id: 'orientation', label: 'Orientation', type: 'select', options: ['Landscape', 'Portrait', 'Square', 'Any'] }
    ],
    planRequired: 'pro'
  },
  {
    id: 'invoices',
    name: 'Invoices',
    description: 'Billing documents',
    titleLabel: 'Invoice Collection Name',
    descriptionLabel: 'Payment Instructions (optional)',
    fields: [
      { id: 'invoiceNumber', label: 'Invoice Number', type: 'text', placeholder: 'e.g., INV-001' },
      { id: 'amount', label: 'Amount', type: 'text', placeholder: 'e.g., $150.00' }
    ],
    planRequired: 'pro'
  },
  {
    id: 'contracts',
    name: 'Contracts',
    description: 'Signed documents',
    titleLabel: 'Contract Name or ID',
    descriptionLabel: 'Contract Instructions (optional)',
    fields: [
      { id: 'contractType', label: 'Contract Type', type: 'text', placeholder: 'e.g., NDA, Service Agreement' },
      { id: 'parties', label: 'Number of Parties', type: 'number', placeholder: 'e.g., 2' }
    ],
    planRequired: 'pro'
  },
  {
    id: 'presentations',
    name: 'Presentations',
    description: 'PowerPoint, Keynote',
    titleLabel: 'Presentation Name',
    descriptionLabel: 'Presentation Requirements (optional)',
    fields: [
      { id: 'topic', label: 'Presentation Topic', type: 'text', placeholder: 'e.g., Q4 Results' },
      { id: 'slides', label: 'Expected Slides', type: 'number', placeholder: 'e.g., 15' }
    ],
    planRequired: 'pro'
  },
  {
    id: 'audio',
    name: 'Audio',
    description: 'Podcasts, recordings',
    titleLabel: 'Audio Project Name',
    descriptionLabel: 'Audio Requirements (optional)',
    fields: [
      { id: 'duration', label: 'Max Duration (minutes)', type: 'number', placeholder: 'e.g., 30' },
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['MP3', 'WAV', 'AAC', 'Any'] }
    ],
    planRequired: 'pro'
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own request',
    titleLabel: 'Request Title',
    descriptionLabel: 'Request Description (optional)',
    fields: [],
    planRequired: 'free'
  }
]

function Requests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', customFields: {} })
  const [requestType, setRequestType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expiryType, setExpiryType] = useState('preset')
  const [customExpiryValue, setCustomExpiryValue] = useState('')
  const [customExpiryUnit, setCustomExpiryUnit] = useState('days')
  const [createdLink, setCreatedLink] = useState(null)
  const [userPlan, setUserPlan] = useState('free')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [fieldRequirements, setFieldRequirements] = useState({})

  useEffect(() => {
    fetchRequests()
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      const plan = userData.plan || 'free'
      console.log('[Requests] User data from localStorage:', userData)
      console.log('[Requests] Setting userPlan to:', plan)
      setUserPlan(plan)
    }
  }, [])

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

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

  const openModal = () => {
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setRequestType('')
    setFormData({ title: '', description: '', customFields: {} })
    setExpiryType('preset')
    setCustomExpiryValue('')
    setCustomExpiryUnit('days')
    setCreatedLink(null)
    setFieldRequirements({})
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

    if (expiryType === 'custom') {
      const value = parseInt(customExpiryValue)
      if (!value || value < 1) {
        alert('Please enter a valid expiry time')
        return
      }
      if (customExpiryUnit === 'minutes' && value < 5) {
        alert('Minimum expiry time is 5 minutes')
        return
      }
    }

    try {
      setCreating(true)
      const token = localStorage.getItem('token')

      let timeLimit = formData.timeLimit || '7'
      if (expiryType === 'custom') {
        const value = parseInt(customExpiryValue)
        let minutes = value
        if (customExpiryUnit === 'hours') {
          minutes = value * 60
        } else if (customExpiryUnit === 'days') {
          minutes = value * 60 * 24
        }
        timeLimit = `custom:${minutes}`
      }

      const { data } = await api.post('/api/requests', {
        title: formData.title,
        description: formData.description,
        type: requestType,
        timeLimit: timeLimit,
        customFields: formData.customFields || {},
        fieldRequirements: fieldRequirements
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const shareableLink = `${window.location.origin}/r/${data.shortCode}`
      setCreatedLink(shareableLink)

      await fetchRequests()
    } catch (err) {
      console.error('Failed to create request:', err)
      const errorData = err.response?.data

      if (errorData?.limitReached) {
        setUpgradeMessage(errorData.error)
        setShowUpgradeModal(true)
      } else {
        alert(errorData?.error || 'Failed to create request')
      }
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
        marginTop: '72px'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '48px 60px'
        }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: theme.spacing[12]
          }}>
            <div>
              <h1 style={{
                fontSize: '48px',
                fontWeight: theme.weight.bold,
                margin: 0,
                color: theme.colors.text.primary,
                letterSpacing: '-0.03em'
              }}>
                Requests
              </h1>
              <p style={{
                fontSize: theme.fontSize.lg,
                color: theme.colors.text.secondary,
                margin: '16px 0 0 0',
                lineHeight: '1.6'
              }}>
                Create and manage file upload requests
              </p>
            </div>
            <button
              onClick={openModal}
              style={{
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: theme.weight.bold,
                cursor: 'pointer',
                fontFamily: 'inherit',
                height: '56px',
                boxShadow: theme.shadows.lg
              }}
            >
              New Request
            </button>
          </div>

          {/* Request List - Table Style */}
          <div>
            {requests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '120px 60px',
                background: theme.colors.bg.secondary,
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md
              }}>
                <h3 style={{
                  fontSize: theme.fontSize.base,
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  margin: '0 0 12px 0'
                }}>
                  No requests yet
                </h3>
                <p style={{
                  fontSize: theme.fontSize.lg,
                  color: theme.colors.text.secondary,
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  Click "+ New Request" to create your first request.
                </p>
              </div>
            ) : (
              <div style={{
                background: theme.colors.bg.secondary,
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md,
                overflow: 'hidden'
              }}>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 2fr 120px 180px 280px',
                  gap: '24px',
                  padding: '24px 32px',
                  borderBottom: `1px solid ${theme.colors.border.light}`,
                  background: theme.colors.bg.secondary
                }}>
                  <div style={{
                    fontSize: theme.fontSize.lg,
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: theme.weight.medium
                  }}>
                    Title
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.lg,
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: theme.weight.medium
                  }}>
                    Type
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.lg,
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: theme.weight.medium,
                    textAlign: 'center'
                  }}>
                    Files
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.lg,
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: theme.weight.medium
                  }}>
                    Created
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.lg,
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: theme.weight.medium,
                    textAlign: 'right'
                  }}>
                    Actions
                  </div>
                </div>

                {/* Table Body */}
                {requests
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((req, index) => (
                    <div
                      key={req.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 2fr 120px 180px 280px',
                        gap: '24px',
                        padding: '24px 32px',
                        borderBottom: index < requests.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                        transition: `background ${theme.transition.fast}`,
                        cursor: 'pointer',
                        alignItems: 'center'
                      }}
                      onClick={() => navigate(`/requests/${req.id}`)}
                    >
                      {/* Title */}
                      <div style={{
                        fontSize: theme.fontSize.lg,
                        fontWeight: theme.weight.medium,
                        color: theme.colors.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {req.title}
                      </div>

                      {/* Type */}
                      <div style={{
                        fontSize: '16px',
                        color: theme.colors.text.secondary
                      }}>
                        {req.requestType ? req.requestType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'General Upload'}
                      </div>

                      {/* File Count */}
                      <div style={{
                        fontSize: '16px',
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium,
                        textAlign: 'center'
                      }}>
                        {req.uploadCount || 0}
                      </div>

                      {/* Created Date */}
                      <div style={{
                        fontSize: '16px',
                        color: theme.colors.text.secondary
                      }}>
                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      {/* Actions */}
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/requests/${req.id}`)
                          }}
                          style={{
                            padding: '12px 24px',
                            background: theme.colors.white,
                            color: theme.colors.black,
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: theme.weight.medium,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            height: '44px',
                            minWidth: '80px'
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
                            padding: '12px 24px',
                            background: 'transparent',
                            color: theme.colors.text.secondary,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: theme.weight.medium,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            height: '44px',
                            minWidth: '80px'
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

          {/* Create Request Modal - Simplified */}
          {showModal && (
            <div
              style={{
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
                padding: '40px',
                overflowY: 'auto',
                backdropFilter: 'blur(8px)'
              }}
              onClick={closeModal}
            >
              <div
                style={{
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius['2xl'],
                  maxWidth: '540px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  margin: 'auto',
                  boxShadow: theme.shadows.lg
                }}
                className="custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '28px 32px',
                  borderBottom: `1px solid ${theme.colors.border.light}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{
                    fontSize: theme.fontSize.base,
                    fontWeight: '500',
                    margin: 0,
                    letterSpacing: '-0.01em',
                    color: theme.colors.text.primary
                  }}>
                    {createdLink ? 'Request Created' : (requestType ? 'Create Request' : 'Choose Request Type')}
                  </h2>
                  <button
                    onClick={closeModal}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '36px',
                      color: theme.colors.text.muted,
                      cursor: 'pointer',
                      padding: '8px 12px',
                      lineHeight: '1',
                      fontFamily: 'inherit',
                      transition: `color ${theme.transition.fast}`
                    }}


                                    >
                    ×
                  </button>
                </div>

                {/* Modal Content */}
                {createdLink ? (
                  /* Success Screen */
                  <div style={{ padding: '40px 32px' }}>
                    <div style={{
                      fontSize: theme.fontSize.lg,
                      color: theme.colors.text.secondary,
                      marginBottom: '24px',
                      textAlign: 'center'
                    }}>
                      Share this link with people to collect files
                    </div>

                    {/* Link Display */}
                    <div style={{
                      padding: '16px 20px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '12px',
                      marginBottom: '24px',
                      wordBreak: 'break-all',
                      fontSize: theme.fontSize.base,
                      color: theme.colors.text.primary,
                      fontFamily: 'monospace'
                    }}>
                      {createdLink}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button
                        onClick={() => window.open(createdLink, '_blank')}
                        style={{
                          padding: '14px 28px',
                          background: theme.colors.white,
                          color: theme.colors.black,
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: theme.fontSize.base,
                          fontWeight: '500',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                                                  }}
                      >
                        Open Link
                      </button>
                      <button
                        onClick={() => copyToClipboard(createdLink)}
                        style={{
                          padding: '14px 28px',
                          background: 'transparent',
                          color: theme.colors.text.primary,
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: '12px',
                          fontSize: theme.fontSize.base,
                          fontWeight: '500',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                                                  }}
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={closeModal}
                        style={{
                          padding: '14px 28px',
                          background: 'transparent',
                          color: theme.colors.text.secondary,
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: '12px',
                          fontSize: theme.fontSize.base,
                          fontWeight: '500',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                                                  }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : !requestType ? (
                  <div style={{ padding: '24px 32px' }}>
                    {/* Search Bar */}
                    <input
                      type="text"
                      placeholder="Search request types..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: theme.colors.bg.page,
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: '10px',
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.base,
                        fontFamily: 'inherit',
                        outline: 'none',
                        marginBottom: theme.spacing[5]
                      }}
                    />

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      maxHeight: '420px',
                      overflowY: 'auto'
                    }}
                    className="custom-scrollbar"
                    >
                      {REQUEST_TYPES
                        .filter(type =>
                          type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          type.description.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((type) => {
                          const planLevels = { 'free': 0, 'pro': 1, 'business': 2 }
                          const currentPlanLevel = planLevels[userPlan] || 0
                          const requiredPlanLevel = planLevels[type.planRequired] || 0
                          const isLocked = currentPlanLevel < requiredPlanLevel

                          console.log(`[Requests] Type: ${type.name}, userPlan: ${userPlan}, currentLevel: ${currentPlanLevel}, requiredLevel: ${requiredPlanLevel}, isLocked: ${isLocked}`)

                          return (
                            <div
                              key={type.id}
                              onClick={() => {
                                if (isLocked) {
                                  alert(`This request type requires Pro plan. Please upgrade to use this feature.`)
                                } else {
                                  setRequestType(type.id)
                                  setSearchQuery('')
                                }
                              }}
                              style={{
                                padding: '16px',
                                background: isLocked ? theme.colors.bg.page : theme.colors.bg.page,
                                border: `1px solid ${theme.colors.border.medium}`,
                                borderRadius: '10px',
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                                opacity: isLocked ? 0.5 : 1,
                                position: 'relative'
                              }}
                            >
                              {isLocked && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  fontSize: '10px',
                                  color: theme.colors.text.tertiary,
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px',
                                  fontWeight: '500'
                                }}>
                                  PRO
                                </div>
                              )}
                              <div style={{
                                fontSize: theme.fontSize.base,
                                fontWeight: '500',
                                color: theme.colors.text.primary,
                                marginBottom: theme.spacing[1]
                              }}>
                                {type.name}
                              </div>
                              <div style={{
                                fontSize: theme.fontSize.lg,
                                color: theme.colors.text.tertiary,
                                lineHeight: '1.4'
                              }}>
                                {type.description}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateRequest}>
                    <div style={{ padding: '24px 32px' }}>
                      <div style={{ marginBottom: theme.spacing[5] }}>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.sm,
                          color: theme.colors.text.secondary,
                          marginBottom: theme.spacing[2],
                          fontWeight: theme.weight.medium
                        }}>
                          Request Type
                        </label>
                        <div style={{
                          padding: '12px 16px',
                          background: theme.colors.bg.page,
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: '10px',
                          fontSize: theme.fontSize.base,
                          color: theme.colors.text.primary,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          {REQUEST_TYPES.find(t => t.id === requestType)?.name || requestType}
                          <button
                            type="button"
                            onClick={() => setRequestType('')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: theme.colors.text.secondary,
                              cursor: 'pointer',
                              fontSize: theme.fontSize.sm,
                              padding: 0,
                              fontWeight: '500',
                              transition: `color ${theme.transition.fast}`
                            }}


                                            >
                            Change
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: theme.spacing[5] }}>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.sm,
                          color: theme.colors.text.secondary,
                          marginBottom: theme.spacing[2],
                          fontWeight: theme.weight.medium
                        }}>
                          {REQUEST_TYPES.find(t => t.id === requestType)?.titleLabel || 'Title'}
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
                            borderRadius: '10px',
                            color: theme.colors.text.primary,
                            fontSize: theme.fontSize.base,
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                          placeholder={`Enter ${REQUEST_TYPES.find(t => t.id === requestType)?.titleLabel?.toLowerCase() || 'title'}`}
                        />
                      </div>

                      <div style={{ marginBottom: theme.spacing[6] }}>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.sm,
                          color: theme.colors.text.secondary,
                          marginBottom: theme.spacing[2],
                          fontWeight: theme.weight.medium
                        }}>
                          {REQUEST_TYPES.find(t => t.id === requestType)?.descriptionLabel || 'Description (optional)'}
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: theme.colors.bg.page,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '10px',
                            color: theme.colors.text.primary,
                            fontSize: theme.fontSize.base,
                            fontFamily: 'inherit',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                          placeholder={`Enter ${REQUEST_TYPES.find(t => t.id === requestType)?.descriptionLabel?.toLowerCase().replace(' (optional)', '') || 'description'}`}
                        />
                      </div>

                      {/* Custom Fields based on Request Type */}
                      {(() => {
                        const selectedType = REQUEST_TYPES.find(t => t.id === requestType)
                        const customFields = selectedType?.fields || []

                        if (customFields.length === 0) return null

                        return customFields.map((field) => (
                          <div key={field.id} style={{ marginBottom: theme.spacing[5] }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: theme.spacing[2]
                            }}>
                              <label style={{
                                display: 'block',
                                fontSize: theme.fontSize.sm,
                                color: theme.colors.text.secondary,
                                fontWeight: theme.weight.medium
                              }}>
                                {field.label}
                              </label>

                              {/* Required Toggle Switch */}
                              <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                gap: theme.spacing[2]
                              }}>
                                <span style={{
                                  fontSize: theme.fontSize.sm,
                                  color: fieldRequirements[field.id] ? theme.colors.text.primary : theme.colors.text.tertiary,
                                  fontWeight: theme.weight.medium
                                }}>
                                  {fieldRequirements[field.id] ? 'Required' : 'Optional'}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={fieldRequirements[field.id] || false}
                                  onChange={(e) => setFieldRequirements(prev => ({
                                    ...prev,
                                    [field.id]: e.target.checked
                                  }))}
                                  style={{
                                    appearance: 'none',
                                    width: '44px',
                                    height: '24px',
                                    background: fieldRequirements[field.id] ? theme.colors.white : theme.colors.bg.page,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.colors.border.medium}`,
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: `all ${theme.transition.fast}`,
                                    outline: 'none'
                                  }}
                                />
                              </label>
                            </div>

                            {field.type === 'select' ? (
                              <select
                                value={formData.customFields[field.id] || ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  customFields: { ...prev.customFields, [field.id]: e.target.value }
                                }))}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  background: theme.colors.bg.page,
                                  border: `1px solid ${theme.colors.border.medium}`,
                                  borderRadius: '10px',
                                  color: theme.colors.text.primary,
                                  fontSize: theme.fontSize.base,
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="">Select...</option>
                                {field.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.type === 'textarea' ? (
                              <textarea
                                value={formData.customFields[field.id] || ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  customFields: { ...prev.customFields, [field.id]: e.target.value }
                                }))}
                                placeholder={field.placeholder || ''}
                                rows={3}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  background: theme.colors.bg.page,
                                  border: `1px solid ${theme.colors.border.medium}`,
                                  borderRadius: '10px',
                                  color: theme.colors.text.primary,
                                  fontSize: theme.fontSize.base,
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                  resize: 'vertical'
                                }}
                              />
                            ) : (
                              <input
                                type={field.type}
                                value={formData.customFields[field.id] || ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  customFields: { ...prev.customFields, [field.id]: e.target.value }
                                }))}
                                placeholder={field.placeholder || ''}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  background: theme.colors.bg.page,
                                  border: `1px solid ${theme.colors.border.medium}`,
                                  borderRadius: '10px',
                                  color: theme.colors.text.primary,
                                  fontSize: theme.fontSize.base,
                                  fontFamily: 'inherit',
                                  outline: 'none'
                                }}
                              />
                            )}
                          </div>
                        ))
                      })()}

                      <div style={{ marginBottom: theme.spacing[6] }}>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.sm,
                          color: theme.colors.text.secondary,
                          marginBottom: theme.spacing[2],
                          fontWeight: theme.weight.medium
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
                            <span style={{ fontSize: theme.fontSize.base, color: theme.colors.text.primary }}>Preset time</span>
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
                            <span style={{ fontSize: theme.fontSize.base, color: theme.colors.text.primary }}>Custom time</span>
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
                              borderRadius: '10px',
                              color: theme.colors.text.primary,
                              fontSize: theme.fontSize.base,
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
                                borderRadius: '10px',
                                color: theme.colors.text.primary,
                                fontSize: theme.fontSize.base,
                                fontFamily: 'inherit',
                                outline: 'none'
                              }}
                            />
                            <select
                              value={customExpiryUnit}
                              onChange={(e) => {
                                setCustomExpiryUnit(e.target.value)
                                if (e.target.value === 'minutes' && parseInt(customExpiryValue) < 5) {
                                  setCustomExpiryValue('5')
                                }
                              }}
                              style={{
                                padding: '12px 16px',
                                background: theme.colors.bg.page,
                                border: `1px solid ${theme.colors.border.medium}`,
                                borderRadius: '10px',
                                color: theme.colors.text.primary,
                                fontSize: theme.fontSize.base,
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
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={closeModal}
                          style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            color: theme.colors.text.secondary,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '10px',
                            fontSize: theme.fontSize.base,
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
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
                            borderRadius: '10px',
                            fontSize: theme.fontSize.base,
                            fontWeight: '500',
                            cursor: creating ? 'not-allowed' : 'pointer',
                            opacity: creating ? 0.5 : 1,
                            fontFamily: 'inherit',
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            style={{
              background: theme.colors.bg.secondary,
              borderRadius: theme.radius['2xl'],
              padding: '48px',
              maxWidth: '480px',
              width: 'calc(100% - 32px)',
              border: `1px solid ${theme.colors.border.light}`,
              textAlign: 'center',
              boxShadow: theme.shadows.lg
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '24px',
              fontWeight: '500',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Upgrade to Pro
            </h2>
            <p style={{
              fontSize: theme.fontSize.lg,
              color: theme.colors.text.secondary,
              margin: '0 0 32px 0',
              lineHeight: '1.6'
            }}>
              {upgradeMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link
                to="/plan"
                style={{
                  padding: '14px 32px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: theme.fontSize.lg,
                  fontWeight: '500',
                  cursor: 'pointer',
                                    textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                View Plans
              </Link>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  padding: '14px 32px',
                  background: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '12px',
                  fontSize: theme.fontSize.lg,
                  fontWeight: '500',
                  cursor: 'pointer',
                                    fontFamily: 'inherit'
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Toggle Switch Styles */
        input[type="checkbox"][style*="appearance: none"]::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${theme.colors.black};
          top: 2px;
          left: 2px;
          transition: transform 0.2s ease;
        }

        input[type="checkbox"][style*="appearance: none"]:checked::before {
          transform: translateX(20px);
          background: ${theme.colors.black};
        }
      `}</style>
    </>
  )
}

export default Requests
