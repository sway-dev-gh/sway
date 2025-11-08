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

          {/* Summary Stats */}
          {templates.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px',
              background: theme.colors.border.light,
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '40px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
                <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Total Templates</div>
                <div style={{ fontSize: '32px', fontWeight: '200', color: theme.colors.white }}>{templates.length}</div>
              </div>
              <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
                <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Most Used Type</div>
                <div style={{ fontSize: '16px', fontWeight: '400', color: theme.colors.white, marginTop: '8px' }}>
                  {(() => {
                    if (templates.length === 0) return 'N/A'
                    const typeCounts = templates.reduce((acc, t) => {
                      acc[t.requestType] = (acc[t.requestType] || 0) + 1
                      return acc
                    }, {})
                    const mostUsed = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
                    return mostUsed ? getRequestTypeName(mostUsed) : 'N/A'
                  })()}
                </div>
              </div>
              <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
                <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Avg Time Limit</div>
                <div style={{ fontSize: '32px', fontWeight: '200', color: theme.colors.white }}>
                  {templates.length > 0 && templates.some(t => t.timeLimitDays) ?
                    Math.round(templates.filter(t => t.timeLimitDays).reduce((sum, t) => sum + t.timeLimitDays, 0) / templates.filter(t => t.timeLimitDays).length) + 'd'
                    : '—'}
                </div>
              </div>
            </div>
          )}

          {/* Templates List */}
          {templates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <div style={{
                fontSize: '15px',
                marginBottom: '8px',
                color: theme.colors.text.muted
              }}>
                No templates yet
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary,
                lineHeight: '1.5'
              }}>
                Templates are created automatically from your existing requests
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              overflow: 'hidden'
            }}>
              {templates.map((template, index) => (
                <div
                  key={template.id}
                  style={{
                    padding: '24px 28px',
                    background: 'transparent',
                    borderBottom: index < templates.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                    transition: `all ${theme.transition.fast}`,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                  onClick={() => navigate('/requests')}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      fontSize: '15px',
                      color: theme.colors.text.primary,
                      fontWeight: theme.weight.medium
                    }}>
                      {template.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: theme.colors.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: theme.weight.medium,
                      padding: '4px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      border: `1px solid ${theme.colors.border.light}`
                    }}>
                      {getRequestTypeName(template.requestType)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: theme.colors.text.muted,
                    marginBottom: template.timeLimitDays ? '10px' : '0',
                    lineHeight: '1.6'
                  }}>
                    {template.description}
                  </div>
                  {template.timeLimitDays && (
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.tertiary,
                      fontFamily: 'monospace'
                    }}>
                      Time limit: {template.timeLimitDays} days
                    </div>
                  )}
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
