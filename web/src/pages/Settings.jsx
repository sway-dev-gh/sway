import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

// All request types from Requests.jsx
const REQUEST_TYPES = [
  { id: 'code-submission', name: 'Code Submission' },
  { id: 'design-assets', name: 'Design Assets' },
  { id: 'event-photos', name: 'Event Photos' },
  { id: 'video-submissions', name: 'Video Submissions' },
  { id: 'application-materials', name: 'Application Materials' },
  { id: 'invoice-receipts', name: 'Invoices & Receipts' },
  { id: 'form-response', name: 'Form Response' },
  { id: 'media-collection', name: 'Mixed Media Collection' },
  { id: 'document-upload', name: 'Document Upload' },
  { id: 'client-deliverables', name: 'Client Deliverables' },
  { id: 'feedback-collection', name: 'Feedback Collection' },
  { id: 'content-submissions', name: 'Content Submissions' },
  { id: 'assignment-handins', name: 'Assignment Hand-ins' },
  { id: 'contract-signatures', name: 'Contract Signatures' },
  { id: 'audio-files', name: 'Audio Files' },
  { id: 'spreadsheet-data', name: 'Spreadsheet Data' },
  { id: 'presentation-slides', name: 'Presentation Slides' },
  { id: 'legal-documents', name: 'Legal Documents' },
  { id: 'id-verification', name: 'ID Verification' },
  { id: 'medical-records', name: 'Medical Records' },
  { id: 'tax-documents', name: 'Tax Documents' },
  { id: 'property-photos', name: 'Property Photos' },
  { id: 'product-images', name: 'Product Images' },
  { id: 'marketing-materials', name: 'Marketing Materials' },
  { id: 'social-media-content', name: 'Social Media Content' },
  { id: 'testimonials-reviews', name: 'Testimonials & Reviews' },
  { id: 'survey-responses', name: 'Survey Responses' },
  { id: 'research-data', name: 'Research Data' },
  { id: 'screenshot-proof', name: 'Screenshots & Proof' },
  { id: 'general-upload', name: 'General Upload' }
]

function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ email: '' })
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    defaultRequestType: 'general-upload',
    fileSizeLimit: 50,
    emailNotifications: true,
    requestNotifications: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    setLoading(false)
  }, [navigate])

  const saveSettings = () => {
    setSaving(true)
    localStorage.setItem('userSettings', JSON.stringify(settings))
    setTimeout(() => {
      setSaving(false)
    }, 500)
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
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
              Settings
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Manage your account preferences and settings
            </p>
          </div>

          {/* Settings Sections */}
          <div style={{
            display: 'grid',
            gap: '1px',
            background: theme.colors.border.light
          }}>

            {/* Account Information */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[4],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Account
              </div>

              <div style={{ marginBottom: theme.spacing[6] }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[2]
                }}>
                  Email Address
                </div>
                <div style={{
                  fontSize: '16px',
                  color: theme.colors.text.primary,
                  fontWeight: '400'
                }}>
                  {user.email}
                </div>
              </div>

              <div style={{ marginBottom: theme.spacing[6] }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[2]
                }}>
                  Account Status
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  fontSize: '12px',
                  color: theme.colors.text.primary
                }}>
                  Active
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[4],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Notifications
              </div>

              <div style={{ marginBottom: theme.spacing[4] }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: theme.spacing[3],
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  marginBottom: theme.spacing[2]
                }}>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    style={{
                      marginRight: theme.spacing[3],
                      width: '16px',
                      height: '16px',
                      accentColor: theme.colors.white,
                      filter: 'grayscale(1)'
                    }}
                  />
                  <div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Email notifications
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.muted
                    }}>
                      Receive email when files are uploaded
                    </div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: theme.spacing[3],
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.medium}`
                }}>
                  <input
                    type="checkbox"
                    checked={settings.requestNotifications}
                    onChange={(e) => handleSettingChange('requestNotifications', e.target.checked)}
                    style={{
                      marginRight: theme.spacing[3],
                      width: '16px',
                      height: '16px',
                      accentColor: theme.colors.white,
                      filter: 'grayscale(1)'
                    }}
                  />
                  <div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Request notifications
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.muted
                    }}>
                      Get notified about request activity
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Preferences */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[4],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Preferences
              </div>

              <div style={{ marginBottom: theme.spacing[4] }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[3]
                }}>
                  Default Request Type
                </div>
                <select
                  value={settings.defaultRequestType}
                  onChange={(e) => handleSettingChange('defaultRequestType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {REQUEST_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: theme.spacing[6] }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[3]
                }}>
                  File Size Limit
                </div>
                <select
                  value={settings.fileSizeLimit}
                  onChange={(e) => handleSettingChange('fileSizeLimit', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={10}>10 MB</option>
                  <option value={50}>50 MB</option>
                  <option value={100}>100 MB</option>
                  <option value={500}>500 MB</option>
                  <option value={1024}>1 GB</option>
                </select>
              </div>

              {/* Save Button */}
              <button
                onClick={saveSettings}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: theme.weight.medium,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: saving ? 0.6 : 1,
                  transition: `all ${theme.transition.fast}`
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = theme.colors.text.secondary
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = theme.colors.white
                  }
                }}
              >
                {saving ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>

            {/* Danger Zone */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[4],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Danger Zone
              </div>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    // Handle account deletion
                    alert('Account deletion would be processed here')
                  }
                }}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  fontSize: '14px',
                  fontWeight: '400',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
