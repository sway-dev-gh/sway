import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'
import ConfirmModal from '../components/ConfirmModal'

function Settings() {
  const navigate = useNavigate()
  const toast = useToast()
  const [user, setUser] = useState({ email: '' })
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [upgrading, setUpgrading] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)

      // Check for admin plan override
      const adminPlanOverride = localStorage.getItem('adminPlanOverride')
      if (adminPlanOverride) {
        userData.plan = adminPlanOverride
      }

      const finalPlan = (userData.plan || 'free').toLowerCase()
      setCurrentPlan(finalPlan)
    }

    setLoading(false)
  }, [navigate])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    setChangingPassword(true)

    try {
      const token = localStorage.getItem('token')
      await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setPasswordSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleAdminPlanSwitch = (planId) => {
    // Check if user is admin
    const adminKey = localStorage.getItem('adminKey')
    if (!adminKey) return

    // Set the plan override
    localStorage.setItem('adminPlanOverride', planId)

    // Update state
    setCurrentPlan(planId)
    const userData = { ...user, plan: planId }
    setUser(userData)

    // Reload to apply changes
    window.location.reload()
  }

  const handleDowngradeToFree = () => {
    // Admin users can switch instantly
    const adminKey = localStorage.getItem('adminKey')
    if (adminKey) {
      handleAdminPlanSwitch('free')
      return
    }

    // For real users, cancel their subscription (to be implemented)
    // For now, just show a message
    toast.info('Downgrade feature coming soon! Contact support to downgrade your plan.')
    setShowDowngradeModal(false)
  }

  const handleUpgrade = async (planId) => {
    if (planId === currentPlan) {
      return
    }

    // If downgrading to free, show confirmation modal
    if (planId === 'free' && currentPlan === 'pro') {
      setShowDowngradeModal(true)
      return
    }

    setUpgrading(true)
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.post('/api/stripe/create-checkout-session', { planId }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      toast.error('Failed to start upgrade process. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }



  // Render Account Tab Content
  const renderAccountTab = () => (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      display: 'grid',
      gap: theme.spacing[5]
    }}>
      {/* Email Address */}
      <div style={{
        padding: '24px 32px',
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border.light}`,
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          fontSize: '14px',
          color: theme.colors.text.secondary,
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          Email
        </div>
        <div style={{
          fontSize: '16px',
          color: theme.colors.text.primary,
          fontWeight: '400'
        }}>
          {user.email}
        </div>
      </div>

      {/* Change Password */}
      <div style={{
        padding: '32px',
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border.light}`,
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          fontSize: '18px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          marginBottom: '24px'
        }}>
          Change Password
        </div>

        <form onSubmit={handleChangePassword}>
          {passwordError && (
            <div style={theme.alerts.error}>
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div style={theme.alerts.success}>
              {passwordSuccess}
            </div>
          )}

          <div style={{ display: 'grid', gap: theme.layout.formFieldGap }}>
            <div>
              <label style={theme.inputs.label}>
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
                }}
              />
            </div>

            <div>
              <label style={theme.inputs.label}>
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a new password"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
                }}
              />
              <div style={theme.inputs.helper}>
                Minimum 6 characters
              </div>
            </div>

            <div>
              <label style={theme.inputs.label}>
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                style={theme.inputs.text.base}
                onFocus={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.focus)
                }}
                onBlur={(e) => {
                  Object.assign(e.currentTarget.style, theme.inputs.text.base)
                }}
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              style={{
                ...theme.buttons.primary.base,
                width: '100%',
                marginTop: '8px',
                ...(changingPassword && theme.buttons.primary.disabled)
              }}
            >
              {changingPassword ? 'Updating password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div style={{
        padding: '32px',
        borderRadius: theme.radius.lg,
        border: `1px solid rgba(82, 82, 82, 0.3)`,
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          fontSize: '18px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          marginBottom: '24px'
        }}>
          Danger Zone
        </div>

        <div style={{
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border.light}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: theme.spacing[4]
        }}>
          <div>
            <div style={{
              fontSize: '15px',
              color: theme.colors.text.primary,
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              Delete Account
            </div>
            <div style={{
              fontSize: '13px',
              color: theme.colors.text.tertiary
            }}>
              Permanently delete your account and all data
            </div>
          </div>
          <button
            onClick={() => setConfirmDeleteAccount(true)}
            style={{
              ...theme.buttons.danger.base,
              whiteSpace: 'nowrap'
            }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )




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
    <Sidebar>
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        paddingTop: '64px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Settings
            </h1>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Manage your account and review workflow preferences
            </p>
          </div>


          {/* Account Content */}
          {renderAccountTab()}

        </div>
      </div>

      {/* Downgrade Confirmation Modal */}
      {showDowngradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowDowngradeModal(false)}
        >
          <div style={{
            background: theme.colors.bg.secondary,
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            border: `1px solid ${theme.colors.border.light}`
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: '16px',
              letterSpacing: '-0.02em'
            }}>
              Switch to Free Plan?
            </div>

            <div style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              marginBottom: '24px',
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              You'll lose access to these Pro features:
            </div>

            <div style={{
              background: theme.colors.bg.tertiary,
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '32px'
            }}>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                lineHeight: '1.8',
                fontWeight: '400'
              }}>
                <li>Advanced review analytics & insights</li>
                <li>Private review workspaces</li>
                <li>Custom review workflows</li>
                <li>Bulk file operations</li>
                <li>Advanced project templates</li>
                <li>Multi-reviewer coordination</li>
                <li>200 active review projects to 20 projects</li>
                <li>50GB file storage to 2GB storage</li>
              </ul>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowDowngradeModal(false)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors.border.light}`,
                  background: 'transparent',
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDowngradeToFree}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Yes, Switch to Free
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal
        isOpen={confirmDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This cannot be undone."
        onConfirm={() => {
          setConfirmDeleteAccount(false)
          toast.info('Account deletion would be processed here')
        }}
        onCancel={() => setConfirmDeleteAccount(false)}
        confirmText="Delete Account"
        cancelText="Cancel"
        danger={true}
      />
    </Sidebar>
  )
}

export default Settings
