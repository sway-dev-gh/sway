import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function TeamAccess() {
  const navigate = useNavigate()
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, email: 'john@company.com', role: 'Admin', status: 'Active' },
    { id: 2, email: 'sarah@company.com', role: 'Member', status: 'Active' }
  ])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [loading, setLoading] = useState(false)

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return

    setLoading(true)

    // TODO: Implement actual team member invitation
    setTimeout(() => {
      setTeamMembers([...teamMembers, {
        id: teamMembers.length + 1,
        email: inviteEmail,
        role: inviteRole === 'admin' ? 'Admin' : 'Member',
        status: 'Pending'
      }])
      setInviteEmail('')
      setLoading(false)
    }, 1000)
  }

  const handleRemoveMember = (id) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setTeamMembers(teamMembers.filter(m => m.id !== id))
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
                  disabled={loading || teamMembers.length >= 5}
                  style={{
                    padding: '12px 24px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    cursor: (loading || teamMembers.length >= 5) ? 'not-allowed' : 'pointer',
                    opacity: (loading || teamMembers.length >= 5) ? 0.6 : 1,
                    transition: theme.transition.normal,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {loading ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>

              <div style={{
                fontSize: '12px',
                color: theme.colors.text.tertiary
              }}>
                {teamMembers.length}/5 team members
              </div>
            </form>
          </div>

          {/* Team Members List */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${theme.colors.border.light}`
            }}>
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
                padding: '60px 24px',
                textAlign: 'center',
                color: theme.colors.text.muted,
                fontSize: '14px'
              }}>
                No team members yet. Invite someone to get started.
              </div>
            ) : (
              <div>
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      padding: '20px 24px',
                      borderBottom: `1px solid ${theme.colors.border.light}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: theme.transition.fast
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium,
                        marginBottom: '4px'
                      }}>
                        {member.email}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: theme.colors.text.muted
                      }}>
                        {member.role} • {member.status}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: theme.weight.medium,
                        color: theme.colors.text.secondary,
                        cursor: 'pointer',
                        transition: theme.transition.normal
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.border.strong
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

          {/* Permissions Info */}
          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border.light}`
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.primary,
              margin: '0 0 12px 0'
            }}>
              Permission Levels
            </h4>
            <div style={{
              fontSize: '13px',
              color: theme.colors.text.muted,
              lineHeight: '1.8'
            }}>
              <div style={{ marginBottom: '6px' }}>
                <strong style={{ color: theme.colors.text.secondary }}>Admin:</strong> Full access to all features, can manage team members
              </div>
              <div>
                <strong style={{ color: theme.colors.text.secondary }}>Member:</strong> Can create requests, view uploads, download files
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TeamAccess
