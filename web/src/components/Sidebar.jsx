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
      // Set defaults on error to prevent rendering issues
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

  const navItems = [
    { path: '/requests', label: 'Requests', icon: '■' },
    { path: '/plan', label: 'Plan', icon: '■' },
    { path: '/settings', label: 'Settings', icon: '■' }
  ]

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '60px',
    background: theme.colors.bg.sidebar,
    borderRight: `1px solid ${theme.colors.border.medium}`,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }

  const topBarStyle = {
    position: 'fixed',
    top: 0,
    left: '60px',
    right: 0,
    height: '60px',
    background: theme.colors.bg.sidebar,
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    zIndex: 99,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${theme.spacing[6]}`
  }

  const logoStyle = {
    padding: `${theme.spacing[8]} ${theme.spacing[6]} ${theme.spacing[6]}`,
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[3],
    minHeight: '80px'
  }

  const navLinkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    padding: `10px ${theme.spacing[3]}`,
    margin: `1px ${theme.spacing[3]}`,
    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
    textDecoration: 'none',
    fontSize: theme.fontSize.sm,
    fontWeight: isActive ? theme.weight.medium : theme.weight.normal,
    background: isActive ? theme.colors.bg.hover : 'transparent',
    borderRadius: theme.radius.md,
    transition: `all ${theme.transition.fast}`
  })

  const userSectionStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing[4],
    borderTop: `1px solid ${theme.colors.border.medium}`,
    background: theme.colors.bg.sidebar
  }

  const iconButtonStyle = (isActive) => ({
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    background: isActive ? theme.colors.bg.hover : 'transparent',
    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
    transition: `all ${theme.transition.fast}`,
    marginBottom: theme.spacing[2],
    textDecoration: 'none',
    fontSize: '18px'
  })

  return (
    <>
      {/* Thin Left Sidebar - Icon Navigation Only */}
      <div style={sidebarStyle}>
        {/* Logo/Brand Icon */}
        <div style={logoStyle}>
          <span style={{ fontSize: '20px' }}>■</span>
        </div>

        {/* Navigation Icons */}
        <nav style={{ padding: `${theme.spacing[4]} 0`, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                style={iconButtonStyle(isActive)}
                title={item.label}
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
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Top Bar - Insights and User Section */}
      <div style={topBarStyle}>
        {/* Insights - Horizontal Layout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[4]
        }}>
          <div style={{
            fontSize: '10px',
            color: theme.colors.text.tertiary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: theme.weight.normal,
            opacity: 0.6
          }}>
            Insights
          </div>

          {/* Total Requests */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
            padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
            background: 'transparent',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.radius.sm
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
            borderRadius: theme.radius.sm
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

        {/* User Section - Horizontal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[4]
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[3]
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: theme.radius.full,
              background: theme.colors.black,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: theme.fontSize.sm,
              fontWeight: theme.weight.semibold,
              color: theme.colors.white,
              border: `2px solid ${theme.colors.border.medium}`
            }}>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                color: theme.colors.text.primary
              }}>
                {user.email?.split('@')[0] || 'User'}
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.tertiary
              }}>
                {user.email || 'Loading...'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.border.medium}`,
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
              fontSize: theme.fontSize.sm,
              borderRadius: theme.radius.md,
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
    </>
  )
}

export default Sidebar
