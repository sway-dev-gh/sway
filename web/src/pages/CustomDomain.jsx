import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function CustomDomain() {
  const navigate = useNavigate()
  const [domain, setDomain] = useState('')
  const [verificationStatus, setVerificationStatus] = useState(null) // null, 'pending', 'verified', 'failed'
  const [loading, setLoading] = useState(false)

  const handleVerifyDomain = async () => {
    if (!domain) return

    setLoading(true)
    setVerificationStatus('pending')

    // TODO: Implement actual domain verification
    setTimeout(() => {
      setVerificationStatus('verified')
      setLoading(false)
      alert('Domain verified successfully!')
    }, 2000)
  }

  const handleRemoveDomain = () => {
    setDomain('')
    setVerificationStatus(null)
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
              Custom Domain
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Use your own domain for file upload pages (e.g., files.yourcompany.com)
            </p>
          </div>

          {/* Domain Setup */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            padding: '40px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.primary,
              margin: '0 0 20px 0'
            }}>
              Domain Configuration
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: theme.weight.medium,
                color: theme.colors.text.secondary,
                marginBottom: '8px'
              }}>
                Custom Domain
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="files.yourcompany.com"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '8px',
                    color: theme.colors.text.primary,
                    fontSize: '14px'
                  }}
                />
                {verificationStatus === 'verified' ? (
                  <button
                    onClick={handleRemoveDomain}
                    style={{
                      padding: '12px 24px',
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
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={handleVerifyDomain}
                    disabled={!domain || loading}
                    style={{
                      padding: '12px 24px',
                      background: theme.colors.white,
                      color: theme.colors.black,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: theme.weight.medium,
                      cursor: (!domain || loading) ? 'not-allowed' : 'pointer',
                      opacity: (!domain || loading) ? 0.6 : 1,
                      transition: theme.transition.normal
                    }}
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                )}
              </div>
            </div>

            {/* Verification Status */}
            {verificationStatus && (
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                background: verificationStatus === 'verified' ? 'rgba(0, 255, 0, 0.05)' :
                           verificationStatus === 'failed' ? 'rgba(255, 0, 0, 0.05)' :
                           'rgba(255, 255, 0, 0.05)',
                border: `1px solid ${
                  verificationStatus === 'verified' ? 'rgba(0, 255, 0, 0.2)' :
                  verificationStatus === 'failed' ? 'rgba(255, 0, 0, 0.2)' :
                  'rgba(255, 255, 0, 0.2)'
                }`,
                marginBottom: '24px'
              }}>
                <div style={{
                  fontSize: '13px',
                  color: theme.colors.text.primary,
                  fontWeight: theme.weight.medium
                }}>
                  {verificationStatus === 'verified' && '✓ Domain verified successfully'}
                  {verificationStatus === 'failed' && '✗ Domain verification failed'}
                  {verificationStatus === 'pending' && 'Verifying domain...'}
                </div>
              </div>
            )}
          </div>

          {/* DNS Instructions */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            padding: '32px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.primary,
              margin: '0 0 16px 0'
            }}>
              DNS Configuration
            </h3>
            <p style={{
              fontSize: '13px',
              color: theme.colors.text.muted,
              margin: '0 0 20px 0',
              lineHeight: '1.6'
            }}>
              Add these DNS records to your domain provider:
            </p>

            <div style={{
              background: theme.colors.bg.page,
              borderRadius: '8px',
              padding: '20px',
              fontFamily: 'monospace',
              fontSize: '13px',
              border: `1px solid ${theme.colors.border.medium}`
            }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: theme.colors.text.tertiary, marginBottom: '4px' }}>Type</div>
                <div style={{ color: theme.colors.text.primary }}>CNAME</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: theme.colors.text.tertiary, marginBottom: '4px' }}>Name</div>
                <div style={{ color: theme.colors.text.primary }}>files</div>
              </div>
              <div>
                <div style={{ color: theme.colors.text.tertiary, marginBottom: '4px' }}>Value</div>
                <div style={{ color: theme.colors.text.primary }}>cname.swayfiles.com</div>
              </div>
            </div>

            <p style={{
              fontSize: '12px',
              color: theme.colors.text.tertiary,
              margin: '16px 0 0 0',
              lineHeight: '1.5'
            }}>
              DNS changes can take up to 48 hours to propagate, but usually complete within a few minutes.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default CustomDomain
