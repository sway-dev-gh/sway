import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

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
      setStorageStats({ used: totalStorage / (1024 * 1024 * 1024), limit: 2 }) // Convert to GB
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
      case 'Live': return '#ffffff'
      case 'Draft': return '#6b7280'
      case 'Paused': return '#f59e0b'
      case 'Expired': return '#ef4444'
      default: return '#6b7280'
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
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
              Tracking
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Comprehensive operational dashboard for all your forms and uploads
            </p>
          </div>

          {/* Top Stats - 4 Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: theme.spacing[4],
            marginBottom: theme.spacing[7]
          }}>
            {/* Total Forms */}
            <div style={{
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Total Forms
              </div>
              <div style={{
                fontSize: '40px',
                fontWeight: '700',
                color: theme.colors.text.primary,
                lineHeight: '1',
                marginBottom: theme.spacing[1],
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {forms.length}
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary
              }}>
                All time
              </div>
            </div>

            {/* Live Forms */}
            <div style={{
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Live Forms
              </div>
              <div style={{
                fontSize: '40px',
                fontWeight: '700',
                color: '#ffffff',
                lineHeight: '1',
                marginBottom: theme.spacing[1],
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {forms.filter(f => getFormStatus(f) === 'Live').length}
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary
              }}>
                Active now
              </div>
            </div>

            {/* Total Uploads */}
            <div style={{
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Total Uploads
              </div>
              <div style={{
                fontSize: '40px',
                fontWeight: '700',
                color: theme.colors.text.primary,
                lineHeight: '1',
                marginBottom: theme.spacing[1],
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {uploads.length}
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary
              }}>
                Files received
              </div>
            </div>

            {/* Storage Used */}
            <div style={{
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Storage Used
              </div>
              <div style={{
                fontSize: '40px',
                fontWeight: '700',
                color: theme.colors.text.primary,
                lineHeight: '1',
                marginBottom: theme.spacing[2],
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {storageStats.used.toFixed(2)} GB
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: theme.colors.border.light,
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: theme.spacing[1]
              }}>
                <div style={{
                  width: `${Math.min((storageStats.used / storageStats.limit) * 100, 100)}%`,
                  height: '100%',
                  background: storageStats.used > storageStats.limit * 0.8 ? '#ef4444' : '#ffffff',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary
              }}>
                of {storageStats.limit} GB
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

            {/* New Form Button */}
            <button
              onClick={() => navigate('/requests')}
              style={{
                padding: '10px 20px',
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: theme.radius.md,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap'
              }}
            >
              + New Form
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
                {forms.length === 0 ? 'No forms yet' : 'No forms match your filters'}
              </h3>
              <p style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                margin: '0 0 20px 0'
              }}>
                {forms.length === 0
                  ? 'Create your first form in Builder to start collecting files'
                  : 'Try adjusting your search or filters'}
              </p>
              {forms.length === 0 && (
                <button
                  onClick={() => navigate('/requests')}
                  style={{
                    padding: '12px 24px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    borderRadius: theme.radius.md,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Create First Form
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
                fontSize: '12px',
                fontWeight: '600',
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <div>Form Name</div>
                <div>Status</div>
                <div>Template</div>
                <div>Responses</div>
                <div>Storage</div>
                <div>Created</div>
                <div>Last Upload</div>
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
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onClick={() => setSelectedFormId(isExpanded ? null : form.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                      }}
                    >
                      <div style={{ fontWeight: '500' }}>{form.title}</div>
                      <div>
                        <span style={{
                          padding: '4px 10px',
                          background: `${statusColor}15`,
                          color: statusColor,
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {status}
                        </span>
                      </div>
                      <div style={{ color: theme.colors.text.secondary }}>Blank</div>
                      <div style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{formUploads.length}</div>
                      <div style={{ color: theme.colors.text.secondary, fontVariantNumeric: 'tabular-nums' }}>
                        {formatBytes(storageUsed)}
                      </div>
                      <div style={{ color: theme.colors.text.secondary, fontSize: '13px' }}>
                        {formatDate(form.createdAt).split(',')[0]}
                      </div>
                      <div style={{ color: theme.colors.text.secondary, fontSize: '13px' }}>
                        {lastUpload ? getTimeAgo(lastUpload) : '-'}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFormId(isExpanded ? null : form.id)
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            color: theme.colors.text.secondary,
                            border: `1px solid ${theme.colors.border.light}`,
                            borderRadius: theme.radius.sm,
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          View
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
                              fontSize: '16px',
                              fontWeight: '600',
                              color: theme.colors.text.primary,
                              margin: '0 0 16px 0'
                            }}>
                              Form Details
                            </h3>

                            <div style={{ marginBottom: theme.spacing[4] }}>
                              <div style={{
                                fontSize: '12px',
                                color: theme.colors.text.secondary,
                                marginBottom: '6px',
                                fontWeight: '600'
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
                                    padding: '8px 16px',
                                    background: theme.colors.white,
                                    color: theme.colors.black,
                                    border: 'none',
                                    borderRadius: theme.radius.sm,
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
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
                                fontSize: '12px',
                                fontWeight: '600',
                                color: theme.colors.text.secondary,
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Quick Stats
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: theme.colors.text.secondary, fontSize: '14px' }}>Total Responses:</span>
                                  <span style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '14px' }}>{formUploads.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: theme.colors.text.secondary, fontSize: '14px' }}>Storage Used:</span>
                                  <span style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '14px' }}>{formatBytes(storageUsed)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: theme.colors.text.secondary, fontSize: '14px' }}>Avg File Size:</span>
                                  <span style={{ color: theme.colors.text.primary, fontWeight: '600', fontSize: '14px' }}>
                                    {formUploads.length > 0 ? formatBytes(storageUsed / formUploads.length) : '-'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Upload List */}
                          <div>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '600',
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
                                          fontSize: '14px',
                                          fontWeight: '500',
                                          color: theme.colors.text.primary,
                                          marginBottom: '4px'
                                        }}>
                                          {upload.fileName}
                                        </div>
                                        <div style={{
                                          fontSize: '12px',
                                          color: theme.colors.text.secondary
                                        }}>
                                          {upload.uploaderName} {upload.uploaderEmail && `(${upload.uploaderEmail})`}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDownload(upload.id)}
                                        style={{
                                          padding: '6px 14px',
                                          background: theme.colors.white,
                                          color: theme.colors.black,
                                          border: 'none',
                                          borderRadius: theme.radius.sm,
                                          fontSize: '12px',
                                          fontWeight: '600',
                                          cursor: 'pointer',
                                          fontFamily: 'inherit',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        Download
                                      </button>
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      gap: '16px',
                                      fontSize: '12px',
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
