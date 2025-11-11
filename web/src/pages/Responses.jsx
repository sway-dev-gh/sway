import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { getStorageLimit, formatStorageDisplay, getEffectivePlan } from '../utils/planUtils'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'
import ConfirmModal from '../components/ConfirmModal'

function Responses() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
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

      setForms(requestsResponse.data.requests || [])
      setUploads(uploadsResponse.data.files || [])

      // Calculate storage
      const totalStorage = (uploadsResponse.data.files || []).reduce((sum, file) => sum + (file.fileSize || 0), 0)
      setStorageStats({ used: totalStorage / (1024 * 1024 * 1024), limit: storageLimit }) // Convert to GB
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

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

      // Refresh data after delete
      fetchData()
      // Close expanded view if it was the deleted form
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

      // Delete all selected forms
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
      // Get all uploads for selected forms
      const allUploads = selectedForms.flatMap(formId => getFormUploads(formId))

      if (allUploads.length === 0) {
        toast.info('No files to download from selected requests')
        return
      }

      // Download each file with a small delay
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
    // TODO: Add actual status logic when backend supports it
    // For now, all forms are "Live"
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

  // Analytics helper functions
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
      // Less than 0.1 per day, show per week
      const perWeek = (rate * 7).toFixed(1)
      return `${perWeek}/week`
    }

    return rate.toFixed(1) + '/day'
  }

  // Filter and sort forms
  const filteredForms = forms
    .filter(form => {
      // Search filter
      if (searchQuery && !form.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Status filter
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
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '48px 32px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '56px',
              fontWeight: '700',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.03em'
            }}>
              Tracking Insights
            </h1>
            <p style={{
              fontSize: '20px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.5'
            }}>
              Monitor all your requests, uploads, and download everything
            </p>
          </div>

          {/* Top Stats - 4 Cards with improved design */}
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            marginBottom: '48px'
          }}>
            {/* Total Forms */}
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

            {/* Live Forms */}
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

            {/* Total Uploads */}
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

            {/* Storage Used */}
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

          {/* Filter/Search Bar */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '10px 14px',
                background: '#0F0F0F',
                border: '1px solid #262626',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#404040'
                e.target.style.background = '#141414'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#262626'
                e.target.style.background = '#0F0F0F'
              }}
            />

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '10px 14px',
                background: '#0F0F0F',
                border: '1px solid #262626',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#404040'
                e.target.style.background = '#141414'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#262626'
                e.target.style.background = '#0F0F0F'
              }}
            >
              <option value="all">All Forms</option>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 14px',
                background: '#0F0F0F',
                border: '1px solid #262626',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#404040'
                e.target.style.background = '#141414'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#262626'
                e.target.style.background = '#0F0F0F'
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most-uploads">Most Uploads</option>
              <option value="name-az">Name A-Z</option>
            </select>

            {/* Bulk Actions - Show when items selected */}
            {selectedForms.length > 0 && (
              <>
                <div style={{
                  padding: '10px 14px',
                  background: '#1a1a1a',
                  border: '1px solid #404040',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {selectedForms.length} selected
                </div>
                <button
                  onClick={handleBulkDownload}
                  style={{
                    ...theme.buttons.primary.base,
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    padding: '10px 16px'
                  }}
                >
                  Download All Files
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    background: 'transparent',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    color: '#737373',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1a1a1a'
                    e.currentTarget.style.borderColor = '#404040'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = '#262626'
                    e.currentTarget.style.color = '#737373'
                  }}
                >
                  Delete Selected
                </button>
              </>
            )}

            {/* New Request Button */}
            <button
              onClick={() => navigate('/requests')}
              style={{
                ...theme.buttons.primary.base,
                fontWeight: theme.weight.semibold,
                whiteSpace: 'nowrap'
              }}
            >
              + New Request
            </button>
          </div>

          {/* Forms Table */}
          {filteredForms.length === 0 ? (
            forms.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '120px 20px',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#737373',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em'
                }}>No Requests Yet</h2>
                <p style={{
                  fontSize: '14px',
                  color: '#525252',
                  marginBottom: '32px',
                  lineHeight: '1.6'
                }}>
                  Create your first file request to start collecting files from anyone
                </p>
                <Link to="/requests">
                  <button style={{...theme.buttons.primary.base}}>
                    Create First Request
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '80px 40px',
                border: '1px solid #1a1a1a',
                borderRadius: '8px',
                background: '#0F0F0F'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#737373',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.01em'
                }}>
                  No requests match your filters
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#525252',
                  margin: '0'
                }}>
                  Try adjusting your search or filters
                </p>
              </div>
            )
          ) : (
            <div style={{
              border: '1px solid #1a1a1a',
              borderRadius: '8px',
              background: '#0F0F0F',
              overflow: 'hidden'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 2fr 100px 120px 100px 100px 140px 140px 140px',
                padding: '16px 20px',
                background: '#0a0a0a',
                borderBottom: '1px solid #1a1a1a',
                fontSize: '11px',
                fontWeight: '600',
                color: '#a3a3a3',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                alignItems: 'center'
              }}>
                <div>
                  <input
                    type="checkbox"
                    checked={filteredForms.length > 0 && selectedForms.length === filteredForms.length}
                    onChange={toggleSelectAll}
                    style={{
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer',
                      accentColor: '#fff'
                    }}
                  />
                </div>
                <div>Request</div>
                <div>Status</div>
                <div>Template</div>
                <div>Files</div>
                <div>Storage</div>
                <div>Created</div>
                <div>Last File</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {filteredForms.map((form, index) => {
                const formUploads = getFormUploads(form.id)
                const status = getFormStatus(form)
                const statusColor = getStatusColor(status)
                const storageUsed = getFormStorageUsed(form.id)
                const lastUpload = getLastUploadTime(form.id)
                const isExpanded = selectedFormId === form.id
                const isSelected = selectedForms.includes(form.id)

                return (
                  <div key={form.id}>
                    {/* Row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 2fr 100px 120px 100px 100px 140px 140px 140px',
                        padding: '16px 20px',
                        background: isSelected ? '#1a1a1a' : 'transparent',
                        borderBottom: '1px solid #1a1a1a',
                        fontSize: '14px',
                        color: '#ffffff',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#141414'
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.boxShadow = 'none'
                        }
                      }}
                      onClick={() => setSelectedFormId(isExpanded ? null : form.id)}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectForm(form.id)}
                          style={{
                            width: '14px',
                            height: '14px',
                            cursor: 'pointer',
                            accentColor: '#fff'
                          }}
                        />
                      </div>
                      <div style={{ fontWeight: '500', letterSpacing: '-0.01em' }}>{form.title}</div>
                      <div>
                        <span style={{
                          padding: '4px 8px',
                          background: '#1a1a1a',
                          color: '#ffffff',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          letterSpacing: '0.3px'
                        }}>
                          {status}
                        </span>
                      </div>
                      <div style={{ color: '#737373', fontSize: '13px' }}>Blank</div>
                      <div style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{formUploads.length}</div>
                      <div style={{ color: '#737373', fontVariantNumeric: 'tabular-nums', fontSize: '13px' }}>
                        {formatBytes(storageUsed)}
                      </div>
                      <div style={{ color: '#737373', fontSize: '13px' }}>
                        {formatDate(form.createdAt).split(',')[0]}
                      </div>
                      <div style={{ color: '#737373', fontSize: '13px' }}>
                        {lastUpload ? getTimeAgo(lastUpload) : '-'}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFormId(isExpanded ? null : form.id)
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: 'transparent',
                            border: '1px solid #262626',
                            borderRadius: '4px',
                            color: '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1a1a1a'
                            e.currentTarget.style.borderColor = '#404040'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = '#262626'
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete({ isOpen: true, formId: form.id })
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: 'transparent',
                            border: '1px solid #262626',
                            borderRadius: '4px',
                            color: '#737373',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1a1a1a'
                            e.currentTarget.style.borderColor = '#404040'
                            e.currentTarget.style.color = '#ffffff'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = '#262626'
                            e.currentTarget.style.color = '#737373'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details Panel */}
                    {isExpanded && (
                      <div style={{
                        padding: '24px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: `1px solid ${theme.colors.border.light}`
                      }}>
                        {/* Analytics Section */}
                        <div style={{ marginBottom: theme.spacing[6] }}>
                          <h3 style={{
                            fontSize: theme.fontSize.base,
                            fontWeight: theme.weight.semibold,
                            color: theme.colors.text.primary,
                            margin: '0 0 16px 0'
                          }}>
                            Analytics
                          </h3>

                          {(() => {
                            const views = getFormViews(form.shortCode)
                            const uploadCount = formUploads.length
                            const conversionRate = getConversionRate(views, uploadCount)

                            return (
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '16px',
                                marginBottom: '16px'
                              }}>
                                {/* Total Views */}
                                <div style={{
                                  padding: '16px',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: `1px solid ${theme.colors.border.light}`,
                                  borderRadius: theme.radius.md
                                }}>
                                  <div style={{
                                    fontSize: theme.fontSize.xs,
                                    color: theme.colors.text.tertiary,
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontWeight: theme.weight.semibold
                                  }}>
                                    Total Views
                                  </div>
                                  <div style={{
                                    fontSize: '28px',
                                    fontWeight: theme.weight.bold,
                                    color: theme.colors.text.primary,
                                    lineHeight: '1',
                                    fontVariantNumeric: 'tabular-nums'
                                  }}>
                                    {views === 0 ? '—' : formatNumber(views)}
                                  </div>
                                </div>

                                {/* Conversion Rate */}
                                <div style={{
                                  padding: '16px',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: `1px solid ${theme.colors.border.light}`,
                                  borderRadius: theme.radius.md
                                }}>
                                  <div style={{
                                    fontSize: theme.fontSize.xs,
                                    color: theme.colors.text.tertiary,
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontWeight: theme.weight.semibold
                                  }}>
                                    Conversion
                                  </div>
                                  <div style={{
                                    fontSize: '28px',
                                    fontWeight: theme.weight.bold,
                                    color: theme.colors.text.primary,
                                    lineHeight: '1',
                                    fontVariantNumeric: 'tabular-nums'
                                  }}>
                                    {conversionRate}
                                  </div>
                                </div>

                                {/* Upload Trend */}
                                <div style={{
                                  padding: '16px',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: `1px solid ${theme.colors.border.light}`,
                                  borderRadius: theme.radius.md
                                }}>
                                  <div style={{
                                    fontSize: theme.fontSize.xs,
                                    color: theme.colors.text.tertiary,
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontWeight: theme.weight.semibold
                                  }}>
                                    Upload Trend
                                  </div>
                                  <div style={{
                                    fontSize: '28px',
                                    fontWeight: theme.weight.bold,
                                    color: theme.colors.text.primary,
                                    lineHeight: '1',
                                    fontVariantNumeric: 'tabular-nums'
                                  }}>
                                    {getFilesPerDay(form.createdAt, formUploads)}
                                  </div>
                                </div>

                                {/* Time Since Created */}
                                <div style={{
                                  padding: '16px',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: `1px solid ${theme.colors.border.light}`,
                                  borderRadius: theme.radius.md
                                }}>
                                  <div style={{
                                    fontSize: theme.fontSize.xs,
                                    color: theme.colors.text.tertiary,
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontWeight: theme.weight.semibold
                                  }}>
                                    Age
                                  </div>
                                  <div style={{
                                    fontSize: '28px',
                                    fontWeight: theme.weight.bold,
                                    color: theme.colors.text.primary,
                                    lineHeight: '1',
                                    fontVariantNumeric: 'tabular-nums'
                                  }}>
                                    {getTimeSinceCreated(form.createdAt)}
                                  </div>
                                </div>
                              </div>
                            )
                          })()}

                          {/* Time Metrics Row */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '16px'
                          }}>
                            {/* Time to First Upload */}
                            <div style={{
                              padding: '16px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${theme.colors.border.light}`,
                              borderRadius: theme.radius.md
                            }}>
                              <div style={{
                                fontSize: theme.fontSize.xs,
                                color: theme.colors.text.tertiary,
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: theme.weight.semibold
                              }}>
                                Time to First Upload
                              </div>
                              <div style={{
                                fontSize: theme.fontSize.lg,
                                fontWeight: theme.weight.semibold,
                                color: theme.colors.text.primary,
                                lineHeight: '1.2'
                              }}>
                                {getTimeToFirstUpload(form.createdAt, formUploads)}
                              </div>
                            </div>

                            {/* Average Upload Interval */}
                            <div style={{
                              padding: '16px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${theme.colors.border.light}`,
                              borderRadius: theme.radius.md
                            }}>
                              <div style={{
                                fontSize: theme.fontSize.xs,
                                color: theme.colors.text.tertiary,
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: theme.weight.semibold
                              }}>
                                Avg Upload Interval
                              </div>
                              <div style={{
                                fontSize: theme.fontSize.lg,
                                fontWeight: theme.weight.semibold,
                                color: theme.colors.text.primary,
                                lineHeight: '1.2'
                              }}>
                                {getAverageUploadInterval(formUploads)}
                              </div>
                            </div>

                            {/* Last Upload Time */}
                            <div style={{
                              padding: '16px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${theme.colors.border.light}`,
                              borderRadius: theme.radius.md
                            }}>
                              <div style={{
                                fontSize: theme.fontSize.xs,
                                color: theme.colors.text.tertiary,
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: theme.weight.semibold
                              }}>
                                Last Upload
                              </div>
                              <div style={{
                                fontSize: theme.fontSize.lg,
                                fontWeight: theme.weight.semibold,
                                color: theme.colors.text.primary,
                                lineHeight: '1.2'
                              }}>
                                {lastUpload ? getTimeAgo(lastUpload) : '—'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 2fr',
                          gap: theme.spacing[6]
                        }}>
                          {/* Left: Form Info */}
                          <div>
                            <h3 style={{
                              fontSize: theme.fontSize.base,
                              fontWeight: theme.weight.semibold,
                              color: theme.colors.text.primary,
                              margin: '0 0 16px 0'
                            }}>
                              Form Details
                            </h3>

                            <div style={{ marginBottom: theme.spacing[4] }}>
                              <div style={{
                                fontSize: theme.fontSize.xs,
                                color: theme.colors.text.secondary,
                                marginBottom: '6px',
                                fontWeight: theme.weight.semibold
                              }}>
                                Public URL
                              </div>
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center'
                              }}>
                                <input
                                  type="text"
                                  readOnly
                                  value={`${window.location.origin}/upload/${form.shortCode}`}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: `1px solid ${theme.colors.border.light}`,
                                    borderRadius: theme.radius.sm,
                                    color: theme.colors.text.primary,
                                    fontSize: '13px',
                                    fontFamily: 'monospace'
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/upload/${form.shortCode}`)
                                    toast.success('URL copied to clipboard!')
                                  }}
                                  style={{
                                    ...theme.buttons.primary.base,
                                    padding: '8px 16px',
                                    fontSize: theme.fontSize.sm,
                                    fontWeight: theme.weight.semibold,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            <div style={{
                              padding: '16px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${theme.colors.border.light}`,
                              borderRadius: theme.radius.md
                            }}>
                              <div style={{
                                fontSize: theme.fontSize.xs,
                                fontWeight: theme.weight.semibold,
                                color: theme.colors.text.secondary,
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Quick Stats
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>Total Responses:</span>
                                  <span style={{ color: theme.colors.text.primary, fontWeight: theme.weight.semibold, fontSize: theme.fontSize.sm }}>{formUploads.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>Storage Used:</span>
                                  <span style={{ color: theme.colors.text.primary, fontWeight: theme.weight.semibold, fontSize: theme.fontSize.sm }}>{formatBytes(storageUsed)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>Avg File Size:</span>
                                  <span style={{ color: theme.colors.text.primary, fontWeight: theme.weight.semibold, fontSize: theme.fontSize.sm }}>
                                    {formUploads.length > 0 ? formatBytes(storageUsed / formUploads.length) : '-'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Upload List */}
                          <div>
                            <h3 style={{
                              fontSize: theme.fontSize.base,
                              fontWeight: theme.weight.semibold,
                              color: theme.colors.text.primary,
                              margin: '0 0 16px 0'
                            }}>
                              Uploads ({formUploads.length})
                            </h3>

                            {formUploads.length === 0 ? (
                              <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                background: 'rgba(255, 255, 255, 0.01)',
                                border: `1px solid ${theme.colors.border.light}`,
                                borderRadius: theme.radius.md,
                                color: theme.colors.text.secondary
                              }}>
                                No uploads yet for this form
                              </div>
                            ) : (
                              <div style={{
                                maxHeight: '400px',
                                overflowY: 'auto',
                                border: `1px solid ${theme.colors.border.light}`,
                                borderRadius: theme.radius.md
                              }}>
                                {formUploads.map((upload, idx) => (
                                  <div
                                    key={upload.id}
                                    style={{
                                      padding: '16px',
                                      borderBottom: idx < formUploads.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                                    }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      marginBottom: '8px'
                                    }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{
                                          fontSize: theme.fontSize.sm,
                                          fontWeight: theme.weight.medium,
                                          color: theme.colors.text.primary,
                                          marginBottom: '4px'
                                        }}>
                                          {upload.fileName}
                                        </div>
                                        <div style={{
                                          fontSize: theme.fontSize.xs,
                                          color: theme.colors.text.secondary
                                        }}>
                                          {upload.uploaderName} {upload.uploaderEmail && `(${upload.uploaderEmail})`}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDownload(upload.id)}
                                        style={{
                                          ...theme.buttons.primary.base,
                                          padding: '6px 14px',
                                          fontSize: theme.fontSize.xs,
                                          fontWeight: theme.weight.semibold,
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        Download
                                      </button>
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      gap: '16px',
                                      fontSize: theme.fontSize.xs,
                                      color: theme.colors.text.tertiary
                                    }}>
                                      <span>{formatBytes(upload.fileSize)}</span>
                                      <span>{formatDate(upload.uploadedAt)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
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

export default Responses
