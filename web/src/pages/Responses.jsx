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

          {/* Responses Table */}
          {responses.length === 0 ? (
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius['2xl'],
              padding: '80px 60px',
              boxShadow: theme.shadows.md,
              textAlign: 'center'
            }}>
              {/* Icon */}
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                border: `2px solid ${theme.colors.border.medium}`
              }}>
                📥
              </div>

              <h3 style={{
                fontSize: theme.fontSize.lg,
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                margin: '0 0 12px 0',
                letterSpacing: '-0.02em'
              }}>
                Waiting for uploads
              </h3>
              <p style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.text.secondary,
                margin: '0 0 32px 0',
                lineHeight: '1.6',
                maxWidth: '420px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                When someone uploads a file to your requests, you'll see it here. You'll also get an instant notification.
              </p>

              {/* Quick workflow */}
              <div style={{
                marginTop: '48px',
                padding: '28px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: theme.radius.xl,
                border: `1px solid ${theme.colors.border.light}`,
                maxWidth: '520px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '20px',
                  fontWeight: theme.weight.medium,
                  textAlign: 'center'
                }}>
                  How it works
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '24px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '28px',
                      marginBottom: '8px'
                    }}>🔗</div>
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      Share your request link
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '28px',
                      marginBottom: '8px'
                    }}>📤</div>
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      They upload files
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '28px',
                      marginBottom: '8px'
                    }}>✨</div>
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      Files appear here
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius['2xl'],
              boxShadow: theme.shadows.md,
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
                        padding: theme.spacing[6],
                        textAlign: 'left',
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.weight.medium,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px'
                      }}>
                        File Name
                      </th>
                      <th style={{
                        padding: theme.spacing[6],
                        textAlign: 'left',
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.weight.medium,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px'
                      }}>
                        Request
                      </th>
                      <th style={{
                        padding: theme.spacing[6],
                        textAlign: 'left',
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.weight.medium,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px'
                      }}>
                        Uploader
                      </th>
                      <th style={{
                        padding: theme.spacing[6],
                        textAlign: 'left',
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.weight.medium,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px'
                      }}>
                        Size
                      </th>
                      <th style={{
                        padding: theme.spacing[6],
                        textAlign: 'left',
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.weight.medium,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px'
                      }}>
                        Uploaded
                      </th>
                      <th style={{
                        padding: theme.spacing[6],
                        textAlign: 'right',
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.weight.medium,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px'
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
                          borderBottom: index < responses.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                          background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                          transition: `background ${theme.transition.fast}`
                        }}


                                        >
                        <td style={{
                          padding: theme.spacing[6]
                        }}>
                          <div style={{
                            fontSize: theme.fontSize.lg,
                            fontWeight: theme.weight.medium,
                            color: theme.colors.text.primary
                          }}>
                            {response.fileName}
                          </div>
                        </td>
                        <td style={{
                          padding: theme.spacing[6]
                        }}>
                          <div style={{
                            fontSize: theme.fontSize.base,
                            color: theme.colors.text.secondary
                          }}>
                            {response.requestTitle}
                          </div>
                        </td>
                        <td style={{
                          padding: theme.spacing[6]
                        }}>
                          <div style={{
                            fontSize: theme.fontSize.base,
                            color: theme.colors.text.primary,
                            marginBottom: theme.spacing[1]
                          }}>
                            {response.uploaderName}
                          </div>
                          {response.uploaderEmail && (
                            <div style={{
                              fontSize: theme.fontSize.sm,
                              color: theme.colors.text.tertiary
                            }}>
                              {response.uploaderEmail}
                            </div>
                          )}
                        </td>
                        <td style={{
                          padding: theme.spacing[6]
                        }}>
                          <div style={{
                            fontSize: theme.fontSize.base,
                            color: theme.colors.text.secondary
                          }}>
                            {formatBytes(response.fileSize)}
                          </div>
                        </td>
                        <td style={{
                          padding: theme.spacing[6]
                        }}>
                          <div style={{
                            fontSize: theme.fontSize.base,
                            color: theme.colors.text.secondary
                          }}>
                            {formatDate(response.uploadedAt)}
                          </div>
                        </td>
                        <td style={{
                          padding: theme.spacing[6],
                          textAlign: 'right'
                        }}>
                          <button
                            onClick={() => handleDownload(response.id)}
                            style={{
                              padding: '10px 20px',
                              background: theme.colors.white,
                              border: 'none',
                              borderRadius: '12px',
                              color: theme.colors.black,
                              fontSize: theme.fontSize.base,
                              fontWeight: '500',
                              cursor: 'pointer',
                                                            fontFamily: 'inherit',
                              height: '44px'
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
