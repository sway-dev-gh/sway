import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import theme from '../theme'

// MUST match REQUEST_TYPES from Requests.jsx exactly
const REQUEST_TYPES = [
  {
    id: 'general-upload',
    name: 'General Upload',
    fields: []
  },
  {
    id: 'photos',
    name: 'Photos',
    fields: [
      { id: 'photoCount', label: 'Expected Number of Photos', type: 'number', placeholder: 'e.g., 10' },
      { id: 'resolution', label: 'Resolution Preference', type: 'select', options: ['Any', 'High Resolution', 'Web Optimized'] }
    ]
  },
  {
    id: 'videos',
    name: 'Videos',
    fields: [
      { id: 'duration', label: 'Max Duration (minutes)', type: 'number', placeholder: 'e.g., 5' },
      { id: 'orientation', label: 'Orientation', type: 'select', options: ['Any', 'Landscape', 'Portrait', 'Square'] }
    ]
  },
  {
    id: 'documents',
    name: 'Documents',
    fields: [
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['Any', 'PDF', 'Word', 'Text'] }
    ]
  },
  {
    id: 'code-submission',
    name: 'Code',
    fields: [
      { id: 'language', label: 'Programming Language', type: 'text', placeholder: 'e.g., JavaScript, Python' },
      { id: 'repo', label: 'Repository URL (optional)', type: 'text', placeholder: 'https://github.com/...' }
    ]
  },
  {
    id: 'design-assets',
    name: 'Design',
    fields: [
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['Any', 'PNG', 'SVG', 'AI', 'PSD', 'Figma'] },
      { id: 'dimensions', label: 'Dimensions (optional)', type: 'text', placeholder: 'e.g., 1920x1080' }
    ]
  },
  {
    id: 'event-photos',
    name: 'Event Photos',
    fields: [
      { id: 'eventDate', label: 'Event Date', type: 'date' },
      { id: 'eventName', label: 'Event Name', type: 'text', placeholder: 'e.g., Company Retreat 2024' }
    ]
  },
  {
    id: 'application-materials',
    name: 'Applications',
    fields: [
      { id: 'position', label: 'Position/Program', type: 'text', placeholder: 'e.g., Software Engineer' },
      { id: 'deadline', label: 'Deadline', type: 'date' }
    ]
  },
  {
    id: 'invoices',
    name: 'Invoices',
    fields: [
      { id: 'invoiceNumber', label: 'Invoice Number', type: 'text', placeholder: 'e.g., INV-001' },
      { id: 'amount', label: 'Amount', type: 'text', placeholder: 'e.g., $150.00' }
    ]
  },
  {
    id: 'forms',
    name: 'Forms',
    fields: [
      { id: 'formType', label: 'Form Type', type: 'text', placeholder: 'e.g., Survey, Registration' }
    ]
  },
  {
    id: 'client-deliverables',
    name: 'Deliverables',
    fields: [
      { id: 'projectName', label: 'Project Name', type: 'text', placeholder: 'e.g., Website Redesign' },
      { id: 'dueDate', label: 'Due Date', type: 'date' }
    ]
  },
  {
    id: 'feedback',
    name: 'Feedback',
    fields: [
      { id: 'category', label: 'Category', type: 'select', options: ['General', 'Bug Report', 'Feature Request', 'Other'] },
      { id: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] }
    ]
  },
  {
    id: 'content',
    name: 'Content',
    fields: [
      { id: 'contentType', label: 'Content Type', type: 'select', options: ['Blog Post', 'Article', 'Social Media', 'Other'] }
    ]
  },
  {
    id: 'assignments',
    name: 'Assignments',
    fields: [
      { id: 'course', label: 'Course/Subject', type: 'text', placeholder: 'e.g., Computer Science 101' },
      { id: 'dueDate', label: 'Due Date', type: 'date' }
    ]
  },
  {
    id: 'contracts',
    name: 'Contracts',
    fields: [
      { id: 'contractType', label: 'Contract Type', type: 'text', placeholder: 'e.g., Employment, Vendor' },
      { id: 'effectiveDate', label: 'Effective Date', type: 'date' }
    ]
  },
  {
    id: 'audio',
    name: 'Audio',
    fields: [
      { id: 'duration', label: 'Max Duration (minutes)', type: 'number', placeholder: 'e.g., 10' },
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['Any', 'MP3', 'WAV', 'AAC'] }
    ]
  },
  {
    id: 'spreadsheets',
    name: 'Spreadsheets',
    fields: [
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['Any', 'Excel', 'CSV', 'Google Sheets'] }
    ]
  },
  {
    id: 'presentations',
    name: 'Presentations',
    fields: [
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['Any', 'PowerPoint', 'PDF', 'Google Slides'] },
      { id: 'slideCount', label: 'Expected Slides', type: 'number', placeholder: 'e.g., 10' }
    ]
  },
  {
    id: 'legal',
    name: 'Legal Docs',
    fields: [
      { id: 'docType', label: 'Document Type', type: 'text', placeholder: 'e.g., Contract, Agreement, NDA' }
    ]
  },
  {
    id: 'id-verification',
    name: 'ID Verification',
    fields: [
      { id: 'idType', label: 'ID Type', type: 'select', options: ['Passport', 'Driver License', 'National ID', 'Other'] }
    ]
  },
  {
    id: 'medical',
    name: 'Medical Records',
    fields: [
      { id: 'recordType', label: 'Record Type', type: 'text', placeholder: 'e.g., Lab Results, Prescription' },
      { id: 'date', label: 'Record Date', type: 'date' }
    ]
  },
  {
    id: 'tax-documents',
    name: 'Tax Docs',
    fields: [
      { id: 'taxYear', label: 'Tax Year', type: 'number', placeholder: 'e.g., 2024' },
      { id: 'docType', label: 'Document Type', type: 'text', placeholder: 'e.g., W2, 1099' }
    ]
  },
  {
    id: 'property',
    name: 'Property Photos',
    fields: [
      { id: 'address', label: 'Property Address', type: 'text', placeholder: 'e.g., 123 Main St' },
      { id: 'roomCount', label: 'Number of Rooms', type: 'number', placeholder: 'e.g., 5' }
    ]
  },
  {
    id: 'products',
    name: 'Product Images',
    fields: [
      { id: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., Wireless Headphones' },
      { id: 'imageCount', label: 'Number of Images', type: 'number', placeholder: 'e.g., 5' }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    fields: [
      { id: 'campaign', label: 'Campaign Name', type: 'text', placeholder: 'e.g., Spring Sale 2024' },
      { id: 'channel', label: 'Channel', type: 'select', options: ['Social Media', 'Email', 'Print', 'Digital Ads', 'Other'] }
    ]
  },
  {
    id: 'social-media',
    name: 'Social Media',
    fields: [
      { id: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok', 'Other'] },
      { id: 'contentType', label: 'Content Type', type: 'select', options: ['Photo', 'Video', 'Story', 'Reel', 'Post'] }
    ]
  },
  {
    id: 'surveys',
    name: 'Surveys',
    fields: [
      { id: 'surveyName', label: 'Survey Name', type: 'text', placeholder: 'e.g., Customer Satisfaction' },
      { id: 'responseCount', label: 'Expected Responses', type: 'number', placeholder: 'e.g., 100' }
    ]
  },
  {
    id: 'research',
    name: 'Research Data',
    fields: [
      { id: 'topic', label: 'Research Topic', type: 'text', placeholder: 'e.g., Market Analysis' },
      { id: 'format', label: 'Data Format', type: 'select', options: ['CSV', 'Excel', 'PDF', 'Raw Data', 'Other'] }
    ]
  },
  {
    id: 'screenshots',
    name: 'Screenshots',
    fields: [
      { id: 'purpose', label: 'Purpose', type: 'text', placeholder: 'e.g., Bug Report, Documentation' },
      { id: 'count', label: 'Number of Screenshots', type: 'number', placeholder: 'e.g., 5' }
    ]
  }
]

export default function Upload() {
  const { shortCode } = useParams()
  const [requestData, setRequestData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    customFields: {}
  })
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchRequest()
  }, [shortCode])

  const fetchRequest = async () => {
    try {
      const { data } = await api.get(`/api/r/${shortCode}`)
      setRequestData(data)
    } catch (error) {
      console.error('Error fetching request:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeRemaining = () => {
    if (!requestData?.expiresAt) return null

    const now = new Date()
    const expires = new Date(requestData.expiresAt)
    const diff = expires - now

    if (diff < 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`
    return 'Less than 1 hour remaining'
  }

  const getRequestTypeFields = () => {
    if (!requestData?.requestType) return []
    const type = REQUEST_TYPES.find(t => t.id === requestData.requestType)
    return type?.fields || []
  }

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (files.length === 0) {
      alert('Please select at least one file')
      return
    }

    setUploading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('email', formData.email)
      files.forEach(file => {
        formDataObj.append('files', file)
      })

      await api.post(`/api/r/${shortCode}/upload`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(true)
    } catch (error) {
      console.error('Upload error:', error)
      alert(error.response?.data?.error || 'Failed to upload files')
    } finally {
      setUploading(false)
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

  if (!requestData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg.page,
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '300',
            margin: '0 0 12px 0',
            color: theme.colors.text.primary
          }}>
            Request not found
          </h2>
          <p style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            margin: 0
          }}>
            This upload link may have expired or been deleted.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg.page,
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.medium}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 24px auto'
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '300',
            margin: '0 0 12px 0',
            color: theme.colors.text.primary
          }}>
            Files Uploaded Successfully
          </h2>
          <p style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            margin: 0
          }}>
            Thank you for submitting your files.
          </p>
        </div>
      </div>
    )
  }

  const timeRemaining = getTimeRemaining()
  const customFields = getRequestTypeFields()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAFAFA',
      padding: '40px 24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '60px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: '#999',
            marginBottom: '32px'
          }}>
            Sway
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '400',
            margin: '0 0 12px 0',
            color: '#000',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}>
            {requestData.title}
          </h1>
          {requestData.description && (
            <p style={{
              fontSize: '15px',
              color: '#666',
              margin: '0 0 24px 0',
              lineHeight: '1.6',
              maxWidth: '400px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              {requestData.description}
            </p>
          )}
          {timeRemaining && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              background: '#FFF',
              border: '1px solid #E5E5E5',
              fontSize: '13px',
              fontWeight: '500',
              color: timeRemaining === 'Expired' ? '#FF3B30' : '#666'
            }}>
              {timeRemaining}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: '#FFF',
          padding: '40px',
          border: '1px solid #E5E5E5'
        }}>
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#666',
              marginBottom: '10px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Your Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter your name"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#FAFAFA',
                border: '1px solid #E5E5E5',
                color: '#000',
                fontSize: '15px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#000'
                e.currentTarget.style.background = '#FFF'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E5E5'
                e.currentTarget.style.background = '#FAFAFA'
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#666',
              marginBottom: '10px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Your Email <span style={{ color: '#999', textTransform: 'none' }}>(optional)</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#FAFAFA',
                border: '1px solid #E5E5E5',
                color: '#000',
                fontSize: '15px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#000'
                e.currentTarget.style.background = '#FFF'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E5E5'
                e.currentTarget.style.background = '#FAFAFA'
              }}
            />
          </div>

          {/* Custom Fields */}
          {customFields.map((field) => (
            <div key={field.id} style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: theme.colors.text.secondary,
                marginBottom: '8px',
                fontWeight: theme.weight.medium
              }}>
                {field.label}
              </label>
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
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: theme.radius.md,
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
                  value={formData.customFields[field.id] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customFields: { ...prev.customFields, [field.id]: e.target.value }
                  }))}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: theme.radius.md,
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: `all ${theme.transition.fast}`
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.text.secondary
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.medium
                  }}
                />
              )}
            </div>
          ))}

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#666',
              marginBottom: '10px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Files
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#FAFAFA',
                border: '1px solid #E5E5E5',
                color: '#000',
                fontSize: '15px',
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            {files.length > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#FAFAFA',
                border: '1px solid #E5E5E5'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#999',
                  marginBottom: '12px'
                }}>
                  {files.length} File{files.length > 1 ? 's' : ''} Selected
                </div>
                {files.map((file, idx) => (
                  <div key={idx} style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: idx < files.length - 1 ? '8px' : '0',
                    fontFamily: 'monospace',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '12px' }}>
                      {file.name}
                    </span>
                    <span style={{ color: '#999', fontSize: '13px', flexShrink: 0 }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#000',
              color: '#FFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              opacity: uploading ? 0.6 : 1,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.background = '#333'
              }
            }}
            onMouseLeave={(e) => {
              if (!uploading) {
                e.currentTarget.style.background = '#000'
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </form>
      </div>
    </div>
  )
}
