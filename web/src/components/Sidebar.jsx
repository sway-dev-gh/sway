import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import theme from '../theme'
import api from '../api/axios'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState({ email: '' })
  const [stats, setStats] = useState({ totalRequests: 0, totalUploads: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
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

  const navSections = [
    {
      items: [
        { path: '/dashboard', label: 'Dashboard', planRequired: null },
        { path: '/requests', label: 'Requests', planRequired: null }
      ]
    },
    {
      items: [
        { path: '/files', label: 'Files', planRequired: null },
        { path: '/notifications', label: 'Notifications', planRequired: null },
        { path: '/templates', label: 'Templates', planRequired: null }
      ]
    },
    {
      items: [
        { path: '/support', label: 'Support', planRequired: 'pro' },
        { path: '/branding', label: 'Branding', planRequired: 'pro' }
      ]
    },
    {
      items: [
        { path: '/custom-domain', label: 'Custom Domain', planRequired: 'business' },
        { path: '/team-access', label: 'Team Access', planRequired: 'business' },
        { path: '/dropbox-sync', label: 'Dropbox Sync', planRequired: 'business' }
      ]
    },
    {
      items: [
        { path: '/plan', label: 'Plan', planRequired: null },
        { path: '/billing', label: 'Billing', planRequired: null },
        { path: '/settings', label: 'Settings', planRequired: null }
      ]
    }
  ]

  // Helper to check if user has access to a feature
  const hasAccess = (requiredPlan) => {
    if (!requiredPlan) return true // Free features
    const userPlan = user.plan?.toLowerCase() || 'free'
    if (requiredPlan === 'pro') {
      return userPlan === 'pro' || userPlan === 'business'
    }
    if (requiredPlan === 'business') {
      return userPlan === 'business'
    }
    return false
  }

  // Helper to get upgrade plan needed
  const getUpgradePlan = (requiredPlan) => {
    if (requiredPlan === 'pro') return 'Pro'
    if (requiredPlan === 'business') return 'Business'
    return null
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
    justifyContent: 'space-between',
    padding: `0 ${theme.spacing[6]}`
  }

  const navLinkStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
    textDecoration: 'none',
    fontSize: theme.fontSize.sm,
    fontWeight: isActive ? theme.weight.medium : theme.weight.normal,
    background: isActive ? theme.colors.bg.hover : 'transparent',
    borderRadius: theme.radius.sm,
    transition: `all ${theme.transition.fast}`,
    marginRight: theme.spacing[2]
  })

  return (
    <div style={topBarStyle}>
      {/* Left Section - Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing[6]
      }}>
        {/* Logo/Brand */}
        <div style={{
          fontSize: '18px',
          fontWeight: theme.weight.semibold,
          color: theme.colors.text.primary
        }}>
          Sway
        </div>

        {/* Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{ display: 'flex', alignItems: 'center' }}>
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
                  margin: `0 ${theme.spacing[4]}`
                }} />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right Section - Stats and User */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing[6]
      }}>
        {/* Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[4]
        }}>
          {/* Total Requests */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
            padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
            background: 'transparent',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.radius.sm,
            transition: `all ${theme.transition.fast}`
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '400',
              color: theme.colors.text.secondary
            }}>
              {stats.totalRequests}
            </div>
            <div style={{
              fontSize: '10px',
              color: theme.colors.text.tertiary,
              opacity: 0.7
            }}>
              Requests
            </div>
          </div>

          {/* Total Files */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
            padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
            background: 'transparent',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.radius.sm,
            transition: `all ${theme.transition.fast}`
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '400',
              color: theme.colors.text.secondary
            }}>
              {stats.totalUploads}
            </div>
            <div style={{
              fontSize: '10px',
              color: theme.colors.text.tertiary,
              opacity: 0.7
            }}>
              Files
            </div>
          </div>
        </div>

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
                color: user.plan?.toLowerCase() === 'business' ? theme.colors.white :
                       user.plan?.toLowerCase() === 'pro' ? theme.colors.text.primary :
                       theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                padding: '3px 8px',
                background: user.plan?.toLowerCase() === 'business' ? theme.colors.black :
                           user.plan?.toLowerCase() === 'pro' ? 'rgba(255, 255, 255, 0.1)' :
                           theme.colors.bg.secondary,
                border: `1px solid ${
                  user.plan?.toLowerCase() === 'business' ? theme.colors.white :
                  user.plan?.toLowerCase() === 'pro' ? theme.colors.border.medium :
                  theme.colors.border.medium
                }`,
                borderRadius: '4px'
              }}>
                {user.plan || 'Free'}
              </div>
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
  )
}

export default Sidebar
