import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Responses() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchResponses()
  }, [navigate])

  const fetchResponses = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.get('/api/files', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setResponses(data.files || [])
    } catch (err) {
      console.error('Failed to fetch responses:', err)
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
      a.download = responses.find(r => r.id === id)?.fileName || 'download'
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
        marginTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: theme.spacing[6]
        }}>

          {/* Header */}
          <div style={{ marginBottom: theme.spacing[6] }}>
            <h1 style={{
              fontSize: theme.fontSize.xl,
              fontWeight: '500',
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Responses
            </h1>
            <p style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              margin: '6px 0 0 0',
              lineHeight: '1.6'
            }}>
              All files uploaded to your requests
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing[3],
            marginBottom: theme.spacing[6]
          }}>
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '10px',
              padding: '20px',
              boxShadow: theme.shadows.md
            }}>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: theme.spacing[2],
                fontWeight: theme.weight.medium
              }}>
                Total Uploads
              </div>
              <div style={{
                fontSize: theme.fontSize.xl,
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                lineHeight: '1',
                marginBottom: theme.spacing[1]
              }}>
                {responses.length}
              </div>
            </div>

            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '10px',
              padding: '20px',
              boxShadow: theme.shadows.md
            }}>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: theme.spacing[2],
                fontWeight: theme.weight.medium
              }}>
                Total Size
              </div>
              <div style={{
                fontSize: theme.fontSize.xl,
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                lineHeight: '1',
                marginBottom: theme.spacing[1]
              }}>
                {formatBytes(responses.reduce((sum, r) => sum + (r.fileSize || 0), 0))}
              </div>
            </div>
          </div>

          {/* Responses Grid */}
          {responses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: theme.colors.bg.secondary,
              borderRadius: theme.radius['2xl'],
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.md
            }}>
              <h3 style={{
                fontSize: theme.fontSize.xl,
                fontWeight: theme.weight.medium,
                color: theme.colors.text.primary,
                margin: '0 0 8px 0',
                letterSpacing: '-0.02em'
              }}>
                No uploads yet
              </h3>
              <p style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.text.secondary,
                margin: '0',
                lineHeight: '1.6'
              }}>
                When someone uploads a file to your requests, it will appear here
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: theme.spacing[4],
              width: '100%'
            }}>
              {responses.map((response) => (
                <div
                  key={response.id}
                  style={{
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.xl,
                    padding: theme.spacing[6],
                    transition: `all ${theme.transition.fast}`,
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.medium
                    e.currentTarget.style.background = theme.colors.bg.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.light
                    e.currentTarget.style.background = theme.colors.bg.secondary
                  }}
                >
                  {/* Header */}
                  <div style={{
                    marginBottom: theme.spacing[5],
                    paddingBottom: theme.spacing[4],
                    borderBottom: `1px solid ${theme.colors.border.light}`
                  }}>
                    <h3 style={{
                      fontSize: theme.fontSize.lg,
                      fontWeight: theme.weight.medium,
                      color: theme.colors.text.primary,
                      margin: '0 0 4px 0',
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {response.fileName}
                    </h3>
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text.tertiary,
                      marginBottom: theme.spacing[2]
                    }}>
                      {formatBytes(response.fileSize)}
                    </div>
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text.secondary
                    }}>
                      {response.requestTitle}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing[5]
                  }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: theme.spacing[3] }}>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: theme.spacing[1]
                      }}>
                        Uploader
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing[1],
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {response.uploaderName}
                      </div>
                      {response.uploaderEmail && (
                        <div style={{
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.tertiary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {response.uploaderEmail}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: theme.spacing[1]
                      }}>
                        Uploaded
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.text.secondary
                      }}>
                        {formatDate(response.uploadedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(response.id)}
                    style={{
                      width: '100%',
                      padding: '10px 20px',
                      background: theme.colors.white,
                      color: theme.colors.black,
                      border: 'none',
                      borderRadius: theme.radius.md,
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.weight.medium,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: `opacity ${theme.transition.fast}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
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
    </>
  )
}

export default Responses
