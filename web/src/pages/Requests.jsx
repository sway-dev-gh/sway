import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

const CACHE_VERSION = '2.0.1'

const REQUEST_TYPES = [
  {
    id: 'general-upload',
    name: 'General Upload',
    description: 'Simple file collection',
    titleLabel: 'Request Title',
    descriptionLabel: 'Instructions (optional)',
    fields: [],
    planRequired: 'free'
  },
  {
    id: 'photos',
    name: 'Photos',
    description: 'Collect images',
    titleLabel: 'Event or Shoot Name',
    descriptionLabel: 'Photo Guidelines (optional)',
    fields: [
      { id: 'resolution', label: 'Preferred Resolution', type: 'select', options: ['Any', '4K', '1080p', '720p'] },
      { id: 'count', label: 'Expected Number of Photos', type: 'number', placeholder: 'e.g., 10' }
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
    id: 'code-submission',
    name: 'Code',
    description: 'Code files or repositories',
    titleLabel: 'Project or Assignment Name',
    descriptionLabel: 'Code Submission Instructions (optional)',
    fields: [
      { id: 'language', label: 'Programming Language', type: 'text', placeholder: 'e.g., JavaScript, Python, Java' },
      { id: 'repo', label: 'GitHub/GitLab URL (optional)', type: 'text', placeholder: 'https://github.com/...' }
    ],
    planRequired: 'pro'
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
    planRequired: 'pro'
  },
  {
    id: 'event-photos',
    name: 'Event Photos',
    description: 'Photos from events',
    titleLabel: 'Event Name',
    descriptionLabel: 'Photo Instructions (optional)',
    fields: [
      { id: 'eventDate', label: 'Event Date', type: 'date' },
      { id: 'photoCount', label: 'Expected Number of Photos', type: 'number', placeholder: 'e.g., 20' }
    ],
    planRequired: 'free'
  },
  {
    id: 'application-materials',
    name: 'Applications',
    description: 'Resumes, portfolios',
    titleLabel: 'Position Title',
    descriptionLabel: 'Application Requirements (optional)',
    fields: [
      { id: 'position', label: 'Position Applying For', type: 'text', placeholder: 'e.g., Software Engineer' },
      { id: 'deadline', label: 'Application Deadline', type: 'date' }
    ],
    planRequired: 'free'
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
    id: 'client-deliverables',
    name: 'Deliverables',
    description: 'Final work files',
    titleLabel: 'Project or Client Name',
    descriptionLabel: 'Deliverable Requirements (optional)',
    fields: [
      { id: 'projectName', label: 'Project Name', type: 'text', placeholder: 'e.g., Website Redesign' },
      { id: 'dueDate', label: 'Due Date', type: 'date' }
    ],
    planRequired: 'pro'
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
    id: 'content',
    name: 'Content',
    description: 'Articles, written content',
    titleLabel: 'Content Project Name',
    descriptionLabel: 'Content Requirements (optional)',
    fields: [
      { id: 'contentType', label: 'Content Type', type: 'select', options: ['Article', 'Blog Post', 'Script', 'Copy', 'Other'] },
      { id: 'wordCount', label: 'Target Word Count', type: 'number', placeholder: 'e.g., 1000' }
    ],
    planRequired: 'pro'
  },
  {
    id: 'assignments',
    name: 'Assignments',
    description: 'Homework, projects',
    titleLabel: 'Assignment Name',
    descriptionLabel: 'Submission Instructions (optional)',
    fields: [
      { id: 'course', label: 'Course Name', type: 'text', placeholder: 'e.g., CS 101' },
      { id: 'dueDate', label: 'Due Date', type: 'date' }
    ],
    planRequired: 'free'
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
    id: 'spreadsheets',
    name: 'Spreadsheets',
    description: 'Excel, CSV data',
    titleLabel: 'Spreadsheet Collection Name',
    descriptionLabel: 'Data Guidelines (optional)',
    fields: [
      { id: 'dataType', label: 'Data Type', type: 'text', placeholder: 'e.g., Sales Data, Customer List' },
      { id: 'rowCount', label: 'Expected Rows (optional)', type: 'number', placeholder: 'e.g., 500' }
    ],
    planRequired: 'free'
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
    id: 'legal',
    name: 'Legal Docs',
    description: 'Legal forms',
    titleLabel: 'Legal Document Name',
    descriptionLabel: 'Document Instructions (optional)',
    fields: [
      { id: 'documentType', label: 'Document Type', type: 'text', placeholder: 'e.g., Power of Attorney' },
      { id: 'jurisdiction', label: 'Jurisdiction', type: 'text', placeholder: 'e.g., California' }
    ],
    planRequired: 'pro'
  },
  {
    id: 'id-verification',
    name: 'ID Verification',
    description: 'Identification docs',
    titleLabel: 'Verification Purpose',
    descriptionLabel: 'ID Requirements (optional)',
    fields: [
      { id: 'idType', label: 'ID Type', type: 'select', options: ['Passport', 'Driver License', 'State ID', 'Other'] },
      { id: 'country', label: 'Country', type: 'text', placeholder: 'e.g., USA' }
    ],
    planRequired: 'pro'
  },
  {
    id: 'medical',
    name: 'Medical Records',
    description: 'Health documentation',
    titleLabel: 'Medical Record Request Name',
    descriptionLabel: 'Record Guidelines (optional)',
    fields: [
      { id: 'recordType', label: 'Record Type', type: 'select', options: ['Lab Results', 'Prescription', 'X-Ray/Imaging', 'Medical History', 'Other'] },
      { id: 'dateOfService', label: 'Date of Service', type: 'date' }
    ],
    planRequired: 'pro'
  },
  {
    id: 'tax-documents',
    name: 'Tax Docs',
    description: 'W2s, 1099s',
    titleLabel: 'Tax Document Collection',
    descriptionLabel: 'Submission Guidelines (optional)',
    fields: [
      { id: 'taxYear', label: 'Tax Year', type: 'number', placeholder: 'e.g., 2024' },
      { id: 'docType', label: 'Document Type', type: 'select', options: ['W2', '1099', '1040', 'Receipt', 'Other'] }
    ],
    planRequired: 'pro'
  },
  {
    id: 'property',
    name: 'Property Photos',
    description: 'Real estate images',
    titleLabel: 'Property Address or Name',
    descriptionLabel: 'Photo Requirements (optional)',
    fields: [
      { id: 'propertyType', label: 'Property Type', type: 'select', options: ['House', 'Apartment', 'Commercial', 'Land', 'Other'] },
      { id: 'photoCount', label: 'Expected Number of Photos', type: 'number', placeholder: 'e.g., 25' }
    ],
    planRequired: 'pro'
  },
  {
    id: 'products',
    name: 'Product Images',
    description: 'E-commerce photos',
    titleLabel: 'Product Line or SKU',
    descriptionLabel: 'Image Specifications (optional)',
    fields: [
      { id: 'productCategory', label: 'Product Category', type: 'text', placeholder: 'e.g., Electronics, Clothing' },
      { id: 'backgroundType', label: 'Background', type: 'select', options: ['White', 'Transparent', 'Lifestyle', 'Any'] }
    ],
    planRequired: 'pro'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Promotional content',
    titleLabel: 'Campaign Name',
    descriptionLabel: 'Asset Requirements (optional)',
    fields: [
      { id: 'campaignName', label: 'Campaign Name', type: 'text', placeholder: 'e.g., Spring Sale 2024' },
      { id: 'platform', label: 'Platform', type: 'select', options: ['Email', 'Social Media', 'Print', 'Digital Ads', 'All'] }
    ],
    planRequired: 'pro'
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Posts, stories',
    titleLabel: 'Content Campaign Name',
    descriptionLabel: 'Posting Guidelines (optional)',
    fields: [
      { id: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'LinkedIn', 'Multiple'] },
      { id: 'contentType', label: 'Content Type', type: 'select', options: ['Post', 'Story', 'Reel', 'Video', 'Image'] }
    ],
    planRequired: 'pro'
  },
  {
    id: 'surveys',
    name: 'Surveys',
    description: 'Survey responses',
    titleLabel: 'Survey Name',
    descriptionLabel: 'Survey Instructions (optional)',
    fields: [
      { id: 'surveyName', label: 'Survey Name', type: 'text', placeholder: 'e.g., Customer Satisfaction' },
      { id: 'expectedResponses', label: 'Expected Responses', type: 'number', placeholder: 'e.g., 100' }
    ],
    planRequired: 'free'
  },
  {
    id: 'research',
    name: 'Research Data',
    description: 'Research findings',
    titleLabel: 'Research Project Name',
    descriptionLabel: 'Data Requirements (optional)',
    fields: [
      { id: 'researchTopic', label: 'Research Topic', type: 'text', placeholder: 'e.g., Climate Change Impact' },
      { id: 'dataFormat', label: 'Data Format', type: 'select', options: ['CSV', 'JSON', 'Excel', 'PDF', 'Other'] }
    ],
    planRequired: 'pro'
  },
  {
    id: 'screenshots',
    name: 'Screenshots',
    description: 'Proof, verification images',
    titleLabel: 'Screenshot Collection Name',
    descriptionLabel: 'Screenshot Guidelines (optional)',
    fields: [
      { id: 'purpose', label: 'Purpose', type: 'text', placeholder: 'e.g., Bug Report, Tutorial' },
      { id: 'count', label: 'Expected Number', type: 'number', placeholder: 'e.g., 5' }
    ],
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

  useEffect(() => {
    fetchRequests()
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      const plan = userData.plan || 'free'
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
        customFields: formData.customFields || {}
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
          maxWidth: '1400px',
          margin: '0 auto',
          padding: theme.spacing[12]
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
                fontSize: '28px',
                fontWeight: '500',
                margin: 0,
                color: theme.colors.text.primary,
                letterSpacing: '-0.02em'
              }}>
                Requests
              </h1>
              <p style={{
                fontSize: '15px',
                color: theme.colors.text.secondary,
                margin: '12px 0 0 0',
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
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
                                height: '40px'
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
                  fontSize: '20px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  margin: '0 0 12px 0'
                }}>
                  No requests yet
                </h3>
                <p style={{
                  fontSize: '15px',
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
                  gridTemplateColumns: '2fr 1fr 100px 140px 220px',
                  padding: theme.spacing[6],
                  borderBottom: `1px solid ${theme.colors.border.light}`,
                  background: theme.colors.bg.secondary
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: theme.weight.medium
                  }}>
                    Title
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: theme.weight.medium
                  }}>
                    Type
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: theme.weight.medium,
                    textAlign: 'center'
                  }}>
                    Files
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: theme.weight.medium
                  }}>
                    Created
                  </div>
                  <div style={{
                    fontSize: '12px',
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
                        gridTemplateColumns: '2fr 1fr 100px 140px 220px',
                        padding: theme.spacing[6],
                        borderBottom: index < requests.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                        transition: `background ${theme.transition.fast}`,
                        cursor: 'pointer',
                        alignItems: 'center'
                      }}
                      onClick={() => navigate(`/requests/${req.id}`)}


                                      >
                      {/* Title */}
                      <div style={{
                        fontSize: '15px',
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
                        fontSize: '14px',
                        color: theme.colors.text.secondary
                      }}>
                        {req.requestType ? req.requestType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'General Upload'}
                      </div>

                      {/* File Count */}
                      <div style={{
                        fontSize: '14px',
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium,
                        textAlign: 'center'
                      }}>
                        {req.uploadCount || 0}
                      </div>

                      {/* Created Date */}
                      <div style={{
                        fontSize: '14px',
                        color: theme.colors.text.secondary
                      }}>
                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      {/* Actions */}
                      <div style={{
                        display: 'flex',
                        gap: theme.spacing[2],
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/requests/${req.id}`)
                          }}
                          style={{
                            padding: '10px 20px',
                            background: theme.colors.white,
                            color: theme.colors.black,
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                                                        height: '36px'
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
                            padding: '10px 20px',
                            background: 'transparent',
                            color: theme.colors.text.secondary,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: theme.weight.medium,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                                                        height: '36px'
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
                  boxShadow: theme.shadows.glowStrong
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
                    fontSize: '20px',
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
                      fontSize: '24px',
                      color: theme.colors.text.muted,
                      cursor: 'pointer',
                      padding: '4px 8px',
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
                      fontSize: '15px',
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
                      fontSize: '14px',
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
                          fontSize: '14px',
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
                          fontSize: '14px',
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
                          fontSize: '14px',
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
                        fontSize: '14px',
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
                          const planLevels = { 'free': 0, 'pro': 1 }
                          const isLocked = planLevels[userPlan] < planLevels[type.planRequired]

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
                                fontSize: '14px',
                                fontWeight: '500',
                                color: theme.colors.text.primary,
                                marginBottom: theme.spacing[1]
                              }}>
                                {type.name}
                              </div>
                              <div style={{
                                fontSize: '12px',
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
                          fontSize: '13px',
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
                          fontSize: '14px',
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
                              fontSize: '13px',
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
                          fontSize: '13px',
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
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                          placeholder={`Enter ${REQUEST_TYPES.find(t => t.id === requestType)?.titleLabel?.toLowerCase() || 'title'}`}
                        />
                      </div>

                      <div style={{ marginBottom: theme.spacing[6] }}>
                        <label style={{
                          display: 'block',
                          fontSize: '13px',
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
                            fontSize: '14px',
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
                                  padding: '12px 16px',
                                  background: theme.colors.bg.page,
                                  border: `1px solid ${theme.colors.border.medium}`,
                                  borderRadius: '10px',
                                  color: theme.colors.text.primary,
                                  fontSize: '14px',
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
                                  fontSize: '14px',
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
                                  fontSize: '14px',
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
                          fontSize: '13px',
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
                              borderRadius: '10px',
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
                                borderRadius: '10px',
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
                            fontSize: '14px',
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
                            fontSize: '14px',
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
              boxShadow: theme.shadows.glowStrong
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
              fontSize: '15px',
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
                  fontSize: '15px',
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
                  fontSize: '15px',
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
      `}</style>
    </>
  )
}

export default Requests
