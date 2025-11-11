import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { getStorageLimit, formatStorageDisplay, getEffectivePlan } from '../utils/planUtils'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'
import ConfirmModal from '../components/ConfirmModal'

function Management() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState({ email: '', plan: 'free' })
  const [activeTab, setActiveTab] = useState('calendar')

  // Calendar/Responses state
  const [forms, setForms] = useState([])
  const [uploads, setUploads] = useState([])
  const [selectedFormId, setSelectedFormId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [storageStats, setStorageStats] = useState({ used: 0, limit: 2 })
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, formId: null })
  const [selectedForms, setSelectedForms] = useState([])
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [dayModalOpen, setDayModalOpen] = useState(false)

  // Scheduling state
  const [scheduledRequests, setScheduledRequests] = useState([])
  const [requests, setRequests] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Load user data
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }

    fetchData()
  }, [navigate])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Use centralized plan utility
      const storageLimit = getStorageLimit()

      // Fetch forms/requests
      const requestsResponse = await api.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Fetch all uploads
      const uploadsResponse = await api.get('/api/files', {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Fetch scheduled requests
      const scheduledResponse = await api.get('/api/scheduled-requests', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { scheduled: [] } }))

      setForms(requestsResponse.data.requests || [])
      setRequests(requestsResponse.data.requests || [])
      setUploads(uploadsResponse.data.files || [])
      setScheduledRequests(scheduledResponse.data.scheduled || [])

      // Calculate storage
      const totalStorage = (uploadsResponse.data.files || []).reduce((sum, file) => sum + (file.fileSize || 0), 0)
      setStorageStats({ used: totalStorage / (1024 * 1024 * 1024), limit: storageLimit }) // Convert to GB
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calendar/Responses functions
  const handleDownload = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get(`/api/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = uploads.find(u => u.id === id)?.fileName || 'download'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to download file')
    }
  }

  const handleDelete = async () => {
    const formId = confirmDelete.formId
    setConfirmDelete({ isOpen: false, formId: null })

    try {
      const token = localStorage.getItem('token')
      await api.delete(`/api/requests/${formId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      fetchData()
      if (selectedFormId === formId) {
        setSelectedFormId(null)
      }
      toast.success('Request deleted successfully')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete request. Please try again.')
    }
  }

  const handleBulkDelete = async () => {
    setConfirmBulkDelete(false)

    try {
      const token = localStorage.getItem('token')

      await Promise.all(
        selectedForms.map(formId =>
          api.delete(`/api/requests/${formId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      )

      toast.success(`Deleted ${selectedForms.length} requests`)
      setSelectedForms([])
      fetchData()
      setSelectedFormId(null)
    } catch (err) {
      console.error('Bulk delete error:', err)
      toast.error('Failed to delete some requests')
    }
  }

  const handleBulkDownload = async () => {
    if (selectedForms.length === 0) return

    try {
      const allUploads = selectedForms.flatMap(formId => getFormUploads(formId))

      if (allUploads.length === 0) {
        toast.info('No files to download from selected requests')
        return
      }

      for (const upload of allUploads) {
        await handleDownload(upload.id)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      toast.success(`Downloaded ${allUploads.length} files from ${selectedForms.length} requests`)
    } catch (err) {
      console.error('Bulk download error:', err)
      toast.error('Failed to download some files')
    }
  }

  const toggleSelectForm = (formId) => {
    setSelectedForms(prev =>
      prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedForms.length === filteredForms.length) {
      setSelectedForms([])
    } else {
      setSelectedForms(filteredForms.map(f => f.id))
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return formatDate(date)
  }

  const getFormStatus = (form) => {
    return 'Live'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Live': return theme.colors.white
      case 'Draft': return theme.colors.text.secondary
      case 'Paused': return theme.colors.warning
      case 'Expired': return theme.colors.error
      default: return theme.colors.text.secondary
    }
  }

  const getFormUploads = (formId) => {
    return uploads.filter(upload => {
      const form = forms.find(f => f.id === formId)
      return form && upload.requestCode === form.shortCode
    })
  }

  const getFormStorageUsed = (formId) => {
    const formUploads = getFormUploads(formId)
    return formUploads.reduce((sum, upload) => sum + (upload.fileSize || 0), 0)
  }

  const getLastUploadTime = (formId) => {
    const formUploads = getFormUploads(formId)
    if (formUploads.length === 0) return null
    const latest = formUploads.reduce((latest, upload) => {
      return new Date(upload.uploadedAt) > new Date(latest.uploadedAt) ? upload : latest
    }, formUploads[0])
    return latest.uploadedAt
  }

  const getFormViews = (shortCode) => {
    const storageKey = `form_views_${shortCode}`
    return parseInt(localStorage.getItem(storageKey) || '0', 10)
  }

  const formatNumber = (num) => {
    return num.toLocaleString('en-US')
  }

  const getConversionRate = (views, uploads) => {
    if (views === 0) return '—'
    return ((uploads / views) * 100).toFixed(1) + '%'
  }

  const getTimeSinceCreated = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now - created
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day'
    if (diffDays < 30) return `${diffDays} days`

    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths === 1) return '1 month'
    if (diffMonths < 12) return `${diffMonths} months`

    const diffYears = Math.floor(diffDays / 365)
    if (diffYears === 1) return '1 year'
    return `${diffYears} years`
  }

  const getTimeToFirstUpload = (createdAt, formUploads) => {
    if (formUploads.length === 0) return '—'

    const created = new Date(createdAt)
    const firstUpload = formUploads.reduce((earliest, upload) => {
      return new Date(upload.uploadedAt) < new Date(earliest.uploadedAt) ? upload : earliest
    }, formUploads[0])

    const diffMs = new Date(firstUpload.uploadedAt) - created
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return 'Less than 1 min'
    if (diffMinutes < 60) return `${diffMinutes} min`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'}`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`
  }

  const getAverageUploadInterval = (formUploads) => {
    if (formUploads.length <= 1) return '—'

    const sortedUploads = [...formUploads].sort((a, b) =>
      new Date(a.uploadedAt) - new Date(b.uploadedAt)
    )

    const firstTime = new Date(sortedUploads[0].uploadedAt)
    const lastTime = new Date(sortedUploads[sortedUploads.length - 1].uploadedAt)
    const totalMs = lastTime - firstTime
    const avgMs = totalMs / (formUploads.length - 1)

    const avgHours = avgMs / (1000 * 60 * 60)

    if (avgHours < 1) return 'Less than 1 hour'
    if (avgHours < 24) return `${Math.floor(avgHours)} hours`

    const avgDays = Math.floor(avgHours / 24)
    return `${avgDays} day${avgDays === 1 ? '' : 's'}`
  }

  const getFilesPerDay = (createdAt, formUploads) => {
    if (formUploads.length === 0) return '—'

    const now = new Date()
    const created = new Date(createdAt)
    const diffDays = Math.max(1, Math.floor((now - created) / (1000 * 60 * 60 * 24)))
    const rate = formUploads.length / diffDays

    if (rate < 0.1) {
      const perWeek = (rate * 7).toFixed(1)
      return `${perWeek}/week`
    }

    return rate.toFixed(1) + '/day'
  }

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const getUploadsForDate = (date) => {
    return uploads.filter(upload => {
      const uploadDate = new Date(upload.uploadedAt)
      return isSameDay(uploadDate, date)
    })
  }

  const getScheduledForDate = (date) => {
    return scheduledRequests.filter(scheduled => {
      const scheduledDate = new Date(scheduled.scheduledFor)
      return isSameDay(scheduledDate, date)
    })
  }

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)

    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  const handleDayClick = (date, uploadsForDay) => {
    // Always open the modal to show uploads and/or scheduled requests
    setSelectedDate(date)
    setDayModalOpen(true)
  }

  // Scheduling functions
  const handleCreateScheduled = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)

      await api.post('/api/scheduled-requests', {
        requestId: selectedRequest,
        scheduledFor: scheduledDateTime.toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setShowCreateModal(false)
      setSelectedRequest('')
      setScheduledDate('')
      setScheduledTime('')
      fetchData()
      toast.success('Request scheduled successfully')
    } catch (error) {
      console.error('Failed to schedule request:', error)
      toast.error(error.response?.data?.message || 'Failed to schedule request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelScheduled = async (id) => {
    if (!confirm('Cancel this scheduled request?')) return

    try {
      const token = localStorage.getItem('token')
      await api.delete(`/api/scheduled-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchData()
      toast.success('Scheduled request cancelled')
    } catch (error) {
      console.error('Failed to cancel scheduled request:', error)
      toast.error('Failed to cancel scheduled request')
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getRequestTitle = (requestId) => {
    const request = requests.find(r => r._id === requestId)
    return request?.title || 'Untitled Request'
  }

  const getMinDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Filter and sort forms
  const filteredForms = forms
    .filter(form => {
      if (searchQuery && !form.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterStatus !== 'all') {
        const status = getFormStatus(form)
        if (status.toLowerCase() !== filterStatus.toLowerCase()) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'most-uploads':
          return getFormUploads(b.id).length - getFormUploads(a.id).length
        case 'name-az':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

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
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 768px) {
            .calendar-nav-mobile {
              flex-direction: column !important;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
        `}</style>
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
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '80px 32px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
              Management
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Track uploads and schedule automated requests
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{
            borderBottom: `1px solid ${theme.colors.border.light}`,
            marginBottom: '48px'
          }}>
            <div style={{
              display: 'flex',
              gap: '32px'
            }}>
              {[
                { id: 'calendar', label: 'Calendar' },
                { id: 'scheduling', label: 'Scheduling' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '14px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: activeTab === tab.id ? theme.colors.white : theme.colors.text.secondary,
                    cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    marginBottom: '-1px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.color = theme.colors.text.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.color = theme.colors.text.secondary
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Tab Content */}
          {true && (
            <>
              {/* Top Stats */}
              <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                marginBottom: '48px'
              }}>
                <div style={{
                  padding: '28px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.lg,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.tertiary,
                    marginBottom: '16px',
                    fontWeight: theme.weight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px'
                  }}>
                    Requests
                  </div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: theme.colors.text.primary,
                    lineHeight: '1',
                    marginBottom: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em'
                  }}>
                    {forms.length}
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.text.secondary,
                    fontWeight: theme.weight.medium
                  }}>
                    Total created
                  </div>
                </div>

                <div style={{
                  padding: '28px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme.colors.white}`,
                  borderRadius: theme.radius.lg,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.tertiary,
                    marginBottom: '16px',
                    fontWeight: theme.weight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px'
                  }}>
                    Live Now
                  </div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: theme.colors.white,
                    lineHeight: '1',
                    marginBottom: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em'
                  }}>
                    {forms.filter(f => getFormStatus(f) === 'Live').length}
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.text.secondary,
                    fontWeight: theme.weight.medium
                  }}>
                    Collecting files
                  </div>
                </div>

                <div style={{
                  padding: '28px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.lg,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.tertiary,
                    marginBottom: '16px',
                    fontWeight: theme.weight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px'
                  }}>
                    Files
                  </div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: theme.colors.text.primary,
                    lineHeight: '1',
                    marginBottom: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em'
                  }}>
                    {uploads.length}
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.text.secondary,
                    fontWeight: theme.weight.medium
                  }}>
                    Total received
                  </div>
                </div>

                <div style={{
                  padding: '28px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.lg,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.tertiary,
                    marginBottom: '16px',
                    fontWeight: theme.weight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px'
                  }}>
                    Storage
                  </div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: theme.colors.text.primary,
                    lineHeight: '1',
                    marginBottom: '16px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em'
                  }}>
                    {storageStats.used.toFixed(1)}
                    <span style={{ fontSize: '24px', fontWeight: '600', marginLeft: '6px', color: theme.colors.text.secondary }}>GB</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      width: `${Math.min((storageStats.used / storageStats.limit) * 100, 100)}%`,
                      height: '100%',
                      background: storageStats.used > storageStats.limit * 0.8 ? theme.colors.error : theme.colors.white,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.text.secondary,
                    fontWeight: theme.weight.medium
                  }}>
                    of {storageStats.limit} GB used
                  </div>
                </div>
              </div>


              {/* Calendar View */}
              <div style={{ marginBottom: '48px' }}>
                  <div className="calendar-nav-mobile" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <button
                      onClick={goToPreviousMonth}
                      style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        border: '1px solid #262626',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#141414'
                        e.currentTarget.style.borderColor = '#404040'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = '#262626'
                      }}
                    >
                      Previous
                    </button>

                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#ffffff',
                      margin: 0,
                      letterSpacing: '-0.02em'
                    }}>
                      {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={goToCurrentMonth}
                        style={{
                          padding: '10px 20px',
                          background: 'transparent',
                          border: '1px solid #262626',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#141414'
                          e.currentTarget.style.borderColor = '#404040'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.borderColor = '#262626'
                        }}
                      >
                        Today
                      </button>
                      <button
                        onClick={goToNextMonth}
                        style={{
                          padding: '10px 20px',
                          background: 'transparent',
                          border: '1px solid #262626',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#141414'
                          e.currentTarget.style.borderColor = '#404040'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.borderColor = '#262626'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  <div style={{
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    background: '#0F0F0F',
                    overflow: 'hidden',
                    padding: '24px'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '1px',
                      marginBottom: '16px'
                    }}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} style={{
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#737373',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '8px'
                        }}>
                          {day}
                        </div>
                      ))}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '1px',
                      background: '#262626'
                    }}>
                      {generateCalendarDays().map((date, index) => {
                        if (!date) {
                          return (
                            <div key={`empty-${index}`} style={{
                              minHeight: '60px',
                              background: '#0F0F0F'
                            }} />
                          )
                        }

                        const uploadsForDay = getUploadsForDate(date)
                        const scheduledForDay = getScheduledForDate(date)
                        const isToday = isSameDay(date, new Date())
                        const hasUploads = uploadsForDay.length > 0
                        const hasScheduled = scheduledForDay.length > 0

                        return (
                          <div
                            key={date.toISOString()}
                            onClick={() => handleDayClick(date, uploadsForDay)}
                            style={{
                              minHeight: '60px',
                              background: '#0F0F0F',
                              border: isToday ? '1px solid #ffffff' : '1px solid transparent',
                              padding: '8px',
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#141414'
                              e.currentTarget.style.borderColor = '#404040'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#0F0F0F'
                              e.currentTarget.style.borderColor = isToday ? '#ffffff' : 'transparent'
                            }}
                          >
                            <div style={{
                              fontSize: '14px',
                              color: isToday ? '#ffffff' : '#a3a3a3',
                              fontWeight: isToday ? '600' : '400'
                            }}>
                              {date.getDate()}
                            </div>
                            {hasScheduled && (
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '6px',
                                height: '6px',
                                background: '#3b82f6',
                                borderRadius: '50%'
                              }} />
                            )}
                            {hasUploads && (
                              <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: '#ffffff',
                                color: '#000000',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {uploadsForDay.length}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
              </div>


              {/* Day Modal for Calendar View */}
              {dayModalOpen && selectedDate && (
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
                    padding: '20px'
                  }}
                  onClick={() => setDayModalOpen(false)}
                >
                  <div
                    style={{
                      background: '#000000',
                      border: '1px solid #373737',
                      borderRadius: '12px',
                      maxWidth: '800px',
                      width: '100%',
                      maxHeight: '80vh',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{
                      padding: '24px',
                      borderBottom: '1px solid #373737',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#ffffff',
                        margin: 0
                      }}>
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <button
                        onClick={() => setDayModalOpen(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#737373',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          transition: 'all 0.15s ease',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1a1a1a'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#737373'
                        }}
                      >
                        Close
                      </button>
                    </div>

                    <div style={{
                      padding: '24px',
                      overflowY: 'auto',
                      flex: 1
                    }}>
                      {/* Uploads Received Section */}
                      <div style={{ marginBottom: '32px' }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#ffffff',
                          marginBottom: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Uploads Received
                        </h4>
                        {getUploadsForDate(selectedDate).length === 0 ? (
                          <div style={{
                            padding: '20px',
                            background: '#0a0a0a',
                            border: '1px solid #373737',
                            borderRadius: '8px',
                            color: '#737373',
                            fontSize: '14px',
                            textAlign: 'center'
                          }}>
                            No uploads received on this day
                          </div>
                        ) : (
                          getUploadsForDate(selectedDate).map((upload, idx) => (
                            <div
                              key={upload.id}
                              style={{
                                padding: '20px',
                                background: '#0a0a0a',
                                border: '1px solid #373737',
                                borderRadius: '8px',
                                marginBottom: idx < getUploadsForDate(selectedDate).length - 1 ? '12px' : '0'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '12px'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    marginBottom: '8px'
                                  }}>
                                    {upload.fileName}
                                  </div>
                                  <div style={{
                                    fontSize: '14px',
                                    color: '#737373',
                                    marginBottom: '4px'
                                  }}>
                                    {upload.uploaderName} {upload.uploaderEmail && `(${upload.uploaderEmail})`}
                                  </div>
                                  <div style={{
                                    fontSize: '14px',
                                    color: '#525252'
                                  }}>
                                    Request: {forms.find(f => f.shortCode === upload.requestCode)?.title || 'Unknown'}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownload(upload.id)}
                                  style={{
                                    padding: '8px 16px',
                                    background: '#ffffff',
                                    color: '#000000',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    marginLeft: '16px',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e5e5e5'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#ffffff'
                                  }}
                                >
                                  Download
                                </button>
                              </div>
                              <div style={{
                                display: 'flex',
                                gap: '20px',
                                fontSize: '14px',
                                color: '#737373',
                                paddingTop: '12px',
                                borderTop: '1px solid #373737'
                              }}>
                                <span>Size: {formatBytes(upload.fileSize)}</span>
                                <span>Time: {formatDate(upload.uploadedAt)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Scheduled Requests Section */}
                      <div>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#ffffff',
                          marginBottom: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Scheduled Requests
                        </h4>
                        {getScheduledForDate(selectedDate).length === 0 ? (
                          <div style={{
                            padding: '20px',
                            background: '#0a0a0a',
                            border: '1px solid #373737',
                            borderRadius: '8px',
                            color: '#737373',
                            fontSize: '14px',
                            textAlign: 'center'
                          }}>
                            No scheduled requests for this day
                          </div>
                        ) : (
                          getScheduledForDate(selectedDate).map((scheduled, idx) => (
                            <div
                              key={scheduled._id}
                              style={{
                                padding: '20px',
                                background: '#0a0a0a',
                                border: '1px solid #373737',
                                borderRadius: '8px',
                                marginBottom: idx < getScheduledForDate(selectedDate).length - 1 ? '12px' : '0'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    marginBottom: '8px'
                                  }}>
                                    {getRequestTitle(scheduled.requestId)}
                                  </div>
                                  <div style={{
                                    fontSize: '14px',
                                    color: '#737373',
                                    marginBottom: '8px'
                                  }}>
                                    Scheduled: {formatDateTime(scheduled.scheduledFor)}
                                  </div>
                                  <div style={{
                                    display: 'inline-block',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    padding: '4px 8px',
                                    background: '#1a1a1a',
                                    border: '1px solid #373737',
                                    borderRadius: '4px'
                                  }}>
                                    {scheduled.status || 'pending'}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                  <button
                                    onClick={() => {
                                      const request = requests.find(r => r._id === scheduled.requestId)
                                      if (request) {
                                        const url = `${window.location.origin}/upload/${request.shortCode}`
                                        navigator.clipboard.writeText(url)
                                        toast.success('Request URL copied!')
                                      }
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      background: 'transparent',
                                      color: '#ffffff',
                                      border: '1px solid #373737',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#1a1a1a'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent'
                                    }}
                                  >
                                    Copy Link
                                  </button>
                                  <button
                                    onClick={() => handleCancelScheduled(scheduled._id)}
                                    style={{
                                      padding: '6px 12px',
                                      background: 'transparent',
                                      color: '#737373',
                                      border: '1px solid #373737',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#1a1a1a'
                                      e.currentTarget.style.color = '#ffffff'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent'
                                      e.currentTarget.style.color = '#737373'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Scheduling Tab Content */}
          {true && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '32px'
              }}>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '12px 24px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: theme.weight.semibold,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e5e5'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.colors.white
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Schedule Request
                </button>
              </div>

              {scheduledRequests.length === 0 ? (
                <div style={{
                  padding: '120px 40px',
                  textAlign: 'center',
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '12px',
                  background: theme.colors.bg.card
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '24px',
                    opacity: 0.3
                  }}>

                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: theme.weight.semibold,
                    color: theme.colors.text.primary,
                    marginBottom: '12px'
                  }}>
                    No scheduled requests
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: theme.colors.text.tertiary,
                    marginBottom: '32px'
                  }}>
                    Create your first automated request to send at a specific time
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                      padding: '12px 24px',
                      background: theme.colors.white,
                      color: theme.colors.black,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: theme.weight.semibold,
                      cursor: 'pointer'
                    }}
                  >
                    Schedule Request
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {scheduledRequests.map((scheduled) => (
                    <div
                      key={scheduled._id}
                      style={{
                        padding: '24px',
                        background: theme.colors.bg.card,
                        border: `1px solid ${theme.colors.border.light}`,
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: theme.weight.semibold,
                          color: theme.colors.text.primary,
                          marginBottom: '8px'
                        }}>
                          {getRequestTitle(scheduled.requestId)}
                        </h3>
                        <div style={{
                          fontSize: '13px',
                          color: theme.colors.text.tertiary
                        }}>
                          Scheduled for {formatDateTime(scheduled.scheduledFor)}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: theme.colors.text.tertiary,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginTop: '8px',
                          display: 'inline-block',
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '4px'
                        }}>
                          {scheduled.status || 'pending'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelScheduled(scheduled._id)}
                        style={{
                          padding: '8px 16px',
                          background: 'transparent',
                          color: theme.colors.text.secondary,
                          border: `1px solid ${theme.colors.border.light}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: theme.weight.medium,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = theme.colors.border.dark
                          e.currentTarget.style.color = theme.colors.text.primary
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = theme.colors.border.light
                          e.currentTarget.style.color = theme.colors.text.secondary
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modals and other components continue... */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* Create Scheduled Request Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: theme.colors.bg.card,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: '12px',
            padding: '40px',
            width: '100%',
            maxWidth: '520px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              marginBottom: '24px'
            }}>
              Schedule Request
            </h2>

            <form onSubmit={handleCreateScheduled}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: '12px'
                }}>
                  Select Request
                </label>
                <select
                  value={selectedRequest}
                  onChange={(e) => setSelectedRequest(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.page,
                    color: theme.colors.text.primary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Choose a request...</option>
                  {requests.map((request) => (
                    <option key={request._id} value={request._id}>
                      {request.title || 'Untitled Request'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: '12px'
                }}>
                  Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={getMinDateTime()}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.page,
                    color: theme.colors.text.primary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  marginBottom: '12px'
                }}>
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.page,
                    color: theme.colors.text.primary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    color: theme.colors.text.secondary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: theme.weight.semibold,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.5 : 1
                  }}
                >
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Delete Request"
        message="Are you sure you want to delete this request? This will also delete all uploaded files."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, formId: null })}
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
      />
      <ConfirmModal
        isOpen={confirmBulkDelete}
        title="Delete Selected Requests"
        message={`Are you sure you want to delete ${selectedForms.length} selected requests? This will also delete all uploaded files.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
        confirmText="Delete All"
        cancelText="Cancel"
        danger={true}
      />
    </>
  )
}

export default Management
