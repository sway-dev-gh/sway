import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

function RequestView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequest()
  }, [id])

  const fetchRequest = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch(`/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching request:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    const link = `${window.location.origin}/r/${data.request.shortCode}`
    navigator.clipboard.writeText(link)
    alert('Link copied!')
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

  if (!data) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: '#000',
          color: '#fff',
          marginLeft: '220px',
          padding: '60px 40px'
        }}>
          <p style={{ fontSize: '14px', color: '#666' }}>Request not found</p>
        </div>
      </>
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

          {/* Back Button */}
          <Link
            to="/requests"
            style={{
              display: 'inline-block',
              fontSize: '14px',
              color: '#666',
              textDecoration: 'none',
              marginBottom: '40px'
            }}
          >
            ← Back to Requests
          </Link>

          {/* Request Header */}
          <div style={{ marginBottom: '60px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: '0 0 12px 0',
              letterSpacing: '-0.01em'
            }}>
              {data.request.title}
            </h1>
            {data.request.description && (
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: '0 0 24px 0',
                lineHeight: '1.6'
              }}>
                {data.request.description}
              </p>
            )}

            {/* Shareable Link */}
            <div style={{
              marginTop: '24px',
              padding: '20px',
              border: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <code style={{
                fontSize: '13px',
                color: '#ccc',
                fontFamily: 'monospace'
              }}>
                {window.location.origin}/r/{data.request.shortCode}
              </code>
              <button
                onClick={copyLink}
                style={{
                  padding: '8px 16px',
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '400',
                  cursor: 'pointer'
                }}
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Uploads Section */}
          <div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '400',
              margin: '0 0 20px 0',
              letterSpacing: '-0.01em'
            }}>
              Uploads ({data.uploads.length})
            </h2>

            {data.uploads.length === 0 ? (
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
                  No uploads yet. Share the link above to start receiving files.
                </p>
              </div>
            ) : (
              <div style={{
                border: '1px solid #333'
              }}>
                {data.uploads.map((upload, index) => (
                  <div
                    key={upload.id}
                    style={{
                      padding: '20px',
                      borderBottom: index < data.uploads.length - 1 ? '1px solid #333' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '400',
                        marginBottom: '4px',
                        color: '#fff'
                      }}>
                        {upload.uploaderName}
                      </div>
                      {upload.uploaderEmail && (
                        <div style={{
                          fontSize: '13px',
                          color: '#666',
                          marginBottom: '8px'
                        }}>
                          {upload.uploaderEmail}
                        </div>
                      )}
                      <div style={{
                        fontSize: '13px',
                        color: '#ccc',
                        marginBottom: '4px',
                        fontFamily: 'monospace'
                      }}>
                        {upload.fileName}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        {(upload.fileSize / 1024 / 1024).toFixed(2)} MB · {new Date(upload.uploadedAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => downloadFile(upload.id, upload.fileName)}
                      style={{
                        padding: '8px 16px',
                        background: '#fff',
                        color: '#000',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '400',
                        cursor: 'pointer'
                      }}
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
    </>
  )
}

export default RequestView
