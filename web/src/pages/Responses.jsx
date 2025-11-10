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
          <div style={{ marginBottom: theme.spacing[6], textAlign: 'center' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '600',
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              Responses
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: '12px 0 0 0',
              lineHeight: '1.6'
            }}>
              All files uploaded to your requests
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing[4],
            marginBottom: theme.spacing[7],
            width: '100%'
          }}>
            <div style={{
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg
            }}>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[3],
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Total Uploads
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '700',
                color: theme.colors.text.primary,
                lineHeight: '1',
                marginBottom: theme.spacing[2],
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {responses.length}
              </div>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.tertiary
              }}>
                Files received
              </div>
            </div>

            <div style={{
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg
            }}>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[3],
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Storage Used
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '700',
                color: theme.colors.text.primary,
                lineHeight: '1',
                marginBottom: theme.spacing[2],
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {formatBytes(responses.reduce((sum, r) => sum + (r.fileSize || 0), 0))}
              </div>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.tertiary
              }}>
                Across all uploads
              </div>
            </div>
          </div>

          {/* Responses Grid */}
          {responses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg
            }}>
              <h3 style={{
                fontSize: theme.fontSize.lg,
                fontWeight: theme.weight.medium,
                color: theme.colors.text.primary,
                margin: '0 0 8px 0'
              }}>
                No uploads yet
              </h3>
              <p style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                margin: 0
              }}>
                When someone uploads a file to your requests, it will appear here
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: theme.spacing[4],
              width: '100%'
            }}>
              {responses.map((response) => (
                <div
                  key={response.id}
                  style={{
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing[5],
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.medium
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.light
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  {/* File Name */}
                  <h3 style={{
                    fontSize: theme.fontSize.base,
                    fontWeight: theme.weight.medium,
                    color: theme.colors.text.primary,
                    margin: `0 0 ${theme.spacing[3]}`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {response.fileName}
                  </h3>

                  {/* File Size & Request */}
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing[4]
                  }}>
                    {formatBytes(response.fileSize)} • {response.requestTitle}
                  </div>

                  {/* Uploader Name */}
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing[1]
                  }}>
                    {response.uploaderName}
                  </div>

                  {/* Uploader Email */}
                  {response.uploaderEmail && (
                    <div style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.text.tertiary,
                      marginBottom: theme.spacing[4],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {response.uploaderEmail}
                    </div>
                  )}

                  {/* Date */}
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.tertiary,
                    marginBottom: theme.spacing[5]
                  }}>
                    {formatDate(response.uploadedAt)}
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(response.id)
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      background: theme.colors.white,
                      color: theme.colors.black,
                      border: 'none',
                      borderRadius: theme.radius.md,
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.weight.medium,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
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
