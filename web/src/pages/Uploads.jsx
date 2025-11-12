import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Uploads = () => {
  const navigate = useNavigate()
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, recent, approved, pending

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/uploads', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUploads(data.uploads || [])
      }
    } catch (error) {
      console.error('Failed to fetch uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const statusMap = {
      'pending': '#ffd43b',
      'approved': '#51cf66',
      'rejected': '#ff6b6b',
      'processing': '#4c6ef5'
    }
    return statusMap[status] || '#666666'
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Pending Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'processing': 'Processing'
    }
    return statusMap[status] || 'Unknown'
  }

  const filteredUploads = uploads.filter(upload => {
    if (filter === 'all') return true
    if (filter === 'recent') return new Date(upload.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return upload.status === filter
  })

  if (loading) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          color: '#ffffff',
          paddingTop: '68px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '48px 32px'
          }}>
            Loading uploads...
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        paddingTop: '68px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 32px'
        }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '48px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 8px 0'
              }}>
                File Uploads
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#ffffff',
                margin: '0'
              }}>
                Manage and review uploaded files
              </p>
            </div>
            <button
              onClick={() => navigate('/projects')}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              View Projects
            </button>
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #333333',
            marginBottom: '32px'
          }}>
            {[
              { key: 'all', label: 'All Uploads' },
              { key: 'recent', label: 'Recent' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  background: 'transparent',
                  color: filter === tab.key ? '#ffffff' : '#ffffff',
                  border: 'none',
                  borderBottom: filter === tab.key ? '2px solid #ffffff' : '2px solid transparent',
                  padding: '16px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Uploads List */}
          {filteredUploads.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {filteredUploads.map(upload => (
                <div
                  key={upload.id}
                  style={{
                    background: '#000000',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    if (upload.project_id) {
                      navigate(`/projects/${upload.project_id}`)
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#666666'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#ffffff'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#ffffff',
                          margin: 0
                        }}>
                          {upload.name || 'Untitled Upload'}
                        </h3>
                        <div style={{
                          padding: '4px 8px',
                          background: getStatusColor(upload.status),
                          color: '#000000',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'uppercase'
                        }}>
                          {getStatusLabel(upload.status)}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        fontSize: '14px',
                        color: '#ffffff'
                      }}>
                        <div>Size: {upload.size ? `${(upload.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</div>
                        <div>Type: {upload.type || 'Unknown'}</div>
                        <div>Uploaded: {new Date(upload.created_at).toLocaleDateString()}</div>
                        {upload.project_name && (
                          <div>Project: {upload.project_name}</div>
                        )}
                      </div>

                      {upload.description && (
                        <p style={{
                          fontSize: '14px',
                          color: '#ffffff',
                          margin: '12px 0 0 0',
                          lineHeight: '1.4'
                        }}>
                          {upload.description}
                        </p>
                      )}
                    </div>

                    <div style={{
                      fontSize: '20px'
                    }}>
                      📄
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                •
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#ffffff',
                margin: '0 0 8px 0'
              }}>
                {filter === 'all' ? 'No uploads yet' : `No ${filter} uploads`}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#ffffff',
                margin: '0 0 20px 0'
              }}>
                {filter === 'all'
                  ? 'Files uploaded to your projects will appear here'
                  : `No uploads match the ${filter} filter`
                }
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    background: 'transparent',
                    color: '#ffffff',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  View All Uploads
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Uploads