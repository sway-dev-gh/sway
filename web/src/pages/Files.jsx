import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

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

      // TODO: Fetch all files from all requests
      // For now, show empty state
      setFiles([])
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
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
              border: `1px solid ${theme.colors.border.medium}`
            }}>
              {files.map((file, index) => (
                <div
                  key={file.id}
                  style={{
                    padding: '20px',
                    borderBottom: index < files.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      {file.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.muted
                    }}>
                      {file.size} • {file.uploadedAt}
                    </div>
                  </div>
                  <button style={{
                    padding: '8px 16px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}>
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
