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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.swayfiles.com'}/api/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
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
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 40px 80px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: theme.weight.medium,
              margin: '0 0 8px 0',
              color: theme.colors.text.primary
            }}>
              Responses
            </h1>
            <p style={{
              fontSize: '15px',
              color: theme.colors.text.secondary,
              margin: 0
            }}>
              All files uploaded to your requests
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {responses.length}
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Uploads
              </div>
            </div>

            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {formatBytes(responses.reduce((sum, r) => sum + (r.fileSize || 0), 0))}
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Size
              </div>
            </div>
          </div>

          {/* Responses Table */}
          {responses.length === 0 ? (
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                opacity: 0.3,
                fontWeight: theme.weight.light,
                color: theme.colors.text.tertiary
              }}>—</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: theme.weight.medium,
                color: theme.colors.text.primary,
                margin: '0 0 8px 0'
              }}>
                No responses yet
              </h3>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                margin: 0
              }}>
                Files uploaded to your requests will appear here
              </p>
            </div>
          ) : (
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: `1px solid ${theme.colors.border.light}`
                    }}>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: theme.weight.semibold,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        File Name
                      </th>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: theme.weight.semibold,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Request
                      </th>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: theme.weight.semibold,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Uploader
                      </th>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: theme.weight.semibold,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Size
                      </th>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: theme.weight.semibold,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Uploaded
                      </th>
                      <th style={{
                        padding: '16px 20px',
                        textAlign: 'right',
                        fontSize: '12px',
                        fontWeight: theme.weight.semibold,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response, index) => (
                      <tr
                        key={response.id}
                        style={{
                          borderBottom: index < responses.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none'
                        }}
                      >
                        <td style={{
                          padding: '16px 20px'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: theme.weight.medium,
                            color: theme.colors.text.primary,
                            marginBottom: '2px'
                          }}>
                            {response.fileName}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px 20px'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            color: theme.colors.text.secondary
                          }}>
                            {response.requestTitle}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px 20px'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            color: theme.colors.text.primary,
                            marginBottom: '2px'
                          }}>
                            {response.uploaderName}
                          </div>
                          {response.uploaderEmail && (
                            <div style={{
                              fontSize: '12px',
                              color: theme.colors.text.tertiary
                            }}>
                              {response.uploaderEmail}
                            </div>
                          )}
                        </td>
                        <td style={{
                          padding: '16px 20px'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            color: theme.colors.text.secondary
                          }}>
                            {formatBytes(response.fileSize)}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px 20px'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            color: theme.colors.text.secondary
                          }}>
                            {formatDate(response.uploadedAt)}
                          </div>
                        </td>
                        <td style={{
                          padding: '16px 20px',
                          textAlign: 'right'
                        }}>
                          <button
                            onClick={() => handleDownload(response.id)}
                            style={{
                              padding: '8px 16px',
                              background: theme.colors.white,
                              border: 'none',
                              borderRadius: '6px',
                              color: theme.colors.black,
                              fontSize: '13px',
                              fontWeight: theme.weight.medium,
                              cursor: 'pointer',
                              transition: `all ${theme.transition.fast}`,
                              fontFamily: 'inherit'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = theme.colors.text.secondary
                              e.currentTarget.style.transform = 'scale(1.05)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = theme.colors.white
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Responses
