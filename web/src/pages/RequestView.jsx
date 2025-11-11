import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'
import theme from '../theme'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'
import ConfirmModal from '../components/ConfirmModal'

function RequestView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmToggle, setConfirmToggle] = useState(false)

  const fetchRequest = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await api.get(`/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setData(response.data)
    } catch (error) {
      console.error('Error fetching request:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const copyLink = () => {
    const link = `${window.location.origin}/r/${data.request.shortCode}`
    navigator.clipboard.writeText(link)
    toast.success('Link copied!')
  }

  const handleDelete = async () => {
    setConfirmDelete(false)

    try {
      const token = localStorage.getItem('token')
      await api.delete(`/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Request deleted successfully')
      navigate('/requests')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete request')
    }
  }

  const handleToggleActive = async () => {
    setConfirmToggle(false)
    const newStatus = !data.request.isActive
    const action = newStatus ? 'reactivate' : 'close'

    try {
      const token = localStorage.getItem('token')
      await api.patch(`/api/requests/${id}/toggle-active`,
        { isActive: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      toast.success(`Request ${action}d successfully`)
      fetchRequest() // Reload the data
    } catch (error) {
      console.error('Toggle active error:', error)
      toast.error(`Failed to ${action} request`)
    }
  }

  const downloadFile = async (uploadId, filename) => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get(`/api/files/${uploadId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  }

  const downloadAll = async () => {
    if (!data.uploads || data.uploads.length === 0) {
      toast.info('No files to download')
      return
    }

    for (const upload of data.uploads) {
      await downloadFile(upload.id, upload.fileName)
      // Small delay between downloads to avoid browser blocking
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    toast.success(`Downloaded ${data.uploads.length} files`)
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

  if (!data) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: theme.colors.bg.page,
          color: theme.colors.text.primary,
          marginTop: '60px',
          padding: '80px 48px'
        }}>
          <p style={{ fontSize: '14px', color: theme.colors.text.secondary, fontWeight: '400' }}>Request not found</p>
        </div>
      </>
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
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '80px 48px 120px'
        }}>

          {/* Back Button */}
          <Link
            to="/requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: theme.colors.text.tertiary,
              textDecoration: 'none',
              marginBottom: '56px',
              fontWeight: '400',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = theme.colors.text.secondary}
            onMouseLeave={(e) => e.target.style.color = theme.colors.text.tertiary}
          >
            <span>Back to Builder</span>
          </Link>

          {/* Request Header */}
          <div style={{ marginBottom: '80px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '500',
              margin: '0 0 16px 0',
              letterSpacing: '-0.025em',
              color: theme.colors.text.primary,
              lineHeight: '1.2'
            }}>
              {data.request.title}
            </h1>
            {data.request.description && (
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                margin: '0',
                lineHeight: '1.7',
                fontWeight: '400',
                maxWidth: '600px'
              }}>
                {data.request.description}
              </p>
            )}
          </div>

          {/* Shareable Link Section */}
          <div style={{ marginBottom: '80px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: theme.colors.text.tertiary,
              marginBottom: '16px'
            }}>
              Share Link
            </div>
            <div style={{
              padding: '16px 20px',
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px'
            }}>
              <code style={{
                fontSize: '13px',
                color: theme.colors.text.secondary,
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                fontWeight: '400'
              }}>
                {window.location.origin}/r/{data.request.shortCode}
              </code>
              <button
                onClick={copyLink}
                style={{
                  padding: '7px 14px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'opacity 0.15s ease'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.85'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Request Actions */}
          <div style={{ marginBottom: '80px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: theme.colors.text.tertiary,
              marginBottom: '16px'
            }}>
              Actions
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {data.uploads && data.uploads.length > 0 && (
                <button
                  onClick={downloadAll}
                  style={{
                    padding: '7px 14px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  Download All ({data.uploads.length})
                </button>
              )}
              <button
                onClick={() => setConfirmToggle(true)}
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '5px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = theme.colors.bg.secondary}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                {data.request.isActive ? 'Close Request' : 'Reactivate Request'}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  color: theme.colors.text.tertiary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '5px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.colors.bg.secondary
                  e.target.style.color = theme.colors.text.secondary
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.color = theme.colors.text.tertiary
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Submissions Section */}
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: theme.colors.text.tertiary,
              marginBottom: '16px'
            }}>
              Submissions ({data.uploads.length})
            </div>

            {data.uploads.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 48px',
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: '6px'
              }}>
                <p style={{
                  fontSize: '13px',
                  color: theme.colors.text.tertiary,
                  margin: 0,
                  lineHeight: '1.6',
                  fontWeight: '400'
                }}>
                  No submissions yet. Share the link above to start receiving files.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {data.uploads.map((upload) => (
                  <div
                    key={upload.id}
                    style={{
                      padding: '24px',
                      background: theme.colors.bg.secondary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '24px',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.colors.border.medium}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.colors.border.light}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Uploader Info */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          marginBottom: '4px',
                          color: theme.colors.text.primary,
                          letterSpacing: '-0.01em'
                        }}>
                          {upload.uploaderName}
                        </div>
                        {upload.uploaderEmail && (
                          <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.tertiary,
                            fontWeight: '400'
                          }}>
                            {upload.uploaderEmail}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div>
                        <div style={{
                          fontSize: '12px',
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: '400'
                        }}>
                          {upload.fileName}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: theme.colors.text.tertiary,
                          fontWeight: '400'
                        }}>
                          {(upload.fileSize / 1024 / 1024).toFixed(2)} MB · {new Date(upload.uploadedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => downloadFile(upload.id, upload.fileName)}
                      style={{
                        padding: '7px 14px',
                        background: theme.colors.white,
                        color: theme.colors.black,
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'opacity 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.85'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal
        isOpen={confirmDelete}
        title="Delete Request"
        message="Delete this request? This cannot be undone and all uploads will be lost."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
      />
      <ConfirmModal
        isOpen={confirmToggle}
        title={data?.request?.isActive ? "Close Request" : "Reactivate Request"}
        message={`Are you sure you want to ${data?.request?.isActive ? 'close' : 'reactivate'} this request?`}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmToggle(false)}
        confirmText={data?.request?.isActive ? "Close" : "Reactivate"}
        cancelText="Cancel"
        danger={false}
      />
    </>
  )
}

export default RequestView
