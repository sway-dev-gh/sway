import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function Templates() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      // TODO: Fetch saved templates from backend
      // For now, show empty state
      setTemplates([])
    } catch (error) {
      console.error('Error fetching templates:', error)
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
              Templates
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Save and reuse request templates
            </p>
          </div>

          {/* Templates List */}
          {templates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '120px 40px',
              color: theme.colors.text.muted
            }}>
              <div style={{
                fontSize: '15px',
                marginBottom: '16px'
              }}>
                No templates yet
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary
              }}>
                Create templates to quickly generate new requests with preset configurations
              </div>
            </div>
          ) : (
            <div style={{
              border: `1px solid ${theme.colors.border.medium}`
            }}>
              {templates.map((template, index) => (
                <div
                  key={template.id}
                  style={{
                    padding: '20px',
                    borderBottom: index < templates.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
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
                      {template.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.muted
                    }}>
                      {template.description} • {template.type}
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
                    Use Template
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

export default Templates
