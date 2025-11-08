import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Files() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const { data } = await api.get('/api/files', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
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
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '60px 40px'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: 0,
              color: theme.colors.text.primary
            }}>
              Files
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              View all uploaded files across all requests
            </p>
          </div>

          {/* Files List - Modern 2025 Style */}
          {files.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '120px 40px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <div style={{
                fontSize: '16px',
                marginBottom: '12px',
                color: theme.colors.text.muted
              }}>
                No files yet
              </div>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.tertiary,
                lineHeight: '1.5'
              }}>
                Files uploaded to your requests will appear here
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              {files.map((file) => (
                <div
                  key={file.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '20px 24px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.colors.border.light}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: `all ${theme.transition.normal}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = theme.colors.border.medium
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                    e.currentTarget.style.borderColor = theme.colors.border.light
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '16px',
                      color: theme.colors.text.primary,
                      marginBottom: '6px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {file.fileName}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.colors.text.muted,
                      marginBottom: '4px'
                    }}>
                      {file.requestTitle}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.text.tertiary
                    }}>
                      {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                      {file.uploaderName && ` • ${file.uploaderName}`}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadFile(file.id, file.fileName)}
                    style={{
                      padding: '10px 20px',
                      background: theme.colors.white,
                      color: theme.colors.black,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: `all ${theme.transition.normal}`,
                      whiteSpace: 'nowrap',
                      marginLeft: '20px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.colors.text.secondary
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.colors.white
                      e.currentTarget.style.transform = 'translateY(0)'
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

export default Files
