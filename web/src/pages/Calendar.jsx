import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import SchedulingSystem from '../components/SchedulingSystem'
import theme from '../theme'
import api from '../api/axios'

/**
 * Calendar Page
 *
 * Central calendar view for all appointments and meetings.
 * Provides overview and management of all scheduled activities.
 */
function Calendar() {
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingAppointments()
  }, [])

  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/appointments/upcoming', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setUpcomingAppointments(data.appointments || [])
    } catch (error) {
      console.error('Failed to fetch upcoming appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#ffffff'
      case 'scheduled': return '#a3a3a3'
      case 'cancelled': return '#525252'
      case 'completed': return '#808080'
      default: return theme.colors.text.secondary
    }
  }

  const getTimeUntil = (dateTime) => {
    const now = new Date()
    const appointmentDate = new Date(dateTime)
    const diffMs = appointmentDate - now
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
    } else if (diffMs > 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
    } else {
      return 'now'
    }
  }

  return (
    <Layout>
      <div style={{ padding: '48px 60px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '48px'
        }}>
          <div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '800',
              color: theme.colors.text.primary,
              letterSpacing: '-2px',
              marginBottom: '8px'
            }}>
              Calendar
            </h1>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              fontWeight: '500'
            }}>
              Schedule and manage all your appointments
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '40px',
          alignItems: 'flex-start'
        }}>
          {/* Main Calendar */}
          <div>
            <SchedulingSystem
              clientView={false}
              style={{
                minHeight: '600px'
              }}
            />
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Upcoming Appointments */}
            <div style={{
              background: theme.colors.bg.hover,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              padding: '20px'
            }}>
              <h3 style={{
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.base,
                fontWeight: theme.weight.semibold,
                marginBottom: '16px'
              }}>
                Upcoming Appointments
              </h3>

              {loading ? (
                <div style={{
                  textAlign: 'center',
                  color: theme.colors.text.secondary,
                  padding: '20px',
                  fontSize: theme.fontSize.sm
                }}>
                  Loading...
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: theme.colors.text.secondary,
                  padding: '20px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>◯</div>
                  <p style={{ fontSize: theme.fontSize.sm }}>
                    No upcoming appointments
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {upcomingAppointments.slice(0, 5).map(appointment => {
                    const { date, time } = formatDateTime(appointment.startTime)
                    return (
                      <Link
                        key={appointment.id}
                        to={`/projects/${appointment.projectId}?tab=calendar`}
                        style={{
                          background: theme.colors.bg.secondary,
                          border: `1px solid ${theme.colors.border.light}`,
                          borderRadius: theme.radius.md,
                          padding: '12px',
                          textDecoration: 'none',
                          transition: 'all 200ms'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = theme.colors.bg.page
                          e.target.style.borderColor = theme.colors.border.medium
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = theme.colors.bg.secondary
                          e.target.style.borderColor = theme.colors.border.light
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '4px'
                        }}>
                          <div style={{
                            color: theme.colors.text.primary,
                            fontSize: theme.fontSize.sm,
                            fontWeight: theme.weight.medium
                          }}>
                            {appointment.title}
                          </div>
                          <div style={{
                            padding: '2px 6px',
                            borderRadius: theme.radius.sm,
                            fontSize: theme.fontSize.xs,
                            fontWeight: theme.weight.semibold,
                            background: `${getStatusColor(appointment.status)}20`,
                            color: getStatusColor(appointment.status)
                          }}>
                            {appointment.status}
                          </div>
                        </div>
                        <div style={{
                          color: theme.colors.text.secondary,
                          fontSize: theme.fontSize.xs,
                          marginBottom: '2px'
                        }}>
                          {appointment.clientName || 'No client'}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            color: theme.colors.text.tertiary,
                            fontSize: theme.fontSize.xs
                          }}>
                            {date} at {time}
                          </div>
                          <div style={{
                            color: theme.colors.text.tertiary,
                            fontSize: theme.fontSize.xs,
                            fontStyle: 'italic'
                          }}>
                            {getTimeUntil(appointment.startTime)}
                          </div>
                        </div>
                      </Link>
                    )
                  })}

                  {upcomingAppointments.length > 5 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '8px',
                      color: theme.colors.text.tertiary,
                      fontSize: theme.fontSize.xs
                    }}>
                      +{upcomingAppointments.length - 5} more appointments
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div style={{
              background: theme.colors.bg.hover,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              padding: '20px'
            }}>
              <h3 style={{
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.base,
                fontWeight: theme.weight.semibold,
                marginBottom: '16px'
              }}>
                This Week
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.fontSize.sm
                  }}>
                    Total meetings
                  </span>
                  <span style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.semibold
                  }}>
                    {upcomingAppointments.length}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.fontSize.sm
                  }}>
                    Confirmed
                  </span>
                  <span style={{
                    color: '#ffffff',
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.semibold
                  }}>
                    {upcomingAppointments.filter(a => a.status === 'confirmed').length}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.fontSize.sm
                  }}>
                    Pending
                  </span>
                  <span style={{
                    color: '#a3a3a3',
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.semibold
                  }}>
                    {upcomingAppointments.filter(a => a.status === 'scheduled').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: theme.colors.bg.hover,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              padding: '20px'
            }}>
              <h3 style={{
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.base,
                fontWeight: theme.weight.semibold,
                marginBottom: '16px'
              }}>
                Quick Actions
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link
                  to="/projects"
                  style={{
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.md,
                    padding: '10px 12px',
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.sm,
                    textDecoration: 'none',
                    transition: 'all 200ms',
                    display: 'block',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = theme.colors.bg.page
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = theme.colors.bg.secondary
                  }}
                >
                  Schedule from Project
                </Link>

                <Link
                  to="/clients"
                  style={{
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.md,
                    padding: '10px 12px',
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.sm,
                    textDecoration: 'none',
                    transition: 'all 200ms',
                    display: 'block',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = theme.colors.bg.page
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = theme.colors.bg.secondary
                  }}
                >
                  View All Clients
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Calendar