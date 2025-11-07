import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

// Must match REQUEST_TYPES from Requests.jsx exactly
const REQUEST_TYPES = [
  { id: 'general-upload', name: 'General Upload' },
  { id: 'photos', name: 'Photos' },
  { id: 'videos', name: 'Videos' },
  { id: 'documents', name: 'Documents' },
  { id: 'code-submission', name: 'Code' },
  { id: 'design-assets', name: 'Design' },
  { id: 'event-photos', name: 'Event Photos' },
  { id: 'application-materials', name: 'Applications' },
  { id: 'invoices', name: 'Invoices' },
  { id: 'forms', name: 'Forms' },
  { id: 'client-deliverables', name: 'Deliverables' },
  { id: 'feedback', name: 'Feedback' },
  { id: 'content', name: 'Content' },
  { id: 'assignments', name: 'Assignments' },
  { id: 'contracts', name: 'Contracts' },
  { id: 'audio', name: 'Audio' },
  { id: 'spreadsheets', name: 'Spreadsheets' },
  { id: 'presentations', name: 'Presentations' },
  { id: 'legal', name: 'Legal Docs' },
  { id: 'id-verification', name: 'ID Verification' },
  { id: 'medical', name: 'Medical Records' },
  { id: 'tax-documents', name: 'Tax Docs' },
  { id: 'property', name: 'Property Photos' },
  { id: 'products', name: 'Product Images' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'social-media', name: 'Social Media' },
  { id: 'surveys', name: 'Surveys' },
  { id: 'research', name: 'Research Data' },
  { id: 'screenshots', name: 'Screenshots' }
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
            maxWidth: '800px'
          }}>

            {/* Account Information */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '0 0 40px 0',
              borderBottom: `1px solid ${theme.colors.border.light}`
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
              padding: '40px 0',
              borderBottom: `1px solid ${theme.colors.border.light}`
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
              padding: '40px 0',
              borderBottom: `1px solid ${theme.colors.border.light}`
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
              padding: '40px 0'
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
