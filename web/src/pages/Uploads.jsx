import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

function Uploads() {
  const navigate = useNavigate()
  const toast = useToast()
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUploads = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const requests = data.requests || []

        // Fetch all uploads for each request
        const uploadPromises = requests.map(async (request) => {
          const res = await fetch(`/api/requests/${request.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const requestData = await res.json()
            return (requestData.uploads || []).map(upload => ({
              ...upload,
              requestTitle: request.title,
              requestId: request.id
            }))
          }
          return []
        })

        const uploadArrays = await Promise.all(uploadPromises)
        const allUploads = uploadArrays.flat()

        // Sort by upload date (newest first)
        allUploads.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))

        setUploads(allUploads)
      }
    } catch (err) {
      console.error('Failed to fetch uploads:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUploads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const downloadFile = async (uploadId, filename) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/files/${uploadId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
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
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '60px 40px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: '0 0 8px 0',
              letterSpacing: '-0.01em'
            }}>
              Uploads
            </h1>
            <p style={{
              fontSize: '20px',
              color: theme.colors.text.secondary,
              margin: 0
            }}>
              All uploads across all requests
            </p>
          </div>

          {/* Uploads Table */}
          {uploads.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '120px 40px',
              border: '1px solid #1a1a1a',
              borderRadius: '8px',
              background: '#0F0F0F'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#737373',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                No uploads yet
              </h3>
            </div>
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
                gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr auto',
                gap: '24px',
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
                <div>File</div>
                <div>Uploader</div>
                <div>Request</div>
                <div>Date</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {uploads.map((upload, index) => (
                <div
                  key={upload.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: index < uploads.length - 1 ? '1px solid #1a1a1a' : 'none',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr auto',
                    gap: '24px',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#141414'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* File Name */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'monospace',
                      letterSpacing: '-0.01em'
                    }}>
                      {upload.fileName}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#737373'
                    }}>
                      {(upload.fileSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>

                  {/* Uploader */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.01em'
                    }}>
                      {upload.uploaderName}
                    </div>
                    {upload.uploaderEmail && (
                      <div style={{
                        fontSize: '12px',
                        color: '#737373',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {upload.uploaderEmail}
                      </div>
                    )}
                  </div>

                  {/* Request */}
                  <div style={{ minWidth: 0 }}>
                    <Link
                      to={`/requests/${upload.requestId}`}
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#ffffff',
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        letterSpacing: '-0.01em',
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#a3a3a3'}
                      onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                    >
                      {upload.requestTitle}
                    </Link>
                  </div>

                  {/* Date */}
                  <div>
                    <div style={{
                      fontSize: '13px',
                      color: '#737373'
                    }}>
                      {new Date(upload.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <button
                      onClick={() => downloadFile(upload.id, upload.fileName)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: 'transparent',
                        border: '1px solid #262626',
                        borderRadius: '4px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
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
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </>
  )
}

export default Uploads
