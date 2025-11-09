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

      // Process simplified branding data if available
      if (data.branding) {
        setBrandingData({
          backgroundColor: data.branding.background_color || '#FFFFFF',
          logoUrl: data.branding.logo_url,
          removeBranding: data.branding.remove_branding ?? true
        })
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
    const customFields = requestData?.customFields

    // Ensure customFields is always an array
    if (!customFields) return []
    if (Array.isArray(customFields)) return customFields

    // If customFields is an object (legacy format), convert to empty array
    return []
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
        padding: '40px'
      }}>
        <div style={{
          maxWidth: '800px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: theme.colors.bg.secondary,
            border: `3px solid ${theme.colors.white}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '80px',
            margin: '0 auto 48px auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: '64px',
            fontWeight: theme.weight.bold,
            margin: '0 0 28px 0',
            color: theme.colors.white,
            letterSpacing: '-0.03em',
            lineHeight: '1.0'
          }}>
            Files Uploaded Successfully
          </h2>
          <p style={{
            fontSize: '22px',
            color: theme.colors.text.secondary,
            margin: 0,
            lineHeight: '1.7'
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
        {brandingData?.logoUrl ? (
          <img src={brandingData.logoUrl} alt="Logo" style={{ maxHeight: '40px', maxWidth: '200px' }} />
        ) : (
          <div style={{
            fontSize: '16px',
            fontWeight: '400',
            color: theme.colors.text.primary,
            letterSpacing: '0.02em'
          }}>
            SWAY
          </div>
        )}
        {timeRemaining && (
          <div style={{
            fontSize: '13px',
            color: timeRemaining === 'Expired' ? '#ef4444' : theme.colors.text.secondary
          }}>
            {timeRemaining}
          </div>
        )}
      </div>

      {/* Main Content - ULTRA SPACIOUS */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '80px 40px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header - ULTRA NEXT LEVEL */}
        <div style={{
          textAlign: 'center',
          marginBottom: '80px'
        }}>
          <h1 style={{
            fontSize: '80px',
            fontWeight: theme.weight.bold,
            margin: '0 0 32px 0',
            color: theme.colors.white,
            letterSpacing: '-0.04em',
            lineHeight: '1.0'
          }}>
            {requestData.title}
          </h1>
          {requestData.description && (
            <p style={{
              fontSize: '20px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.7',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              {requestData.description}
            </p>
          )}
        </div>

        {/* Form Card - PREMIUM SPACING */}
        <div style={{
          background: theme.colors.bg.secondary,
          borderRadius: '32px',
          border: `2px solid ${theme.colors.border.light}`,
          boxShadow: theme.shadows.xl,
          padding: '60px'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Basic Fields */}
            <div style={{ marginBottom: theme.spacing[6] }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
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
                  height: '44px',
                  padding: '0 16px',
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.text.primary,
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                                  }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.white
                  e.currentTarget.style.background = theme.colors.bg.secondary
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                  e.currentTarget.style.background = theme.colors.bg.page
                }}
              />
            </div>

            <div style={{ marginBottom: theme.spacing[8] }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
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
                  height: '44px',
                  padding: '0 16px',
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.text.primary,
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                                  }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.white
                  e.currentTarget.style.background = theme.colors.bg.secondary
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                  e.currentTarget.style.background = theme.colors.bg.page
                }}
              />
            </div>

            {/* Custom Fields */}
            {customFields.map((field, index) => (
              <div key={field.id} style={{ marginBottom: index === customFields.length - 1 ? theme.spacing[8] : theme.spacing[6] }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[2],
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
                      height: '44px',
                      padding: '0 16px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: theme.radius.md,
                      color: theme.colors.text.primary,
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      outline: 'none',
                                            cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.white
                      e.currentTarget.style.background = theme.colors.bg.secondary
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.border.medium
                      e.currentTarget.style.background = theme.colors.bg.page
                    }}
                  >
                    <option value="" style={{ background: theme.colors.bg.page }}>Select {field.label}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt} style={{ background: theme.colors.bg.page }}>{opt}</option>
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
                      height: '44px',
                      padding: '0 16px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: theme.radius.md,
                      color: theme.colors.text.primary,
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      outline: 'none',
                                          }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.white
                      e.currentTarget.style.background = theme.colors.bg.secondary
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.border.medium
                      e.currentTarget.style.background = theme.colors.bg.page
                    }}
                  />
                )}
              </div>
            ))}

            {/* File Upload - ULTRA NEXT LEVEL */}
            <div style={{ marginBottom: '60px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                color: theme.colors.text.secondary,
                marginBottom: '28px',
                fontWeight: theme.weight.bold,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                Upload Files
              </label>
              <label style={{
                display: 'block',
                padding: '120px 80px',
                background: theme.colors.bg.page,
                border: `4px dashed ${theme.colors.border.dark}`,
                borderRadius: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: `all ${theme.transition.base}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.white
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.transform = 'scale(1.01)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border.dark
                e.currentTarget.style.background = theme.colors.bg.page
                e.currentTarget.style.transform = 'scale(1)'
              }}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  required
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  fontSize: '96px',
                  marginBottom: '32px',
                  color: theme.colors.white,
                  lineHeight: '1'
                }}>
                  ↑
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: theme.weight.bold,
                  color: theme.colors.text.primary,
                  marginBottom: '16px',
                  letterSpacing: '-0.02em'
                }}>
                  Click to browse or drag files here
                </div>
                <div style={{
                  fontSize: '17px',
                  color: theme.colors.text.tertiary
                }}>
                  Multiple files supported
                </div>
              </label>
              {files.length > 0 && (
                <div style={{
                  marginTop: theme.spacing[8]
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: theme.weight.semibold,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing[5],
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </div>
                  <div style={{
                    display: 'grid',
                    gap: theme.spacing[3]
                  }}>
                    {files.map((file, idx) => (
                      <div key={idx} style={{
                        padding: theme.spacing[6],
                        background: theme.colors.bg.secondary,
                        border: `1px solid ${theme.colors.border.light}`,
                        borderRadius: theme.radius.xl,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: theme.shadows.sm
                      }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginRight: theme.spacing[4]
                        }}>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: theme.weight.medium,
                            color: theme.colors.text.primary,
                            marginBottom: theme.spacing[1]
                          }}>
                            {file.name}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: theme.colors.text.tertiary
                          }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: theme.radius.lg,
                          background: theme.colors.bg.page,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          color: theme.colors.white,
                          flexShrink: 0
                        }}>
                          📄
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button - NEXT LEVEL */}
            <button
              type="submit"
              disabled={uploading}
              style={{
                width: '100%',
                height: '64px',
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: theme.radius.xl,
                fontSize: '17px',
                fontWeight: theme.weight.bold,
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: uploading ? 0.6 : 1,
                boxShadow: uploading ? 'none' : theme.shadows.lg,
                transition: `all ${theme.transition.base}`,
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => !uploading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !uploading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </form>
        </div>
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
