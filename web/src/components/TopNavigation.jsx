import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import theme from '../theme'

function TopNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/'
    }
    return location.pathname === path
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/collaboration', label: 'Collaboration' },
    { path: '/projects', label: 'Reviews' },
    { path: '/notifications', label: 'Notifications' },
    { path: '/settings', label: 'Settings' }
  ]

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: theme.colors.black,
      borderBottom: `1px solid ${theme.colors.border.medium}`,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px'
    }}>

      {/* Left side - Logo and Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '48px'
      }}>

        {/* Logo */}
        <Link to="/dashboard" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          color: theme.colors.white
        }}>
          <img
            src="/logo.png"
            alt="Sway Logo"
            style={{
              width: '28px',
              height: '28px'
            }}
          />
          <span style={{
            fontSize: '17px',
            fontWeight: '600',
            letterSpacing: '-0.02em'
          }}>
            Sway
          </span>
        </Link>

        {/* Navigation Items */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: isActive(item.path) ? theme.colors.white : theme.colors.text.secondary,
                textDecoration: 'none',
                padding: '12px 16px',
                borderRadius: '6px',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.color = theme.colors.text.primary
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.color = theme.colors.text.secondary
                  e.target.style.background = 'transparent'
                }
              }}
            >
              {item.label}
              {isActive(item.path) && (
                <div style={{
                  position: 'absolute',
                  bottom: '-9px',
                  left: '16px',
                  right: '16px',
                  height: '2px',
                  background: theme.colors.white,
                  borderRadius: '1px'
                }} />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Right side - User Menu */}
      <div style={{
        position: 'relative'
      }}>
        <button
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'transparent',
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: '8px',
            padding: '8px 12px',
            color: theme.colors.text.primary,
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = theme.colors.text.secondary
            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = theme.colors.border.medium
            e.target.style.background = 'transparent'
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: theme.colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: theme.colors.black
          }}>
            {(user.email?.[0] || 'U').toUpperCase()}
          </div>
          <span>{user.email?.split('@')[0] || 'User'}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease'
            }}
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* User Dropdown */}
        {userDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '220px',
            background: theme.colors.black,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
          }}>

            {/* User Info */}
            <div style={{
              padding: '16px',
              borderBottom: `1px solid ${theme.colors.border.medium}`
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {user.email?.split('@')[0] || 'User'}
              </div>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.secondary
              }}>
                {user.email || 'No email'}
              </div>
            </div>

            {/* Menu Items */}
            <div>
              <Link
                to="/plan"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: theme.colors.text.primary,
                  textDecoration: 'none',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                }}
              >
                Plan & Billing
              </Link>

              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: theme.colors.text.primary,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default TopNavigation