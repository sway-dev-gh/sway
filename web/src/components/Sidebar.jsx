import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import theme from '../theme'

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
      if (!token) return

      const userStr = localStorage.getItem('user')
      if (userStr) {
        setUser(JSON.parse(userStr))
      }

      const response = await fetch('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const requests = data.requests || []
        const totalUploads = requests.reduce((sum, req) => sum + (req.uploadCount || 0), 0)
        setStats({
          totalRequests: requests.length,
          totalUploads
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
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
    { path: '/dashboard', label: 'Dashboard', icon: '■' },
    { path: '/requests', label: 'Requests', icon: '■' },
    { path: '/plan', label: 'Plan', icon: '■' },
    { path: '/settings', label: 'Settings', icon: '■' }
  ]

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '260px',
    background: theme.colors.bg.sidebar,
    borderRight: `1px solid ${theme.colors.border.medium}`,
    zIndex: 100
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
    gap: theme.spacing[3],
    padding: `12px ${theme.spacing[4]}`,
    margin: `2px ${theme.spacing[4]}`,
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

  return (
    <div style={sidebarStyle}>
      {/* Navigation */}
      <nav style={{ padding: `${theme.spacing[6]} 0` }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
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
              <span style={{ fontSize: '6px', opacity: 0.6 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div style={userSectionStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[3],
          marginBottom: theme.spacing[3]
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: theme.fontSize.sm,
              fontWeight: theme.weight.medium,
              color: theme.colors.text.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user.email?.split('@')[0] || 'User'}
            </div>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.text.tertiary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
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
            padding: theme.spacing[2],
            fontSize: theme.fontSize.sm,
            borderRadius: theme.radius.md,
            fontWeight: theme.weight.medium,
            width: '100%',
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
  )
}

export default Sidebar
