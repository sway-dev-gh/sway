import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import TopNavigation from '../components/TopNavigation'
import theme from '../theme'
import api from '../api/axios'
import { standardStyles } from '../components/StandardStyles'

function Collaboration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [activeCollaborations, setActiveCollaborations] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchCollaborationData()
  }, [navigate])

  const fetchCollaborationData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      // Fetch collaboration data from APIs
      const [teamResponse, activityResponse, collaborationsResponse] = await Promise.all([
        api.get('/api/team', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/activity', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/collaborations', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      setTeamMembers(teamResponse.data.team || [])
      setRecentActivity(activityResponse.data.activity || [])
      setActiveCollaborations(collaborationsResponse.data.collaborations || [])
    } catch (error) {
      console.error('Failed to fetch collaboration data:', error)
      // Set empty arrays for clean state
      setTeamMembers([])
      setRecentActivity([])
      setActiveCollaborations([])
    } finally {
      setLoading(false)
    }
  }

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
      <TopNavigation />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        paddingTop: '64px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '48px 32px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={standardStyles.pageHeader}>
              Collaboration
            </h1>
            <p style={standardStyles.pageDescription}>
              Work together with your team on reviews, share feedback, and track progress
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>

            {/* Active Collaborations */}
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                fontWeight: '500',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Active Collaborations
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                {activeCollaborations.length}
              </div>
              <Link to="/projects" style={{
                color: theme.colors.text.secondary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                View all projects →
              </Link>
            </div>

            {/* Team Members */}
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                fontWeight: '500',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Team Members
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                {teamMembers.length}
              </div>
              <Link to="/clients" style={{
                color: theme.colors.text.secondary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Manage team →
              </Link>
            </div>

            {/* Recent Activity */}
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                fontWeight: '500',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Recent Actions
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                {recentActivity.length}
              </div>
              <Link to="/notifications" style={{
                color: theme.colors.text.secondary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                View activity →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px',
            padding: '32px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}>
              Quick Actions
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <Link to="/projects" style={{
                background: 'transparent',
                color: theme.colors.text.primary,
                padding: '16px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                textAlign: 'center',
                border: `1px solid ${theme.colors.border.light}`,
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}>
                + Start Collaboration
              </Link>
              <Link to="/clients" style={{
                background: 'transparent',
                color: theme.colors.text.primary,
                padding: '16px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                textAlign: 'center',
                fontSize: '14px',
                border: `1px solid ${theme.colors.border.light}`,
                transition: 'all 0.2s ease'
              }}>
                Invite Team Member
              </Link>
              <Link to="/notifications" style={{
                background: 'transparent',
                color: theme.colors.text.primary,
                padding: '16px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                textAlign: 'center',
                fontSize: '14px',
                border: `1px solid ${theme.colors.border.light}`,
                transition: 'all 0.2s ease'
              }}>
                View Messages
              </Link>
            </div>
          </div>

          {/* Empty State Message */}
          {activeCollaborations.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '80px 32px',
              marginTop: '48px'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '24px',
                opacity: 0.3
              }}>
                ◯
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                margin: '0 0 16px 0'
              }}>
                Start Collaborating with Your Team
              </h3>
              <p style={{
                fontSize: '16px',
                color: theme.colors.text.secondary,
                marginBottom: '32px',
                maxWidth: '500px',
                margin: '0 auto 32px auto'
              }}>
                Invite team members, share projects, and collaborate on reviews to get better feedback faster.
              </p>
              <Link to="/projects" style={{
                background: 'transparent',
                color: theme.colors.text.primary,
                padding: '16px 32px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                border: `1px solid ${theme.colors.border.light}`,
                fontSize: '14px',
                display: 'inline-block'
              }}>
                Start Your First Collaboration
              </Link>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Collaboration