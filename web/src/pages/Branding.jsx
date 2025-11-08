import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function Branding() {
  const navigate = useNavigate()
  const [removeBranding, setRemoveBranding] = useState(true)
  const [customLogo, setCustomLogo] = useState(null)
  const [customColor, setCustomColor] = useState('#000000')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)

    // TODO: Implement actual branding settings save
    setTimeout(() => {
      alert('Branding settings saved successfully!')
      setLoading(false)
    }, 1000)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCustomLogo(URL.createObjectURL(file))
    }
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
          maxWidth: '900px',
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
              Customize the look and feel of your file upload pages
            </p>
          </div>

          {/* Remove Sway Branding */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            padding: '32px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: theme.weight.medium,
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
                  Hide "Powered by Sway Files" from your upload pages
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
                  borderRadius: '24px',
                  transition: theme.transition.normal
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: removeBranding ? '27px' : '3px',
                    bottom: '3px',
                    background: removeBranding ? theme.colors.black : theme.colors.white,
                    borderRadius: '50%',
                    transition: theme.transition.normal
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* Custom Logo */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            padding: '32px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.primary,
              margin: '0 0 16px 0'
            }}>
              Custom Logo
            </h3>
            <p style={{
              fontSize: '13px',
              color: theme.colors.text.muted,
              margin: '0 0 20px 0'
            }}>
              Upload your company logo to display on file upload pages
            </p>

            {customLogo && (
              <div style={{
                marginBottom: '20px',
                padding: '20px',
                background: theme.colors.bg.page,
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border.medium}`,
                textAlign: 'center'
              }}>
                <img src={customLogo} alt="Custom logo" style={{ maxHeight: '80px' }} />
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
              {customLogo ? 'Change Logo' : 'Upload Logo'}
            </label>
          </div>

          {/* Brand Color */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            padding: '32px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.primary,
              margin: '0 0 16px 0'
            }}>
              Brand Color
            </h3>
            <p style={{
              fontSize: '13px',
              color: theme.colors.text.muted,
              margin: '0 0 20px 0'
            }}>
              Choose a primary color for buttons and accents
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                style={{
                  width: '60px',
                  height: '60px',
                  border: `2px solid ${theme.colors.border.medium}`,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
              <div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  fontFamily: 'monospace'
                }}>
                  {customColor}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.muted,
                  marginTop: '4px'
                }}>
                  Used for buttons and highlights
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '12px 32px',
              background: theme.colors.white,
              color: theme.colors.black,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: theme.weight.medium,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: `all ${theme.transition.normal}`
            }}
          >
            {loading ? 'Saving...' : 'Save Branding Settings'}
          </button>
        </div>
      </div>
    </>
  )
}

export default Branding
