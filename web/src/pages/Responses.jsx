import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { getStorageLimit, formatStorageDisplay, getEffectivePlan } from '../utils/planUtils'

function Responses() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [forms, setForms] = useState([])
  const [uploads, setUploads] = useState([])
  const [selectedFormId, setSelectedFormId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [storageStats, setStorageStats] = useState({ used: 0, limit: 2 })

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
      alert('Failed to download file')
    }
  }

  const handleDelete = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this request? This will also delete all uploaded files.')) {
      return
    }

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
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete request. Please try again.')
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
            gap: theme.spacing[3],
            marginBottom: theme.spacing[4],
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text.primary,
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text.primary,
                fontSize: '14px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none'
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
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text.primary,
                fontSize: '14px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most-uploads">Most Uploads</option>
              <option value="name-az">Name A-Z</option>
            </select>

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
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h3 style={{
                fontSize: theme.fontSize.lg,
                fontWeight: theme.weight.medium,
                color: theme.colors.text.primary,
                margin: '0 0 8px 0'
              }}>
                {forms.length === 0 ? 'No requests yet' : 'No requests match your filters'}
              </h3>
              <p style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                margin: '0'
              }}>
                {forms.length === 0
                  ? ''
                  : 'Try adjusting your search or filters'}
              </p>
              {forms.length !== 0 && (
                <button
                  onClick={() => navigate('/requests')}
                  style={{
                    ...theme.buttons.primary.base,
                    padding: '12px 24px',
                    fontWeight: theme.weight.semibold
                  }}
                >
                  Create First Request
                </button>
              )}
            </div>
          ) : (
            <div style={{
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              background: 'rgba(255, 255, 255, 0.02)',
              overflow: 'hidden'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 100px 120px 100px 100px 140px 140px 140px',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: `1px solid ${theme.colors.border.light}`,
                fontSize: theme.fontSize.xs,
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
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

                return (
                  <div key={form.id}>
                    {/* Row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 100px 120px 100px 100px 140px 140px 140px',
                        padding: '16px 20px',
                        background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                        borderBottom: `1px solid ${theme.colors.border.light}`,
                        fontSize: '14px',
                        color: theme.colors.text.primary,
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedFormId(isExpanded ? null : form.id)}
                    >
                      <div style={{ fontWeight: '500' }}>{form.title}</div>
                      <div>
                        <span style={{
                          padding: '4px 10px',
                          background: `${statusColor}15`,
                          color: statusColor,
                          borderRadius: theme.radius.lg,
                          fontSize: theme.fontSize.xs,
                          fontWeight: theme.weight.semibold
                        }}>
                          {status}
                        </span>
                      </div>
                      <div style={{ color: theme.colors.text.secondary }}>Blank</div>
                      <div style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{formUploads.length}</div>
                      <div style={{ color: theme.colors.text.secondary, fontVariantNumeric: 'tabular-nums' }}>
                        {formatBytes(storageUsed)}
                      </div>
                      <div style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
                        {formatDate(form.createdAt).split(',')[0]}
                      </div>
                      <div style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
                        {lastUpload ? getTimeAgo(lastUpload) : '-'}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFormId(isExpanded ? null : form.id)
                          }}
                          style={{
                            ...theme.buttons.secondary.base,
                            padding: '6px 12px',
                            fontSize: theme.fontSize.xs
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(form.id)
                          }}
                          style={{
                            ...theme.buttons.danger.base,
                            padding: '6px 12px',
                            fontSize: theme.fontSize.xs
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
                                    alert('URL copied to clipboard!')
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
    </>
  )
}

export default Responses
