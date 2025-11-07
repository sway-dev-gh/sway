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

          {/* Files List */}
          {files.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '120px 40px',
              color: theme.colors.text.muted
            }}>
              <div style={{
                fontSize: '15px',
                marginBottom: '16px'
              }}>
                No files yet
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary
              }}>
                Files uploaded to your requests will appear here
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '1px',
              background: theme.colors.border.light
            }}>
              {files.map((file) => (
                <div
                  key={file.id}
                  style={{
                    background: theme.colors.bg.page,
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: `background ${theme.transition.fast}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.colors.bg.hover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.colors.bg.page
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '15px',
                      color: theme.colors.text.primary,
                      marginBottom: '4px',
                      fontWeight: '400',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {file.fileName}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.text.muted,
                      marginBottom: '4px'
                    }}>
                      {file.requestTitle}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.tertiary
                    }}>
                      {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                      {file.uploaderName && ` • ${file.uploaderName}`}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadFile(file.id, file.fileName)}
                    style={{
                      padding: '8px 16px',
                      background: theme.colors.white,
                      color: theme.colors.black,
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: `all ${theme.transition.fast}`,
                      whiteSpace: 'nowrap',
                      marginLeft: '20px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.colors.text.secondary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.colors.white
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
