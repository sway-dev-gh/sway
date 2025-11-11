import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import theme from '../theme'
import api from '../api/axios'
import AdminModeActivator from './AdminModeActivator'
import AIAssistant from './AIAssistant'
import { getEffectivePlan, getPlanInfo } from '../utils/planUtils'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState({ email: '' })
  const [stats, setStats] = useState({ totalRequests: 0, totalUploads: 0 })
  const [loading, setLoading] = useState(true)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  // Calculate effective plan using centralized utility
  const effectivePlan = getEffectivePlan()
  const planInfo = getPlanInfo()

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

      const pages = ['/dashboard', '/management', '/plan', '/notifications', '/settings']
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
        { path: '/management', label: 'Management', planRequired: null },
        { path: '/plan', label: 'Plan', planRequired: null },
        { path: '/notifications', label: 'Notifications', planRequired: null },
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
    fontSize: '14px',
    fontWeight: isActive ? theme.weight.medium : theme.weight.normal,
    background: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    height: '32px',
    transition: 'all 0.15s ease'
  })

  return (
    <>
    <div style={topBarStyle}>
      {/* Mobile Hamburger Menu */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-nav"
        style={{
          display: 'none',
          background: 'transparent',
          border: 'none',
          color: theme.colors.white,
          fontSize: '24px',
          cursor: 'pointer',
          padding: '8px',
          marginRight: '12px',
          '@media (max-width: 768px)': {
            display: 'block'
          }
        }}
        className="mobile-menu-btn"
      >
        ☰
      </button>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .mobile-nav {
            display: flex !important;
          }
        }
      `}</style>
      {/* Logo/Brand */}
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <img
          src="/logo.png"
          alt="Sway"
          style={{
            width: '48px',
            height: '48px',
            flexShrink: 0
          }}
        />
      </Link>

      {/* Navigation Links */}
      <nav
        className="desktop-nav"
        role="navigation"
        aria-label="Main navigation"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
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
                        fontSize: '10px',
                        fontWeight: theme.weight.semibold,
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        padding: '2px 6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${theme.colors.border.light}`,
                        borderRadius: '3px'
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
                    aria-current={isActive ? 'page' : undefined}
                    style={navLinkStyle(isActive)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                        e.currentTarget.style.color = theme.colors.text.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = theme.colors.text.secondary
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

      {/* Right Section - AI + User */}
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing[3]
      }}>
        {/* AI Assistant Button */}
        <button
          onClick={() => setShowAIAssistant(true)}
          aria-label="Open AI Assistant"
          style={{
            padding: '6px 14px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
            color: theme.colors.text.primary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))'
            e.currentTarget.style.borderColor = theme.colors.border.medium
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))'
            e.currentTarget.style.borderColor = theme.colors.border.light
          }}
        >
          <span style={{ fontSize: '14px' }}>✨</span>
          AI Assistant
        </button>
      </div>

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
                fontSize: '10px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '3px 7px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: '4px'
              }}>
                {effectivePlan || 'Free'}
              </div>
              {isAdminMode && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.black,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '3px 7px',
                  background: theme.colors.white,
                  border: 'none',
                  borderRadius: '4px'
                }}>
                  Admin
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            aria-label="Sign out of your account"
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: theme.colors.text.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
              e.currentTarget.style.color = theme.colors.text.primary
              e.currentTarget.style.borderColor = theme.colors.border.medium
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = theme.colors.text.secondary
              e.currentTarget.style.borderColor = theme.colors.border.light
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>

    {/* Mobile Navigation Menu */}
    {mobileMenuOpen && (
      <div
        id="mobile-nav"
        className="mobile-nav"
        role="navigation"
        aria-label="Mobile navigation"
        style={{
          display: 'none',
          position: 'fixed',
          top: '54px',
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.colors.bg.page,
          zIndex: 99,
          padding: '20px',
          overflowY: 'auto'
        }}
      >
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} style={{ marginBottom: '24px' }}>
            {section.items.map((item) => {
              const isActive = location.pathname === item.path
              const locked = !hasAccess(item.planRequired)
              const upgradePlan = locked ? getUpgradePlan(item.planRequired) : null

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '16px',
                    marginBottom: '8px',
                    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: isActive ? theme.weight.medium : theme.weight.normal,
                    background: isActive ? theme.colors.bg.hover : 'transparent',
                    borderRadius: theme.radius.md,
                    opacity: locked ? 0.5 : 1
                  }}
                >
                  {item.label}
                  {locked && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '10px',
                      fontWeight: theme.weight.bold,
                      color: theme.colors.text.tertiary,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      background: theme.colors.bg.secondary,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '3px'
                    }}>
                      {upgradePlan}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Mobile User Section */}
        <div style={{
          padding: '20px',
          marginTop: '24px',
          borderTop: `1px solid ${theme.colors.border.light}`
        }}>
          <div style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            marginBottom: '12px'
          }}>
            {user.email?.split('@')[0] || 'User'}
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: theme.weight.bold,
            color: theme.colors.text.tertiary,
            marginBottom: '16px'
          }}>
            {effectivePlan || 'Free'} Plan
          </div>
          <button
            onClick={handleLogout}
            style={{
              ...theme.buttons.secondary.base,
              width: '100%'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    )}

    {/* Admin Mode Activator */}
    <AdminModeActivator onActivate={handleAdminActivate} />

    {/* AI Assistant Modal */}
    <AIAssistant isOpen={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
    </>
  )
}

export default Sidebar
