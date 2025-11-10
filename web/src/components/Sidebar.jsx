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

    // Listen for keyboard shortcuts
    const handleKeyDown = (e) => {
      // Control+Tab to exit admin mode
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault()
        if (localStorage.getItem('adminKey')) {
          localStorage.removeItem('adminKey')
          window.location.reload()
        }
        return
      }

      // Arrow keys for navigation (only when not typing in an input)
      const activeElement = document.activeElement
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      )

      if (isTyping) return

      const pages = ['/dashboard', '/requests', '/responses', '/plan', '/faq', '/settings']
      const currentIndex = pages.indexOf(location.pathname)

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault()
        navigate(pages[currentIndex - 1])
      } else if (e.key === 'ArrowRight' && currentIndex < pages.length - 1) {
        e.preventDefault()
        navigate(pages[currentIndex + 1])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [location.pathname, navigate])

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
        { path: '/requests', label: 'Builder', planRequired: null },
        { path: '/responses', label: 'Tracking', planRequired: null },
        { path: '/plan', label: 'Plan', planRequired: null },
        { path: '/faq', label: 'FAQ', planRequired: null },
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
    height: '54px',
    background: theme.colors.bg.sidebar,
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: '30px'
  }

  const navLinkStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: `6px 12px`,
    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: isActive ? theme.weight.medium : theme.weight.normal,
    background: isActive ? theme.colors.bg.hover : 'transparent',
    borderRadius: theme.radius.md,
        whiteSpace: 'nowrap',
    height: '30px'
  })

  return (
    <>
    <div style={topBarStyle}>
      {/* Logo/Brand */}
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <img
          src="/logo.svg"
          alt="Sway"
          style={{
            width: '30px',
            height: '30px',
            flexShrink: 0
          }}
        />
      </Link>

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
                      title={`Upgrade to ${upgradePlan} to unlock`}
                    >
                      <span>{item.label}</span>
                      <span style={{
                        fontSize: '11px',
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
              width: '28px',
              height: '28px',
              borderRadius: theme.radius.full,
              background: theme.colors.black,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.white,
              border: `2px solid ${theme.colors.border.medium}`
            }}>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
              <div style={{
                fontSize: '15px',
                fontWeight: theme.weight.medium,
                color: theme.colors.text.primary
              }}>
                {user.email?.split('@')[0] || 'User'}
              </div>
              <div style={{
                fontSize: '11px',
                fontWeight: theme.weight.bold,
                color: effectivePlan?.toLowerCase() === 'pro' ? theme.colors.text.primary :
                       theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '2px 6px',
                background: effectivePlan?.toLowerCase() === 'pro' ? 'rgba(255, 255, 255, 0.1)' :
                           theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: '3px'
              }}>
                {effectivePlan || 'Free'}
              </div>
              {isAdminMode && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: theme.weight.bold,
                  color: theme.colors.black,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '2px 6px',
                  background: theme.colors.white,
                  border: `1px solid ${theme.colors.white}`,
                  borderRadius: '3px'
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
              padding: `6px 12px`,
              fontSize: '14px',
              fontWeight: theme.weight.medium,
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
