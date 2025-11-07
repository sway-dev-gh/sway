import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

const REQUEST_TYPES = [
  {
    id: 'code-submission',
    name: 'Code Submission',
    description: 'Request code files, repositories, or programming assignments',
    fields: [
      { id: 'language', label: 'Programming Language', type: 'text', placeholder: 'e.g., JavaScript, Python, Java' },
      { id: 'repo', label: 'GitHub/GitLab URL (optional)', type: 'text', placeholder: 'https://github.com/...' }
    ]
  },
  {
    id: 'design-assets',
    name: 'Design Assets',
    description: 'Collect logos, mockups, design files',
    fields: [
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['PNG', 'SVG', 'AI', 'PSD', 'Figma', 'Any'] },
      { id: 'dimensions', label: 'Dimensions (optional)', type: 'text', placeholder: 'e.g., 1920x1080' }
    ]
  },
  {
    id: 'event-photos',
    name: 'Event Photos',
    description: 'Request photos from events or gatherings',
    fields: [
      { id: 'eventDate', label: 'Event Date', type: 'date' },
      { id: 'photoCount', label: 'Expected Number of Photos', type: 'number', placeholder: 'e.g., 20' }
    ]
  },
  {
    id: 'video-submissions',
    name: 'Video Submissions',
    description: 'Collect video content, vlogs, or recordings',
    fields: [
      { id: 'duration', label: 'Max Duration (minutes)', type: 'number', placeholder: 'e.g., 5' },
      { id: 'orientation', label: 'Orientation', type: 'select', options: ['Landscape', 'Portrait', 'Square', 'Any'] }
    ]
  },
  {
    id: 'application-materials',
    name: 'Application Materials',
    description: 'Collect resumes, portfolios, cover letters',
    fields: [
      { id: 'position', label: 'Position Applying For', type: 'text', placeholder: 'e.g., Software Engineer' },
      { id: 'deadline', label: 'Application Deadline', type: 'date' }
    ]
  },
  {
    id: 'invoice-receipts',
    name: 'Invoices & Receipts',
    description: 'Request billing documents and payment receipts',
    fields: [
      { id: 'invoiceNumber', label: 'Invoice/Receipt Number', type: 'text', placeholder: 'e.g., INV-001' },
      { id: 'amount', label: 'Amount', type: 'text', placeholder: 'e.g., $150.00' }
    ]
  },
  { id: 'form-response', name: 'Form Response', description: 'Collect structured form data and responses', fields: [] },
  { id: 'media-collection', name: 'Mixed Media Collection', description: 'Gather photos, videos, and audio files', fields: [] },
  { id: 'document-upload', name: 'Document Upload', description: 'Request PDFs, Word docs, spreadsheets', fields: [] },
  { id: 'client-deliverables', name: 'Client Deliverables', description: 'Request final work or project files', fields: [] },
  { id: 'feedback-collection', name: 'Feedback Collection', description: 'Gather reviews, comments, testimonials', fields: [] },
  { id: 'content-submissions', name: 'Content Submissions', description: 'Collect blog posts, articles, written content', fields: [] },
  { id: 'assignment-handins', name: 'Assignment Hand-ins', description: 'Student homework and project submissions', fields: [] },
  { id: 'contract-signatures', name: 'Contract Signatures', description: 'Signed documents and agreements', fields: [] },
  { id: 'audio-files', name: 'Audio Files', description: 'Request podcasts, voice recordings, or music files', fields: [] },
  { id: 'spreadsheet-data', name: 'Spreadsheet Data', description: 'Collect Excel files, CSV data, or financial reports', fields: [] },
  { id: 'presentation-slides', name: 'Presentation Slides', description: 'Request PowerPoint, Keynote, or Google Slides', fields: [] },
  { id: 'legal-documents', name: 'Legal Documents', description: 'Collect contracts, agreements, or legal forms', fields: [] },
  { id: 'id-verification', name: 'ID Verification', description: 'Collect identification documents for verification', fields: [] },
  { id: 'medical-records', name: 'Medical Records', description: 'Request health records or medical documentation', fields: [] },
  { id: 'tax-documents', name: 'Tax Documents', description: 'Collect W2s, 1099s, or tax-related files', fields: [] },
  { id: 'property-photos', name: 'Property Photos', description: 'Request real estate or property images', fields: [] },
  { id: 'product-images', name: 'Product Images', description: 'Collect product photos for e-commerce', fields: [] },
  { id: 'marketing-materials', name: 'Marketing Materials', description: 'Request brochures, flyers, or promotional content', fields: [] },
  { id: 'social-media-content', name: 'Social Media Content', description: 'Collect posts, stories, or social assets', fields: [] },
  { id: 'testimonials-reviews', name: 'Testimonials & Reviews', description: 'Gather customer feedback and reviews', fields: [] },
  { id: 'survey-responses', name: 'Survey Responses', description: 'Collect completed surveys or questionnaires', fields: [] },
  { id: 'research-data', name: 'Research Data', description: 'Request research findings or data sets', fields: [] },
  { id: 'screenshot-proof', name: 'Screenshots & Proof', description: 'Collect evidence, screenshots, or verification images', fields: [] },
  { id: 'general-upload', name: 'General Upload', description: 'Simple file collection for any purpose', fields: [] }
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

  const handleCreateRequest = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !requestType) return

    try {
      setCreating(true)
      const token = localStorage.getItem('token')

      await api.post('/api/requests', {
        title: formData.title,
        description: formData.description,
        type: requestType,
        timeLimit: formData.timeLimit || '7',
        fields: formData.fields || {}
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      await fetchRequests()
      setShowModal(false)
      setRequestType('')
      setFormData({ title: '', description: '' })
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
                borderRadius: '24px',
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
                      cursor: 'pointer',
                      transition: `all ${theme.transition.fast}`
                    }}
                    onClick={() => navigate(`/requests/${req.id}`)}
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
                    <div style={{
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
                      flexShrink: 0
                    }}>
                      {req.uploadCount || 0}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
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
              onClick={() => {
                setShowModal(false)
                setRequestType('')
                setFormData({ title: '', description: '' })
              }}
            >
              <div
                style={{
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.medium}`,
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflow: 'auto'
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
                {!requestType ? (
                  <div style={{ padding: '32px' }}>
                    {/* Search Bar */}
                    <div style={{ marginBottom: theme.spacing[5] }}>
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
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                      marginBottom: theme.spacing[4],
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Choose a request type
                    </div>

                    <div style={{
                      display: 'grid',
                      gap: '1px',
                      background: theme.colors.border.light,
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
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
                            padding: '20px',
                            background: theme.colors.bg.page,
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = theme.colors.bg.secondary
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = theme.colors.bg.page
                          }}
                        >
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '400',
                            color: theme.colors.text.primary,
                            letterSpacing: '-0.01em',
                            marginBottom: theme.spacing[1]
                          }}>
                            {type.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.muted,
                            lineHeight: '1.5'
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
                      </div>

                      {/* Custom Fields based on request type */}
                      {REQUEST_TYPES.find(t => t.id === requestType)?.fields?.map((field) => (
                        <div key={field.id} style={{ marginBottom: theme.spacing[5] }}>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            color: theme.colors.text.muted,
                            marginBottom: theme.spacing[2],
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            {field.label}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={formData.fields?.[field.id] || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                fields: { ...prev.fields, [field.id]: e.target.value }
                              }))}
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
                              <option value="">Select {field.label}</option>
                              {field.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={formData.fields?.[field.id] || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                fields: { ...prev.fields, [field.id]: e.target.value }
                              }))}
                              placeholder={field.placeholder}
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
                            />
                          )}
                        </div>
                      ))}

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
    </>
  )
}

export default Requests
