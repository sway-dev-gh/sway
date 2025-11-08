import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Branding() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Branding settings
  const [settings, setSettings] = useState({
    removeBranding: true,
    logoUrl: null,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    buttonColor: '#ffffff',
    buttonTextColor: '#000000',
    title: 'Upload Your Files',
    subtitle: 'Drag and drop your files here or click to browse'
  })

  useEffect(() => {
    fetchBrandingSettings()
  }, [])

  const fetchBrandingSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.get('/api/branding/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.settings) {
        setSettings({
          removeBranding: data.settings.remove_branding ?? true,
          logoUrl: data.settings.logo_url,
          backgroundColor: data.settings.background_color || '#000000',
          textColor: data.settings.text_color || '#ffffff',
          buttonColor: data.settings.button_color || '#ffffff',
          buttonTextColor: data.settings.button_text_color || '#000000',
          title: data.settings.title || 'Upload Your Files',
          subtitle: data.settings.subtitle || 'Drag and drop your files here or click to browse'
        })
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error)
    } finally {
      setInitialLoad(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      await api.post('/api/branding/settings', {
        remove_branding: settings.removeBranding,
        logo_url: settings.logoUrl,
        background_color: settings.backgroundColor,
        text_color: settings.textColor,
        button_color: settings.buttonColor,
        button_text_color: settings.buttonTextColor,
        title: settings.title,
        subtitle: settings.subtitle
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Branding settings saved successfully!')
    } catch (error) {
      console.error('Error saving branding settings:', error)
      if (error.response?.status === 403) {
        alert('Pro or Business plan required for custom branding')
      } else {
        alert('Failed to save branding settings. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSettings(prev => ({ ...prev, logoUrl: URL.createObjectURL(file) }))
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
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
          maxWidth: '1600px',
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
              Branding
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Customize your upload page appearance with live preview
            </p>
          </div>

          {/* Two Column Layout: Settings + Preview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px'
          }}>
            {/* LEFT: Settings Panel */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Page Content */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`,
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  margin: '0 0 20px 0'
                }}>
                  Page Content
                </h3>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    color: theme.colors.text.secondary,
                    marginBottom: '8px'
                  }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => updateSetting('title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    color: theme.colors.text.secondary,
                    marginBottom: '8px'
                  }}>
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={settings.subtitle}
                    onChange={(e) => updateSetting('subtitle', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Logo */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`,
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  margin: '0 0 16px 0'
                }}>
                  Logo
                </h3>

                {settings.logoUrl && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '20px',
                    background: theme.colors.bg.page,
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border.medium}`,
                    textAlign: 'center'
                  }}>
                    <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '60px', maxWidth: '100%' }} />
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
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: 'transparent',
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    color: theme.colors.text.secondary,
                    cursor: 'pointer',
                    transition: theme.transition.normal
                  }}
                >
                  {settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </label>
              </div>

              {/* Colors */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`,
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  margin: '0 0 20px 0'
                }}>
                  Colors
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Background Color */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        border: `2px solid ${theme.colors.border.medium}`,
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: theme.colors.text.secondary, marginBottom: '4px' }}>Background</div>
                      <div style={{ fontSize: '12px', color: theme.colors.text.muted, fontFamily: 'monospace' }}>{settings.backgroundColor}</div>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => updateSetting('textColor', e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        border: `2px solid ${theme.colors.border.medium}`,
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: theme.colors.text.secondary, marginBottom: '4px' }}>Text</div>
                      <div style={{ fontSize: '12px', color: theme.colors.text.muted, fontFamily: 'monospace' }}>{settings.textColor}</div>
                    </div>
                  </div>

                  {/* Button Color */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={settings.buttonColor}
                      onChange={(e) => updateSetting('buttonColor', e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        border: `2px solid ${theme.colors.border.medium}`,
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: theme.colors.text.secondary, marginBottom: '4px' }}>Button</div>
                      <div style={{ fontSize: '12px', color: theme.colors.text.muted, fontFamily: 'monospace' }}>{settings.buttonColor}</div>
                    </div>
                  </div>

                  {/* Button Text Color */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="color"
                      value={settings.buttonTextColor}
                      onChange={(e) => updateSetting('buttonTextColor', e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        border: `2px solid ${theme.colors.border.medium}`,
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: theme.colors.text.secondary, marginBottom: '4px' }}>Button Text</div>
                      <div style={{ fontSize: '12px', color: theme.colors.text.muted, fontFamily: 'monospace' }}>{settings.buttonTextColor}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remove Branding Toggle */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`,
                padding: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: theme.weight.semibold,
                      color: theme.colors.text.primary,
                      margin: '0 0 6px 0'
                    }}>
                      Remove Sway Branding
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: theme.colors.text.muted,
                      margin: 0
                    }}>
                      Hide "Powered by Sway" from upload pages
                    </p>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={settings.removeBranding}
                      onChange={(e) => updateSetting('removeBranding', e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: settings.removeBranding ? theme.colors.white : theme.colors.border.medium,
                      borderRadius: '24px',
                      transition: theme.transition.normal
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: settings.removeBranding ? '27px' : '3px',
                        bottom: '3px',
                        background: settings.removeBranding ? theme.colors.black : theme.colors.white,
                        borderRadius: '50%',
                        transition: theme.transition.normal
                      }} />
                    </span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '14px 32px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: theme.weight.semibold,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: `all ${theme.transition.normal}`
                }}
              >
                {loading ? 'Saving...' : 'Save Branding Settings'}
              </button>
            </div>

            {/* RIGHT: Live Preview */}
            <div>
              <div style={{
                position: 'sticky',
                top: '80px'
              }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  marginBottom: '12px',
                  fontWeight: theme.weight.medium,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Live Preview
                </div>
                <div style={{
                  background: settings.backgroundColor,
                  borderRadius: '16px',
                  border: `2px solid ${theme.colors.border.medium}`,
                  padding: '60px 40px',
                  minHeight: '600px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}>
                  {/* Logo */}
                  {settings.logoUrl && (
                    <div style={{ marginBottom: '32px' }}>
                      <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '80px', maxWidth: '200px' }} />
                    </div>
                  )}

                  {/* Title */}
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: '300',
                    color: settings.textColor,
                    margin: '0 0 16px 0',
                    fontFamily: 'inherit'
                  }}>
                    {settings.title}
                  </h1>

                  {/* Subtitle */}
                  <p style={{
                    fontSize: '16px',
                    color: settings.textColor,
                    opacity: 0.7,
                    margin: '0 0 40px 0',
                    maxWidth: '400px'
                  }}>
                    {settings.subtitle}
                  </p>

                  {/* Upload Area */}
                  <div style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '60px 40px',
                    border: `2px dashed ${settings.textColor}`,
                    borderRadius: '12px',
                    opacity: 0.5,
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '16px'
                    }}>
                      ↑
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: settings.textColor
                    }}>
                      Drop files here
                    </div>
                  </div>

                  {/* Button */}
                  <button style={{
                    padding: '14px 32px',
                    background: settings.buttonColor,
                    color: settings.buttonTextColor,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}>
                    Choose Files
                  </button>

                  {/* Branding Footer */}
                  {!settings.removeBranding && (
                    <div style={{
                      marginTop: '40px',
                      fontSize: '12px',
                      color: settings.textColor,
                      opacity: 0.4
                    }}>
                      Powered by Sway
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Branding
