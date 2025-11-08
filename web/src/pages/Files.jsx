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

          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: theme.colors.border.light,
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '40px',
            border: `1px solid ${theme.colors.border.light}`
          }}>
            <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
              <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Total Files</div>
              <div style={{ fontSize: '32px', fontWeight: '200', color: theme.colors.white }}>{files.length}</div>
            </div>
            <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
              <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Total Size</div>
              <div style={{ fontSize: '32px', fontWeight: '200', color: theme.colors.white }}>
                {formatFileSize(files.reduce((sum, f) => sum + (f.fileSize || 0), 0))}
              </div>
            </div>
            <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
              <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Requests</div>
              <div style={{ fontSize: '32px', fontWeight: '200', color: theme.colors.white }}>
                {new Set(files.map(f => f.requestId)).size}
              </div>
            </div>
          </div>

          {/* Files Table */}
          {files.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <div style={{
                fontSize: '15px',
                marginBottom: '8px',
                color: theme.colors.text.muted
              }}>
                No files yet
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary,
                lineHeight: '1.5'
              }}>
                Files uploaded to your requests will appear here
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              overflow: 'hidden'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 120px 150px 100px',
                padding: '16px 24px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: theme.weight.semibold }}>File Name</div>
                <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: theme.weight.semibold }}>Request</div>
                <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: theme.weight.semibold }}>Size</div>
                <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: theme.weight.semibold }}>Uploaded</div>
                <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: theme.weight.semibold, textAlign: 'right' }}>Action</div>
              </div>

              {/* Table Rows */}
              {files.map((file, index) => (
                <div
                  key={file.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 120px 150px 100px',
                    padding: '20px 24px',
                    borderBottom: index < files.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                    transition: `all ${theme.transition.fast}`,
                    background: 'transparent',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.text.primary,
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingRight: '16px'
                  }}>
                    {file.fileName}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingRight: '16px'
                  }}>
                    {file.requestTitle}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary
                  }}>
                    {formatFileSize(file.fileSize)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.colors.text.tertiary
                  }}>
                    {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => downloadFile(file.id, file.fileName)}
                      style={{
                        padding: '6px 14px',
                        background: 'transparent',
                        color: theme.colors.text.secondary,
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: `all ${theme.transition.fast}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        e.currentTarget.style.color = theme.colors.white
                        e.currentTarget.style.borderColor = theme.colors.white
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = theme.colors.text.secondary
                        e.currentTarget.style.borderColor = theme.colors.border.medium
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

export default Files
