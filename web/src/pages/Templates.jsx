import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

// Match REQUEST_TYPES from Requests.jsx
const REQUEST_TYPES = [
  { id: 'code-submission', name: 'Code Submission' },
  { id: 'design-assets', name: 'Design Assets' },
  { id: 'event-photos', name: 'Event Photos' },
  { id: 'video-submissions', name: 'Video Submissions' },
  { id: 'application-materials', name: 'Application Materials' },
  { id: 'invoice-receipts', name: 'Invoices & Receipts' },
  { id: 'form-response', name: 'Form Response' },
  { id: 'media-collection', name: 'Mixed Media Collection' },
  { id: 'document-upload', name: 'Document Upload' },
  { id: 'client-deliverables', name: 'Client Deliverables' },
  { id: 'feedback-collection', name: 'Feedback Collection' },
  { id: 'content-submissions', name: 'Content Submissions' },
  { id: 'assignment-handins', name: 'Assignment Hand-ins' },
  { id: 'contract-signatures', name: 'Contract Signatures' },
  { id: 'audio-files', name: 'Audio Files' },
  { id: 'spreadsheet-data', name: 'Spreadsheet Data' },
  { id: 'presentation-slides', name: 'Presentation Slides' },
  { id: 'legal-documents', name: 'Legal Documents' },
  { id: 'id-verification', name: 'ID Verification' },
  { id: 'medical-records', name: 'Medical Records' },
  { id: 'tax-documents', name: 'Tax Documents' },
  { id: 'property-photos', name: 'Property Photos' },
  { id: 'product-images', name: 'Product Images' },
  { id: 'marketing-materials', name: 'Marketing Materials' },
  { id: 'social-media-content', name: 'Social Media Content' },
  { id: 'testimonials-reviews', name: 'Testimonials & Reviews' },
  { id: 'survey-responses', name: 'Survey Responses' },
  { id: 'research-data', name: 'Research Data' },
  { id: 'screenshot-proof', name: 'Screenshots & Proof' },
  { id: 'general-upload', name: 'General Upload' }
]

function Templates() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const { data } = await api.get('/api/templates', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const getRequestTypeName = (typeId) => {
    const type = REQUEST_TYPES.find(t => t.id === typeId)
    return type?.name || 'General Upload'
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
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: 0,
              color: theme.colors.text.primary
            }}>
              Templates
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Save and reuse request templates
            </p>
          </div>

          {/* Templates List */}
          {templates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '120px 40px',
              color: theme.colors.text.muted
            }}>
              <div style={{
                fontSize: '15px',
                marginBottom: '16px'
              }}>
                No templates yet
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary,
                marginBottom: '24px'
              }}>
                Templates are created automatically from your existing requests
              </div>
              <button
                onClick={() => navigate('/requests')}
                style={{
                  padding: '12px 24px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer',
                  transition: `all ${theme.transition.fast}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.text.secondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.colors.white
                }}
              >
                Create Your First Request
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '1px',
              background: theme.colors.border.light
            }}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    padding: '20px',
                    background: theme.colors.bg.page,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: `all ${theme.transition.fast}`
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '6px',
                      fontWeight: theme.weight.medium
                    }}>
                      {template.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.muted,
                      marginBottom: '8px'
                    }}>
                      {template.description}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: theme.colors.text.tertiary
                    }}>
                      Type: {getRequestTypeName(template.requestType)}
                      {template.timeLimitDays && ` • ${template.timeLimitDays} days`}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/requests')}
                    style={{
                      padding: '8px 16px',
                      background: theme.colors.white,
                      color: theme.colors.black,
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: `all ${theme.transition.fast}`,
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.colors.text.secondary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.colors.white
                    }}
                  >
                    View Request
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Templates
