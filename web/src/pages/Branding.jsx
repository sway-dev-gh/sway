import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { getEffectivePlan, hasMinimumPlan } from '../utils/plan'

function Branding() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Simplified branding settings
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [removeBranding, setRemoveBranding] = useState(true)
  const [logoUrl, setLogoUrl] = useState(null)

  // Get user plan info
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isAdminMode = localStorage.getItem('adminKey')
  const adminPlanOverride = localStorage.getItem('adminPlanOverride')
  const effectivePlan = isAdminMode && adminPlanOverride ? adminPlanOverride : (user?.plan || 'free')

  // Save status
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'unsaved' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const autoSaveTimerRef = useRef(null)

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    setSaveStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const token = localStorage.getItem('token')

      await api.post('/api/branding/settings', {
        remove_branding: removeBranding,
        logo_url: logoUrl,
        background_color: backgroundColor
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setSaveStatus('saved')
      setSuccessMessage('Auto-saved')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (error) {
      console.error('Error auto-saving branding settings:', error)
      setSaveStatus('error')
      setErrorMessage('Auto-save failed')
    }
  }, [removeBranding, logoUrl, backgroundColor])

  const fetchBrandingSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        setErrorMessage('Please log in to access branding settings')
        setInitialLoad(false)
        return
      }

      // Check if user has access (Pro/Business or Admin)
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const isAdminMode = localStorage.getItem('adminKey')

      // Allow access if admin mode OR if user has pro/business plan
      if (!isAdminMode && !hasMinimumPlan(user, 'pro')) {
        // Redirect to plan page - Free users don't have access
        navigate('/plan')
        return
      }

      const { data } = await api.get('/api/branding/settings', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      })

      if (data.settings) {
        setRemoveBranding(data.settings.remove_branding ?? true)
        setLogoUrl(data.settings.logo_url)
        setBackgroundColor(data.settings.background_color || '#FFFFFF')
      }

      setErrorMessage('')
      setInitialLoad(false)
    } catch (error) {
      console.error('Error fetching branding settings:', error)

      if (error.response?.status === 401) {
        setErrorMessage('Session expired. Please log in again.')
      } else if (error.response?.status === 403) {
        navigate('/plan')
        return
      } else {
        setErrorMessage(`Failed to load branding settings: ${error.response?.data?.error || error.message}`)
      }
      setInitialLoad(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchBrandingSettings()
  }, [fetchBrandingSettings])

  // Mark as unsaved when changes are made AND trigger auto-save
  useEffect(() => {
    if (!initialLoad && saveStatus === 'saved') {
      setSaveStatus('unsaved')
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      // Set new auto-save timer (3 seconds after last change)
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave()
      }, 3000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [backgroundColor, removeBranding, logoUrl, initialLoad, saveStatus, handleAutoSave])

  // Auto-save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === 'unsaved') {
        handleAutoSave()
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus, handleAutoSave])

  const handleSave = async () => {
    setSaveStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const token = localStorage.getItem('token')

      await api.post('/api/branding/settings', {
        remove_branding: removeBranding,
        logo_url: logoUrl,
        background_color: backgroundColor
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setSaveStatus('saved')
      setSuccessMessage('Branding saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving branding settings:', error)
      setSaveStatus('error')
      if (error.response?.status === 403) {
        setErrorMessage('Pro or Business plan required for custom branding')
      } else {
        setErrorMessage('Failed to save branding settings')
      }
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoUrl(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Predefined color themes - expanded palette
  const colorThemes = [
    { name: 'White', color: '#FFFFFF' },
    { name: 'Black', color: '#000000' },
    { name: 'Dark Gray', color: '#1A1A1A' },
    { name: 'Light Gray', color: '#F5F5F5' },
    { name: 'Navy', color: '#0A1929' },
    { name: 'Slate', color: '#1E293B' },
    { name: 'Charcoal', color: '#2C2C2C' },
    { name: 'Graphite', color: '#36454F' },
    { name: 'Stone', color: '#E5E4E2' },
    { name: 'Cream', color: '#FFFDD0' },
    { name: 'Beige', color: '#F5F5DC' },
    { name: 'Midnight', color: '#191970' }
  ]

  if (initialLoad) {
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
        {/* Top Bar */}
        <div style={{
          height: '60px',
          borderBottom: `1px solid ${theme.colors.border.light}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: theme.colors.bg.sidebar
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '500',
              margin: 0
            }}>
              Branding Settings
            </h2>
            {/* Plan Badge */}
            <div style={{
              padding: '4px 12px',
              background: isAdminMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isAdminMode ? theme.colors.white : theme.colors.border.medium}`,
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: isAdminMode ? theme.colors.white : theme.colors.text.tertiary
            }}>
              {isAdminMode ? `ADMIN: ${effectivePlan.toUpperCase()}` : effectivePlan.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Save Status */}
            {saveStatus === 'unsaved' && (
              <span style={{ fontSize: '12px', color: theme.colors.text.tertiary }}>
                Unsaved changes
              </span>
            )}
            {saveStatus === 'saving' && (
              <span style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && successMessage && (
              <span style={{ fontSize: '12px', color: theme.colors.white }}>
                {successMessage}
              </span>
            )}
            {errorMessage && (
              <span style={{ fontSize: '12px', color: '#ff4444' }}>
                {errorMessage}
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={loading || saveStatus === 'saving'}
              style={{
                padding: '8px 20px',
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: loading || saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                opacity: loading || saveStatus === 'saving' ? 0.6 : 1
              }}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '60px 40px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'start'
        }}>
          {/* LEFT - Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                margin: '0 0 8px 0'
              }}>
                Customize Your Upload Pages
              </h3>
              <p style={{
                fontSize: '13px',
                color: theme.colors.text.muted,
                margin: 0,
                lineHeight: '1.6'
              }}>
                Add your logo and choose colors to match your brand when people upload files to your requests.
              </p>
            </div>

            {/* Logo Upload */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '24px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '12px'
              }}>
                Logo
              </label>
              {logoUrl && (
                <div style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  textAlign: 'center',
                  border: `1px solid ${theme.colors.border.light}`
                }}>
                  <img src={logoUrl} alt="Logo" style={{ maxHeight: '80px', maxWidth: '100%' }} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  background: theme.colors.black,
                  color: theme.colors.white,
                  border: `2px solid ${theme.colors.white}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {logoUrl ? 'Change Logo' : 'Upload Logo'}
              </label>
              <p style={{
                fontSize: '11px',
                color: theme.colors.text.tertiary,
                margin: '8px 0 0 0'
              }}>
                Recommended: PNG or SVG with transparent background
              </p>
            </div>

            {/* Background Color Themes */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '24px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '12px'
              }}>
                Background Color
              </label>

              {/* Theme Presets */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {colorThemes.map((themeItem) => (
                  <button
                    key={themeItem.color}
                    onClick={() => setBackgroundColor(themeItem.color)}
                    style={{
                      padding: '12px',
                      background: themeItem.color,
                      border: backgroundColor === themeItem.color
                        ? `3px solid ${theme.colors.white}`
                        : `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: themeItem.color === '#FFFFFF' || themeItem.color === '#F5F5F5'
                        ? theme.colors.black
                        : theme.colors.white,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {themeItem.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Color Picker */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: theme.colors.text.tertiary,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Custom Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    style={{
                      width: '50px',
                      height: '50px',
                      border: `2px solid ${theme.colors.border.medium}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: 'none'
                    }}
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Remove Branding */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '24px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginBottom: '4px'
                }}>
                  Remove "Powered by Sway"
                </div>
                <div style={{
                  fontSize: '11px',
                  color: theme.colors.text.tertiary
                }}>
                  Hide the Sway branding from your upload pages
                </div>
              </div>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: '50px',
                height: '26px',
                cursor: 'pointer',
                flexShrink: 0
              }}>
                <input
                  type="checkbox"
                  checked={removeBranding}
                  onChange={(e) => setRemoveBranding(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: removeBranding ? theme.colors.white : theme.colors.border.medium,
                  borderRadius: '26px',
                  transition: theme.transition.normal
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: removeBranding ? '28px' : '4px',
                    bottom: '4px',
                    background: removeBranding ? theme.colors.black : theme.colors.white,
                    borderRadius: '50%',
                    transition: theme.transition.normal
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* RIGHT - Preview */}
          <div style={{
            position: 'sticky',
            top: '80px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: '16px'
            }}>
              Preview
            </div>
            <div style={{
              background: backgroundColor,
              borderRadius: '12px',
              padding: '60px 40px',
              minHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: `1px solid ${theme.colors.border.medium}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}>
              {/* Logo */}
              {logoUrl && (
                <div style={{
                  marginBottom: '40px'
                }}>
                  <img src={logoUrl} alt="Logo" style={{ maxHeight: '60px', maxWidth: '250px' }} />
                </div>
              )}

              {/* Upload Form Placeholder */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}>
                <div style={{
                  padding: '40px',
                  border: `2px dashed ${backgroundColor === '#FFFFFF' || backgroundColor === '#F5F5F5' ? '#CCCCCC' : 'rgba(255, 255, 255, 0.3)'}`,
                  borderRadius: '12px',
                  textAlign: 'center',
                  maxWidth: '400px',
                  width: '100%'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '12px',
                    color: backgroundColor === '#FFFFFF' || backgroundColor === '#F5F5F5' ? '#666666' : 'rgba(255, 255, 255, 0.6)'
                  }}>
                    📁
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: backgroundColor === '#FFFFFF' || backgroundColor === '#F5F5F5' ? '#333333' : 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '8px'
                  }}>
                    Upload form appears here
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: backgroundColor === '#FFFFFF' || backgroundColor === '#F5F5F5' ? '#999999' : 'rgba(255, 255, 255, 0.5)'
                  }}>
                    This is a preview of your branded upload page
                  </div>
                </div>
              </div>

              {/* Powered by Sway */}
              {!removeBranding && (
                <div style={{
                  fontSize: '11px',
                  color: backgroundColor === '#FFFFFF' || backgroundColor === '#F5F5F5' ? '#999999' : 'rgba(255, 255, 255, 0.4)',
                  marginTop: '40px'
                }}>
                  Powered by Sway
                </div>
              )}
            </div>
            <p style={{
              fontSize: '11px',
              color: theme.colors.text.tertiary,
              marginTop: '12px',
              textAlign: 'center'
            }}>
              This branding will appear on all your file request pages
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Branding
