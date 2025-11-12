import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Collaboration = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active') // active, all, reviewing

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])

        // Mock team data for now
        setTeamMembers([
          { id: 1, name: 'You', email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'user@example.com', role: 'Owner', active: true },
        ])

        setRecentActivity([
          { id: 1, action: 'You signed up for SwayFiles', time: 'Just now', type: 'user' },
          { id: 2, action: 'Team workspace created', time: '2 minutes ago', type: 'system' },
        ])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredProjects = () => {
    if (filter === 'active') {
      return projects.filter(p => p.status === 'under_review' || p.status === 'draft')
    }
    if (filter === 'reviewing') {
      return projects.filter(p => p.pending_approvals > 0)
    }
    return projects
  }

  const openProjectWorkspace = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  const getStatusColor = (status) => {
    const statusMap = {
      'draft': '#ffffff',
      'under_review': '#ffffff',
      'changes_requested': '#ff6b6b',
      'approved': '#51cf66',
      'delivered': '#4c6ef5'
    }
    return statusMap[status] || '#ffffff'
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          color: '#ffffff',
          paddingTop: '68px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '48px 32px'
          }}>
            <div>Loading collaboration workspace...</div>
          </div>
        </div>
      </>
    )
  }

  const filteredProjects = getFilteredProjects()

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        paddingTop: '68px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 24px'
        }}>

          {/* Header Section */}
          <div style={{
            marginBottom: '60px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0 0 16px 0',
              letterSpacing: '-0.02em'
            }}>
              Team Collaboration
            </h1>
            <p style={{
              fontSize: '20px',
              color: '#ffffff',
              margin: '0',
              fontWeight: '400'
            }}>
              Work together on projects and reviews
            </p>
          </div>

          {/* Team Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            marginBottom: '80px'
          }}>
            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#ffffff',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.1em',
                marginBottom: '16px'
              }}>
                Team Members
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1'
              }}>
                {teamMembers.length}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#ffffff',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.1em',
                marginBottom: '16px'
              }}>
                Shared Projects
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1'
              }}>
                {projects.length}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#ffffff',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.1em',
                marginBottom: '16px'
              }}>
                Active Reviews
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1'
              }}>
                {projects.filter(p => p.status === 'under_review').length}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#ffffff',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.1em',
                marginBottom: '16px'
              }}>
                Team Activity
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1'
              }}>
                {recentActivity.length}
              </div>
            </div>
          </div>

          {/* Team Workspace Sections */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '32px',
            marginBottom: '60px'
          }}>

            {/* Team Members */}
            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 24px 0'
              }}>
                Team Members
              </h2>
              {teamMembers.map(member => (
                <div key={member.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 0',
                  borderBottom: '1px solid #333333'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#333333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {member.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#ffffff'
                    }}>
                      {member.name}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#ffffff',
                      opacity: 0.7
                    }}>
                      {member.role} • {member.email}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    background: member.active ? '#51cf66' : '#333333',
                    color: '#000000',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {member.active ? 'Active' : 'Offline'}
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/settings')}
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: '16px',
                  width: '100%'
                }}
              >
                Invite Team Members
              </button>
            </div>

            {/* Recent Activity */}
            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 24px 0'
              }}>
                Recent Activity
              </h2>
              {recentActivity.map(activity => (
                <div key={activity.id} style={{
                  padding: '16px 0',
                  borderBottom: '1px solid #333333'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '4px'
                  }}>
                    {activity.action}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#ffffff',
                    opacity: 0.6
                  }}>
                    {activity.time}
                  </div>
                </div>
              ))}
              <div style={{
                textAlign: 'center',
                marginTop: '24px',
                padding: '20px',
                border: '1px dashed #333333',
                borderRadius: '4px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#ffffff',
                  opacity: 0.7
                }}>
                  Start collaborating to see more activity
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            <button
              onClick={() => navigate('/projects')}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '40px 32px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                Create Project
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', opacity: 0.8 }}>
                Start a new collaborative project
              </div>
            </button>

            <button
              onClick={() => navigate('/uploads')}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '40px 32px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                Share Files
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', opacity: 0.8 }}>
                Upload files for team review
              </div>
            </button>

            <button
              onClick={() => navigate('/settings')}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '40px 32px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                Team Settings
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', opacity: 0.8 }}>
                Manage team and permissions
              </div>
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

export default Collaboration