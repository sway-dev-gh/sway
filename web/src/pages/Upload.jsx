import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import theme from '../theme'

// MUST match REQUEST_TYPES from Requests.jsx exactly - CUSTOM FIELDS MUST MATCH
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
      { id: 'resolution', label: 'Preferred Resolution', type: 'select', options: ['Any', '4K', '1080p', '720p'] },
      { id: 'count', label: 'Expected Number of Photos', type: 'number', placeholder: 'e.g., 10' }
    ]
  },
  {
    id: 'videos',
    name: 'Videos',
    fields: [
      { id: 'duration', label: 'Max Duration (minutes)', type: 'number', placeholder: 'e.g., 5' },
      { id: 'orientation', label: 'Orientation', type: 'select', options: ['Landscape', 'Portrait', 'Square', 'Any'] }
    ]
  },
  {
    id: 'documents',
    name: 'Documents',
    fields: [
      { id: 'docType', label: 'Document Type', type: 'select', options: ['PDF', 'Word', 'Excel', 'PowerPoint', 'Any'] },
      { id: 'pageLimit', label: 'Max Pages (optional)', type: 'number', placeholder: 'e.g., 20' }
    ]
  },
  {
    id: 'code-submission',
    name: 'Code',
    fields: [
      { id: 'language', label: 'Programming Language', type: 'text', placeholder: 'e.g., JavaScript, Python, Java' },
      { id: 'repo', label: 'GitHub/GitLab URL (optional)', type: 'text', placeholder: 'https://github.com/...' }
    ]
  },
  {
    id: 'design-assets',
    name: 'Design',
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
    id: 'application-materials',
    name: 'Applications',
    fields: [
      { id: 'position', label: 'Position Applying For', type: 'text', placeholder: 'e.g., Software Engineer' },
      { id: 'deadline', label: 'Application Deadline', type: 'date' }
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
      { id: 'formName', label: 'Form Name', type: 'text', placeholder: 'e.g., Customer Survey' },
      { id: 'submissionCount', label: 'Expected Submissions', type: 'number', placeholder: 'e.g., 50' }
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
      { id: 'feedbackType', label: 'Feedback Type', type: 'select', options: ['Review', 'Testimonial', 'Bug Report', 'Feature Request', 'Other'] },
      { id: 'topic', label: 'Topic', type: 'text', placeholder: 'What is this feedback about?' }
    ]
  },
  {
    id: 'content',
    name: 'Content',
    fields: [
      { id: 'contentType', label: 'Content Type', type: 'select', options: ['Article', 'Blog Post', 'Script', 'Copy', 'Other'] },
      { id: 'wordCount', label: 'Target Word Count', type: 'number', placeholder: 'e.g., 1000' }
    ]
  },
  {
    id: 'assignments',
    name: 'Assignments',
    fields: [
      { id: 'course', label: 'Course Name', type: 'text', placeholder: 'e.g., CS 101' },
      { id: 'dueDate', label: 'Due Date', type: 'date' }
    ]
  },
  {
    id: 'contracts',
    name: 'Contracts',
    fields: [
      { id: 'contractType', label: 'Contract Type', type: 'text', placeholder: 'e.g., NDA, Service Agreement' },
      { id: 'parties', label: 'Number of Parties', type: 'number', placeholder: 'e.g., 2' }
    ]
  },
  {
    id: 'audio',
    name: 'Audio',
    fields: [
      { id: 'duration', label: 'Max Duration (minutes)', type: 'number', placeholder: 'e.g., 30' },
      { id: 'format', label: 'Preferred Format', type: 'select', options: ['MP3', 'WAV', 'AAC', 'Any'] }
    ]
  },
  {
    id: 'spreadsheets',
    name: 'Spreadsheets',
    fields: [
      { id: 'dataType', label: 'Data Type', type: 'text', placeholder: 'e.g., Sales Data, Customer List' },
      { id: 'rowCount', label: 'Expected Rows (optional)', type: 'number', placeholder: 'e.g., 500' }
    ]
  },
  {
    id: 'presentations',
    name: 'Presentations',
    fields: [
      { id: 'topic', label: 'Presentation Topic', type: 'text', placeholder: 'e.g., Q4 Results' },
      { id: 'slides', label: 'Expected Slides', type: 'number', placeholder: 'e.g., 15' }
    ]
  },
  {
    id: 'legal',
    name: 'Legal Docs',
    fields: [
      { id: 'documentType', label: 'Document Type', type: 'text', placeholder: 'e.g., Power of Attorney' },
      { id: 'jurisdiction', label: 'Jurisdiction', type: 'text', placeholder: 'e.g., California' }
    ]
  },
  {
    id: 'id-verification',
    name: 'ID Verification',
    fields: [
      { id: 'idType', label: 'ID Type', type: 'select', options: ['Passport', 'Driver License', 'State ID', 'Other'] },
      { id: 'country', label: 'Country', type: 'text', placeholder: 'e.g., USA' }
    ]
  },
  {
    id: 'medical',
    name: 'Medical Records',
    fields: [
      { id: 'recordType', label: 'Record Type', type: 'select', options: ['Lab Results', 'Prescription', 'X-Ray/Imaging', 'Medical History', 'Other'] },
      { id: 'dateOfService', label: 'Date of Service', type: 'date' }
    ]
  },
  {
    id: 'tax-documents',
    name: 'Tax Docs',
    fields: [
      { id: 'taxYear', label: 'Tax Year', type: 'number', placeholder: 'e.g., 2024' },
      { id: 'docType', label: 'Document Type', type: 'select', options: ['W2', '1099', '1040', 'Receipt', 'Other'] }
    ]
  },
  {
    id: 'property',
    name: 'Property Photos',
    fields: [
      { id: 'propertyType', label: 'Property Type', type: 'select', options: ['House', 'Apartment', 'Commercial', 'Land', 'Other'] },
      { id: 'photoCount', label: 'Expected Number of Photos', type: 'number', placeholder: 'e.g., 25' }
    ]
  },
  {
    id: 'products',
    name: 'Product Images',
    fields: [
      { id: 'productCategory', label: 'Product Category', type: 'text', placeholder: 'e.g., Electronics, Clothing' },
      { id: 'backgroundType', label: 'Background', type: 'select', options: ['White', 'Transparent', 'Lifestyle', 'Any'] }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    fields: [
      { id: 'campaignName', label: 'Campaign Name', type: 'text', placeholder: 'e.g., Spring Sale 2024' },
      { id: 'platform', label: 'Platform', type: 'select', options: ['Email', 'Social Media', 'Print', 'Digital Ads', 'All'] }
    ]
  },
  {
    id: 'social-media',
    name: 'Social Media',
    fields: [
      { id: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'LinkedIn', 'Multiple'] },
      { id: 'contentType', label: 'Content Type', type: 'select', options: ['Post', 'Story', 'Reel', 'Video', 'Image'] }
    ]
  },
  {
    id: 'surveys',
    name: 'Surveys',
    fields: [
      { id: 'surveyName', label: 'Survey Name', type: 'text', placeholder: 'e.g., Customer Satisfaction' },
      { id: 'expectedResponses', label: 'Expected Responses', type: 'number', placeholder: 'e.g., 100' }
    ]
  },
  {
    id: 'research',
    name: 'Research Data',
    fields: [
      { id: 'researchTopic', label: 'Research Topic', type: 'text', placeholder: 'e.g., Climate Change Impact' },
      { id: 'dataFormat', label: 'Data Format', type: 'select', options: ['CSV', 'JSON', 'Excel', 'PDF', 'Other'] }
    ]
  },
  {
    id: 'screenshots',
    name: 'Screenshots',
    fields: [
      { id: 'purpose', label: 'Purpose', type: 'text', placeholder: 'e.g., Bug Report, Tutorial' },
      { id: 'count', label: 'Expected Number', type: 'number', placeholder: 'e.g., 5' }
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
  const [brandingData, setBrandingData] = useState(null)

  useEffect(() => {
    fetchRequest()
  }, [shortCode])

  const fetchRequest = async () => {
    try {
      const { data } = await api.get(`/api/r/${shortCode}`)
      setRequestData(data)

      // Process branding data if available
      if (data.branding && data.branding.requestTypeDesigns && data.requestType) {
        try {
          const designs = JSON.parse(data.branding.requestTypeDesigns)
          const requestTypeDesign = designs[data.requestType]
          if (requestTypeDesign) {
            setBrandingData({
              backgroundColor: requestTypeDesign.backgroundColor || '#000000',
              elements: requestTypeDesign.elements || [],
              logoUrl: data.branding.logoUrl,
              removeBranding: data.branding.removeBranding
            })
          }
        } catch (e) {
          console.error('Error parsing branding data:', e)
        }
      }
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
    // Use custom fields from the database instead of hardcoded REQUEST_TYPES
    return requestData?.customFields || []
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

  const pageBackground = brandingData?.backgroundColor || theme.colors.bg.page

  return (
    <div style={{
      minHeight: '100vh',
      background: pageBackground,
      padding: '0',
      position: 'relative'
    }}>
      {/* Top Bar */}
      <div style={{
        borderBottom: `1px solid ${theme.colors.border.medium}`,
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '400',
          color: theme.colors.text.primary,
          letterSpacing: '0.02em'
        }}>
          SWAY
        </div>
        {timeRemaining && (
          <div style={{
            fontSize: '13px',
            color: timeRemaining === 'Expired' ? '#ef4444' : theme.colors.text.secondary
          }}>
            {timeRemaining}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '80px 40px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '64px'
        }}>
          <h1 style={{
            fontSize: '40px',
            fontWeight: '300',
            margin: '0 0 16px 0',
            color: theme.colors.white,
            letterSpacing: '-0.02em',
            lineHeight: '1.1'
          }}>
            {requestData.title}
          </h1>
          {requestData.description && (
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6',
              maxWidth: '560px'
            }}>
              {requestData.description}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Basic Fields */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: theme.weight.medium
            }}>
              Name
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

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: theme.weight.medium
            }}>
              Email
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
            <div key={field.id} style={{ marginBottom: '32px' }}>
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
                    transition: `all ${theme.transition.fast}`,
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.text.secondary
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.medium
                  }}
                >
                  <option value="" style={{ background: theme.colors.bg.secondary }}>Select {field.label}</option>
                  {field.options.map(opt => (
                    <option key={opt} value={opt} style={{ background: theme.colors.bg.secondary }}>{opt}</option>
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

          {/* File Upload */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: theme.weight.medium
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
                padding: '16px',
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radius.md
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.secondary,
                  marginBottom: '12px'
                }}>
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </div>
                {files.map((file, idx) => (
                  <div key={idx} style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    marginBottom: idx < files.length - 1 ? '8px' : '0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: idx < files.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none'
                  }}>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginRight: '12px',
                      color: theme.colors.text.primary
                    }}>
                      {file.name}
                    </span>
                    <span style={{
                      color: theme.colors.text.tertiary,
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
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

      {/* Render branded elements from new Branding editor */}
      {brandingData && brandingData.elements && brandingData.elements.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden'
        }}>
          {brandingData.elements.map((el, index) => {
            // Text and Heading elements
            if (el.type === 'text' || el.type === 'heading') {
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${el.fontSize}px`,
                    fontWeight: el.fontWeight,
                    color: el.color,
                    textAlign: el.align || 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {el.content}
                </div>
              )
            }

            // Button elements (can have links!)
            if (el.type === 'button') {
              const buttonContent = (
                <div
                  style={{
                    padding: `${el.paddingY}px ${el.paddingX}px`,
                    background: el.backgroundColor,
                    color: el.textColor,
                    fontSize: `${el.fontSize}px`,
                    fontWeight: el.fontWeight,
                    borderRadius: `${el.borderRadius}px`,
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                  }}
                >
                  {el.content}
                </div>
              )

              // If button has a link, wrap it in an anchor tag and enable pointer events
              if (el.link && el.link.trim()) {
                return (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'auto'  // Enable clicks for links
                    }}
                  >
                    <a
                      href={el.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {buttonContent}
                    </a>
                  </div>
                )
              }

              // Decorative button (no link)
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {buttonContent}
                </div>
              )
            }

            // Shape elements
            if (el.type === 'shape') {
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    background: el.backgroundColor,
                    borderRadius: `${el.borderRadius}px`,
                    opacity: el.opacity ?? 1
                  }}
                />
              )
            }

            // Image elements
            if (el.type === 'image' && el.url) {
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    borderRadius: `${el.borderRadius}px`,
                    opacity: el.opacity ?? 1,
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={el.url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )
            }

            return null
          })}
        </div>
      )}
    </div>
  )
}
