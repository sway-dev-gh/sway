import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import theme from '../theme'

// Match the REQUEST_TYPES from Requests.jsx
const REQUEST_TYPES = [
  {
    id: 'code-submission',
    name: 'Code Submission',
    fields: [
      { id: 'language', label: 'Programming Language', type: 'text', placeholder: 'e.g., JavaScript, Python, Java' },
      { id: 'repo', label: 'GitHub/GitLab URL (optional)', type: 'text', placeholder: 'https://github.com/...' }
    ]
  },
  {
    id: 'design-assets',
    name: 'Design Assets',
    fields: [
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['PNG', 'SVG', 'AI', 'PSD', 'Figma', 'Any'] },
      { id: 'dimensions', label: 'Dimensions (optional)', type: 'text', placeholder: 'e.g., 1920x1080' }
    ]
  },
  {
    id: 'event-photos',
    name: 'Event Photos',
    fields: [
      { id: 'eventDate', label: 'Event Date', type: 'date' },
      { id: 'photoCount', label: 'Expected Number of Photos', type: 'number', placeholder: 'e.g., 20' }
    ]
  },
  {
    id: 'video-submissions',
    name: 'Video Submissions',
    fields: [
      { id: 'duration', label: 'Max Duration (minutes)', type: 'number', placeholder: 'e.g., 5' },
      { id: 'orientation', label: 'Orientation', type: 'select', options: ['Landscape', 'Portrait', 'Square', 'Any'] }
    ]
  },
  {
    id: 'application-materials',
    name: 'Application Materials',
    fields: [
      { id: 'position', label: 'Position Applying For', type: 'text', placeholder: 'e.g., Software Engineer' },
      { id: 'deadline', label: 'Application Deadline', type: 'date' }
    ]
  },
  {
    id: 'invoice-receipts',
    name: 'Invoices & Receipts',
    fields: [
      { id: 'invoiceNumber', label: 'Invoice/Receipt Number', type: 'text', placeholder: 'e.g., INV-001' },
      { id: 'amount', label: 'Amount', type: 'text', placeholder: 'e.g., $150.00' }
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
      background: theme.colors.bg.page,
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '48px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '300',
            margin: '0 0 8px 0',
            color: theme.colors.text.primary,
            letterSpacing: '-0.02em'
          }}>
            Sway
          </h1>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '300',
            margin: '0 0 8px 0',
            color: theme.colors.text.primary,
            letterSpacing: '-0.01em'
          }}>
            {requestData.title}
          </h2>
          {requestData.description && (
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              margin: '0 0 16px 0',
              lineHeight: '1.6'
            }}>
              {requestData.description}
            </p>
          )}
          {timeRemaining && (
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.md,
              fontSize: '12px',
              color: timeRemaining === 'Expired' ? '#FF3B30' : theme.colors.text.secondary
            }}>
              {timeRemaining}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: theme.weight.medium
            }}>
              Your Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
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
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: theme.weight.medium
            }}>
              Your Email (optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: theme.weight.medium
            }}>
              Files *
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              required
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
            />
            {files.length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: theme.colors.bg.page,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radius.md
              }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    marginBottom: idx < files.length - 1 ? '4px' : '0',
                    fontFamily: 'monospace'
                  }}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
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
              padding: '12px 24px',
              background: theme.colors.white,
              color: theme.colors.black,
              border: 'none',
              borderRadius: theme.radius.md,
              fontSize: '14px',
              fontWeight: theme.weight.medium,
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: `all ${theme.transition.fast}`,
              fontFamily: 'inherit',
              opacity: uploading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.background = theme.colors.text.secondary
              }
            }}
            onMouseLeave={(e) => {
              if (!uploading) {
                e.currentTarget.style.background = theme.colors.white
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
