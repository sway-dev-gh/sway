import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import theme from '../theme'
import api from '../api/axios'
import AdminModeActivator from './AdminModeActivator'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState({ email: '' })
  const [stats, setStats] = useState({ totalRequests: 0, totalUploads: 0 })
  const [loading, setLoading] = useState(true)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)

  // Calculate effective plan (admin override or user plan)
  const adminPlanOverride = localStorage.getItem('adminPlanOverride')
  const effectivePlan = isAdminMode && adminPlanOverride ? adminPlanOverride : (user.plan || 'free')

  useEffect(() => {
    // Check for admin mode
    const adminKey = localStorage.getItem('adminKey')
    setIsAdminMode(!!adminKey)
    fetchData()

    // Listen for Control+Tab to exit admin mode
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault()
        if (localStorage.getItem('adminKey')) {
          localStorage.removeItem('adminKey')
          window.location.reload()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const userStr = localStorage.getItem('user')
      if (userStr) {
        setUser(JSON.parse(userStr))
      }

      const { data } = await api.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const requests = data.requests || []
      const totalUploads = requests.reduce((sum, req) => sum + (req.uploadCount || 0), 0)
      setStats({
        totalRequests: requests.length,
        totalUploads
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setStats({
        totalRequests: 0,
        totalUploads: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleAdminActivate = () => {
    setIsAdminMode(true)
    window.location.reload() // Reload to apply admin mode
  }

  const navSections = [
    {
      items: [
        { path: '/dashboard', label: 'Dashboard', planRequired: null },
        { path: '/requests', label: 'Requests', planRequired: null },
        { path: '/plan', label: 'Plan', planRequired: null },
        { path: '/settings', label: 'Settings', planRequired: null }
      ]
    }
  ]

  // Helper to check if user has access to a feature
  const hasAccess = (requiredPlan) => {
    if (isAdminMode) return true // Admin has access to everything
    if (!requiredPlan) return true // Free features
    const userPlan = user.plan?.toLowerCase() || 'free'
    // Only FREE and PRO plans now - pro gets everything
    return requiredPlan === 'pro' ? userPlan === 'pro' : true
  }

  // Helper to get upgrade plan needed
  const getUpgradePlan = (requiredPlan) => {
    return requiredPlan === 'pro' ? 'Pro' : null
  }

  const topBarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: theme.colors.bg.sidebar,
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: '32px'
  }

  const navLinkStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: `6px 12px`,
    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive ? theme.weight.medium : theme.weight.normal,
    background: isActive ? theme.colors.bg.hover : 'transparent',
    borderRadius: theme.radius.sm,
    transition: `all ${theme.transition.fast}`,
    whiteSpace: 'nowrap',
    height: '32px'
  })

  return (
    <>
    <div style={topBarStyle}>
      {/* Logo/Brand */}
      <div style={{
        fontSize: '20px',
        fontWeight: theme.weight.semibold,
        color: theme.colors.text.primary,
        flexShrink: 0
      }}>
        Sway
      </div>

      {/* Navigation Links */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path
                const locked = !hasAccess(item.planRequired)
                const upgradePlan = locked ? getUpgradePlan(item.planRequired) : null

                if (locked) {
                  // Render locked item (non-clickable with visual indicator)
                  return (
                    <div
                      key={item.path}
                      onClick={() => navigate('/plan')}
                      style={{
                        ...navLinkStyle(false),
                        opacity: 0.5,
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.colors.bg.hover
                        e.currentTarget.style.opacity = '0.7'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.opacity = '0.5'
                      }}
                      title={`Upgrade to ${upgradePlan} to unlock`}
                    >
                      <span>{item.label}</span>
                      <span style={{
                        fontSize: '8px',
                        fontWeight: theme.weight.semibold,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        padding: '2px 4px',
                        background: theme.colors.bg.secondary,
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: '2px'
                      }}>
                        {upgradePlan}
                      </span>
                    </div>
                  )
                }

                // Render normal accessible item
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={navLinkStyle(isActive)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = theme.colors.bg.hover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                )
              })}
              {sectionIndex < navSections.length - 1 && (
                <div style={{
                  width: '1px',
                  height: '20px',
                  background: theme.colors.border.medium,
                  margin: '0 12px',
                  alignSelf: 'center'
                }} />
              )}
            </div>
          ))}
      </nav>

      {/* Right Section - User */}
      <div style={{
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* User Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[3]
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2]
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: theme.radius.full,
              background: theme.colors.black,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.white,
              border: `2px solid ${theme.colors.border.medium}`
            }}>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                color: theme.colors.text.primary
              }}>
                {user.email?.split('@')[0] || 'User'}
              </div>
              <div style={{
                fontSize: '9px',
                fontWeight: theme.weight.bold,
                color: effectivePlan?.toLowerCase() === 'pro' ? theme.colors.text.primary :
                       theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                padding: '3px 8px',
                background: effectivePlan?.toLowerCase() === 'pro' ? 'rgba(255, 255, 255, 0.1)' :
                           theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: '4px'
              }}>
                {effectivePlan || 'Free'}
              </div>
              {isAdminMode && (
                <div style={{
                  fontSize: '9px',
                  fontWeight: theme.weight.bold,
                  color: theme.colors.black,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  padding: '3px 8px',
                  background: theme.colors.white,
                  border: `1px solid ${theme.colors.white}`,
                  borderRadius: '4px'
                }}>
                  ADMIN
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.sm,
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.weight.medium,
              transition: `all ${theme.transition.fast}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bg.hover
              e.currentTarget.style.color = theme.colors.text.primary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = theme.colors.text.secondary
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>

    {/* Admin Mode Activator */}
    <AdminModeActivator onActivate={handleAdminActivate} />
    </>
  )
}

export default Sidebar
