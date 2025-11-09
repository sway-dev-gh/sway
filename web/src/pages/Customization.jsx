import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function Customization() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Load saved customizations from localStorage
  const [customization, setCustomization] = useState({
    fontFamily: localStorage.getItem('customFont') || 'Inter, system-ui, -apple-system, sans-serif',
    fontColor: localStorage.getItem('customFontColor') || '#FFFFFF',
    backgroundColor: localStorage.getItem('customBgColor') || '#0A0A0A'
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    setLoading(false)
  }, [navigate])

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('customFont', customization.fontFamily)
    localStorage.setItem('customFontColor', customization.fontColor)
    localStorage.setItem('customBgColor', customization.backgroundColor)

    // Apply to document root
    document.documentElement.style.setProperty('--custom-font', customization.fontFamily)
    document.documentElement.style.setProperty('--custom-font-color', customization.fontColor)
    document.documentElement.style.setProperty('--custom-bg-color', customization.backgroundColor)

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    // Reload page to apply changes
    window.location.reload()
  }

  const handleReset = () => {
    const defaults = {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontColor: '#FFFFFF',
      backgroundColor: '#0A0A0A'
    }
    setCustomization(defaults)
    localStorage.removeItem('customFont')
    localStorage.removeItem('customFontColor')
    localStorage.removeItem('customBgColor')

    // Reset document root
    document.documentElement.style.removeProperty('--custom-font')
    document.documentElement.style.removeProperty('--custom-font-color')
    document.documentElement.style.removeProperty('--custom-bg-color')

    window.location.reload()
  }

  const fontOptions = [
    'Inter, system-ui, -apple-system, sans-serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Arial, sans-serif',
    'Times New Roman, serif',
    'Verdana, sans-serif',
    'Trebuchet MS, sans-serif',
    'Comic Sans MS, cursive'
  ]

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
          maxWidth: '800px',
          margin: '0 auto',
          padding: theme.spacing[12]
        }}>
          {/* Header */}
          <div style={{ marginBottom: theme.spacing[10] }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '500',
              margin: '0 0 8px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Customization
            </h1>
            <p style={{
              fontSize: '15px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Personalize your Sway experience with custom fonts, colors, and backgrounds.
            </p>
          </div>

          {/* Customization Card */}
          <div style={{
            background: theme.colors.bg.secondary,
            padding: theme.spacing[10],
            borderRadius: theme.radius['2xl'],
            border: `1px solid ${theme.colors.border.light}`,
            boxShadow: theme.shadows.md,
            marginBottom: theme.spacing[6]
          }}>
            {/* Font Family */}
            <div style={{ marginBottom: theme.spacing[8] }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[3],
                fontWeight: theme.weight.medium
              }}>
                Font Family
              </label>
              <select
                value={customization.fontFamily}
                onChange={(e) => setCustomization({ ...customization, fontFamily: e.target.value })}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '10px',
                  color: theme.colors.text.primary,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: `all ${theme.transition.fast}`
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.dark
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                }}
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font.split(',')[0]}
                  </option>
                ))}
              </select>
              <p style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary,
                marginTop: theme.spacing[2],
                lineHeight: '1.5'
              }}>
                Choose your preferred font for the interface
              </p>
            </div>

            {/* Font Color */}
            <div style={{ marginBottom: theme.spacing[8] }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[3],
                fontWeight: theme.weight.medium
              }}>
                Font Color
              </label>
              <div style={{ display: 'flex', gap: theme.spacing[3], alignItems: 'center' }}>
                <input
                  type="color"
                  value={customization.fontColor}
                  onChange={(e) => setCustomization({ ...customization, fontColor: e.target.value })}
                  style={{
                    width: '60px',
                    height: '44px',
                    padding: '4px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                />
                <input
                  type="text"
                  value={customization.fontColor}
                  onChange={(e) => setCustomization({ ...customization, fontColor: e.target.value })}
                  placeholder="#FFFFFF"
                  style={{
                    flex: 1,
                    height: '44px',
                    padding: '0 14px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '10px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    transition: `all ${theme.transition.fast}`
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.dark
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.medium
                  }}
                />
              </div>
              <p style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary,
                marginTop: theme.spacing[2],
                lineHeight: '1.5'
              }}>
                Set the primary text color for the interface
              </p>
            </div>

            {/* Background Color */}
            <div style={{ marginBottom: theme.spacing[8] }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[3],
                fontWeight: theme.weight.medium
              }}>
                Background Color
              </label>
              <div style={{ display: 'flex', gap: theme.spacing[3], alignItems: 'center' }}>
                <input
                  type="color"
                  value={customization.backgroundColor}
                  onChange={(e) => setCustomization({ ...customization, backgroundColor: e.target.value })}
                  style={{
                    width: '60px',
                    height: '44px',
                    padding: '4px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                />
                <input
                  type="text"
                  value={customization.backgroundColor}
                  onChange={(e) => setCustomization({ ...customization, backgroundColor: e.target.value })}
                  placeholder="#0A0A0A"
                  style={{
                    flex: 1,
                    height: '44px',
                    padding: '0 14px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '10px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    transition: `all ${theme.transition.fast}`
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.dark
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.medium
                  }}
                />
              </div>
              <p style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary,
                marginTop: theme.spacing[2],
                lineHeight: '1.5'
              }}>
                Set the main background color for the interface
              </p>
            </div>

            {/* Preview Box */}
            <div style={{ marginBottom: theme.spacing[8] }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[3],
                fontWeight: theme.weight.medium
              }}>
                Preview
              </label>
              <div style={{
                padding: theme.spacing[8],
                background: customization.backgroundColor,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontFamily: customization.fontFamily,
                  color: customization.fontColor,
                  fontSize: '16px',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  The quick brown fox jumps over the lazy dog
                </p>
                <p style={{
                  fontFamily: customization.fontFamily,
                  color: customization.fontColor,
                  fontSize: '14px',
                  margin: '8px 0 0 0',
                  opacity: 0.7
                }}>
                  This is how your customization will look
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: theme.spacing[3] }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  height: '44px',
                  padding: '0 24px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer',
                  transition: `all ${theme.transition.fast}`,
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.text.secondary
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.colors.white
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
              <button
                onClick={handleReset}
                style={{
                  height: '44px',
                  padding: '0 24px',
                  background: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer',
                  transition: `all ${theme.transition.fast}`,
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.bg.hover
                  e.currentTarget.style.borderColor = theme.colors.border.dark
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                }}
              >
                Reset to Default
              </button>
            </div>
          </div>

          {/* Info Note */}
          <div style={{
            padding: theme.spacing[6],
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.radius.md,
            fontSize: '13px',
            color: theme.colors.text.secondary,
            lineHeight: '1.6'
          }}>
            <strong style={{ color: theme.colors.text.primary }}>Note:</strong> Your customization settings are saved locally in your browser. Changes will apply after clicking "Save Changes" and reloading the page.
          </div>
        </div>
      </div>
    </>
  )
}

export default Customization
