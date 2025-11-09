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
        marginTop: '72px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: theme.spacing[12]
        }}>

          {/* Header */}
          <div style={{ marginBottom: theme.spacing[12] }}>
            <h1 style={{
              fontSize: '42px',
              fontWeight: '500',
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Responses
            </h1>
            <p style={{
              fontSize: '22px',
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
            gap: theme.spacing[6],
            marginBottom: theme.spacing[10]
          }}>
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius['2xl'],
              padding: theme.spacing[12],
              boxShadow: theme.shadows.md,
                          }}>
              <div style={{
                fontSize: '18px',
                color: theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: theme.spacing[4],
                fontWeight: theme.weight.medium
              }}>
                Total Uploads
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                lineHeight: '1'
              }}>
                {responses.length}
              </div>
            </div>

            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius['2xl'],
              padding: theme.spacing[12],
              boxShadow: theme.shadows.md,
                          }}>
              <div style={{
                fontSize: '18px',
                color: theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: theme.spacing[4],
                fontWeight: theme.weight.medium
              }}>
                Total Size
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                lineHeight: '1'
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
              padding: '120px 60px',
              boxShadow: theme.shadows.md,
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: theme.weight.medium,
                color: theme.colors.text.primary,
                margin: '0 0 12px 0'
              }}>
                No responses yet
              </h3>
              <p style={{
                fontSize: '22px',
                color: theme.colors.text.secondary,
                margin: 0,
                lineHeight: '1.6'
              }}>
                Files uploaded to your requests will appear here
              </p>
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
                        fontSize: '18px',
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
                        fontSize: '18px',
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
                        fontSize: '18px',
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
                        fontSize: '18px',
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
                        fontSize: '18px',
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
                        fontSize: '18px',
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
                            fontSize: '22px',
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
                            fontSize: '20px',
                            color: theme.colors.text.secondary
                          }}>
                            {response.requestTitle}
                          </div>
                        </td>
                        <td style={{
                          padding: theme.spacing[6]
                        }}>
                          <div style={{
                            fontSize: '20px',
                            color: theme.colors.text.primary,
                            marginBottom: theme.spacing[1]
                          }}>
                            {response.uploaderName}
                          </div>
                          {response.uploaderEmail && (
                            <div style={{
                              fontSize: '19px',
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
                            fontSize: '20px',
                            color: theme.colors.text.secondary
                          }}>
                            {formatBytes(response.fileSize)}
                          </div>
                        </td>
                        <td style={{
                          padding: theme.spacing[6]
                        }}>
                          <div style={{
                            fontSize: '20px',
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
                              fontSize: '20px',
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
