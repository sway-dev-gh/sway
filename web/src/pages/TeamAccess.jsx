import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function TeamAccess() {
  const navigate = useNavigate()
  const [teamMembers, setTeamMembers] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Check if user has access (Business or Admin)
  useEffect(() => {
    const adminKey = localStorage.getItem('adminKey')
    const isAdmin = !!adminKey

    if (!isAdmin) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const userPlan = user.plan?.toLowerCase() || 'free'
        if (userPlan !== 'business') {
          navigate('/plan')
        }
      }
    }
  }, [navigate])

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.get('/api/team/members', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTeamMembers(data.teamMembers || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setInitialLoad(false)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const { data } = await api.post('/api/team/members', {
        email: inviteEmail,
        role: inviteRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTeamMembers([...teamMembers, data.teamMember])
      setInviteEmail('')
      alert('Team member invited successfully!')
    } catch (error) {
      console.error('Error inviting team member:', error)
      if (error.response?.status === 403) {
        alert('Business plan required for team access')
      } else if (error.response?.data?.error) {
        alert(error.response.data.error)
      } else {
        alert('Failed to invite team member')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (id) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const token = localStorage.getItem('token')
      await api.delete(`/api/team/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTeamMembers(teamMembers.filter(m => m.id !== id))
      alert('Team member removed successfully')
    } catch (error) {
      console.error('Error removing team member:', error)
      alert('Failed to remove team member')
    }
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '60px 40px'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: 0,
              color: theme.colors.text.primary
            }}>
              Team Access
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Invite up to 5 team members to collaborate (Business Plan)
            </p>
          </div>

          {/* Invite Form */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            padding: '32px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.primary,
              margin: '0 0 20px 0'
            }}>
              Invite Team Member
            </h3>

            <form onSubmit={handleInvite}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@company.com"
                  required
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '8px',
                    color: theme.colors.text.primary,
                    fontSize: '14px'
                  }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '8px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    cursor: 'pointer',
                    minWidth: '120px'
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: theme.weight.medium,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: theme.transition.normal,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {loading ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>

            <p style={{
              fontSize: '12px',
              color: theme.colors.text.tertiary,
              margin: '8px 0 0 0'
            }}>
              {teamMembers.length} / 5 team members
            </p>
          </div>

          {/* Team Members List */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${theme.colors.border.light}` }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: theme.weight.medium,
                color: theme.colors.text.primary,
                margin: 0
              }}>
                Team Members
              </h3>
            </div>

            {teamMembers.length === 0 ? (
              <div style={{
                padding: '60px 32px',
                textAlign: 'center',
                color: theme.colors.text.muted,
                fontSize: '14px'
              }}>
                No team members yet. Invite your first team member above.
              </div>
            ) : (
              <div>
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      padding: '20px 32px',
                      borderBottom: `1px solid ${theme.colors.border.light}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: theme.weight.medium,
                        color: theme.colors.text.primary,
                        marginBottom: '4px'
                      }}>
                        {member.email}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: theme.colors.text.tertiary
                      }}>
                        Role: {member.role} • Status: {member.status}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: '6px',
                        color: theme.colors.text.secondary,
                        fontSize: '12px',
                        fontWeight: theme.weight.medium,
                        cursor: 'pointer',
                        transition: theme.transition.normal
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.text.tertiary
                        e.currentTarget.style.color = theme.colors.text.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.border.medium
                        e.currentTarget.style.color = theme.colors.text.secondary
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default TeamAccess
