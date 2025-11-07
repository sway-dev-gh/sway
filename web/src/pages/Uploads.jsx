import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

function Uploads() {
  const navigate = useNavigate()
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUploads()
  }, [])

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
      alert('Failed to download file')
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #333',
          borderTopColor: '#fff',
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
        background: '#000',
        color: '#fff',
        marginLeft: '220px'
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
              fontSize: '14px',
              color: '#666',
              margin: 0
            }}>
              All uploads across all requests
            </p>
          </div>

          {/* Uploads Table */}
          {uploads.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              border: '1px solid #333'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: 0
              }}>
                No uploads yet
              </p>
            </div>
          ) : (
            <div style={{
              border: '1px solid #333'
            }}>
              {uploads.map((upload, index) => (
                <div
                  key={upload.id}
                  style={{
                    padding: '20px',
                    borderBottom: index < uploads.length - 1 ? '1px solid #333' : 'none',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr auto',
                    gap: '20px',
                    alignItems: 'center'
                  }}
                >
                  {/* File Name */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '400',
                      marginBottom: '4px',
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'monospace'
                    }}>
                      {upload.fileName}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#666'
                    }}>
                      {(upload.fileSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>

                  {/* Uploader */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '400',
                      marginBottom: '4px',
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {upload.uploaderName}
                    </div>
                    {upload.uploaderEmail && (
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
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
                        color: '#fff',
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {upload.requestTitle}
                    </Link>
                  </div>

                  {/* Date */}
                  <div>
                    <div style={{
                      fontSize: '13px',
                      color: '#666'
                    }}>
                      {new Date(upload.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <button
                      onClick={() => downloadFile(upload.id, upload.fileName)}
                      style={{
                        padding: '8px 16px',
                        background: '#fff',
                        color: '#000',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '400',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
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
    </>
  )
}

export default Uploads
