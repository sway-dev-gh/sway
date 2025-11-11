import { useState, useEffect } from 'react'
import theme from '../theme'
import api from '../api/axios'

/**
 * Integrated Scheduling System
 *
 * Complete calendar and appointment booking system:
 * - Calendar view with appointments
 * - Appointment booking for clients
 * - Meeting management for business
 * - Integration with project workspaces
 */
function SchedulingSystem({
  projectId = null,
  clientView = false,
  style = {}
}) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('week') // week, month
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [projectId, selectedDate, viewMode])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const endpoint = clientView && projectId
        ? `/api/client/workspace/${projectId}/appointments`
        : projectId
        ? `/api/projects/${projectId}/appointments`
        : '/api/appointments'

      const params = {
        date: selectedDate.toISOString().split('T')[0],
        view: viewMode
      }

      const { data } = await api.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: theme.colors.bg.hover,
      border: `1px solid ${theme.colors.border.light}`,
      borderRadius: theme.radius.lg,
      ...style
    }}>
      {/* Calendar Header */}
      <CalendarHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        viewMode={viewMode}
        onViewChange={setViewMode}
        clientView={clientView}
        onCreateClick={() => setShowCreateForm(true)}
      />

      {/* Calendar View */}
      <div style={{ padding: '0 24px 24px' }}>
        {viewMode === 'week' ? (
          <WeekView
            appointments={appointments}
            selectedDate={selectedDate}
            onAppointmentClick={setSelectedAppointment}
            loading={loading}
          />
        ) : (
          <MonthView
            appointments={appointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onAppointmentClick={setSelectedAppointment}
            loading={loading}
          />
        )}
      </div>

      {/* Create Appointment Modal */}
      {showCreateForm && (
        <AppointmentForm
          projectId={projectId}
          selectedDate={selectedDate}
          clientView={clientView}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchAppointments()
          }}
        />
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          clientView={clientView}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={() => {
            setSelectedAppointment(null)
            fetchAppointments()
          }}
        />
      )}
    </div>
  )
}

// Calendar Header Component
function CalendarHeader({
  selectedDate,
  onDateChange,
  viewMode,
  onViewChange,
  clientView,
  onCreateClick
}) {
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7))
    } else {
      newDate.setMonth(newDate.getMonth() + direction)
    }
    onDateChange(newDate)
  }

  const formatHeaderDate = () => {
    if (viewMode === 'week') {
      const startOfWeek = getStartOfWeek(selectedDate)
      const endOfWeek = getEndOfWeek(selectedDate)

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      } else {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      }
    } else {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 24px',
      borderBottom: `1px solid ${theme.colors.border.light}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h3 style={{
          color: theme.colors.text.primary,
          fontSize: theme.fontSize.lg,
          fontWeight: theme.weight.semibold,
          margin: 0
        }}>
          {clientView ? 'Schedule Meeting' : 'Calendar'}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => navigateDate(-1)}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.md,
              padding: '6px 10px',
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              fontSize: theme.fontSize.sm
            }}
          >
            ←
          </button>

          <div style={{
            color: theme.colors.text.primary,
            fontSize: theme.fontSize.base,
            fontWeight: theme.weight.medium,
            minWidth: '200px',
            textAlign: 'center'
          }}>
            {formatHeaderDate()}
          </div>

          <button
            onClick={() => navigateDate(1)}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.md,
              padding: '6px 10px',
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              fontSize: theme.fontSize.sm
            }}
          >
            →
          </button>

          <button
            onClick={() => onDateChange(new Date())}
            style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.md,
              padding: '6px 12px',
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              fontSize: theme.fontSize.sm,
              marginLeft: '8px'
            }}
          >
            Today
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* View Toggle */}
        <div style={{
          display: 'flex',
          background: theme.colors.bg.secondary,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border.light}`
        }}>
          {['week', 'month'].map(view => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              style={{
                background: viewMode === view ? theme.colors.white : 'transparent',
                color: viewMode === view ? theme.colors.black : theme.colors.text.secondary,
                border: 'none',
                padding: '6px 12px',
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                textTransform: 'capitalize',
                cursor: 'pointer',
                borderRadius: viewMode === view ? theme.radius.sm : 0
              }}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Create Button */}
        <button
          onClick={onCreateClick}
          style={{
            background: theme.colors.white,
            color: theme.colors.black,
            border: 'none',
            borderRadius: theme.radius.md,
            padding: '8px 16px',
            fontSize: theme.fontSize.sm,
            fontWeight: theme.weight.medium,
            cursor: 'pointer'
          }}
        >
          + {clientView ? 'Book Meeting' : 'New Appointment'}
        </button>
      </div>
    </div>
  )
}

// Week View Component
function WeekView({ appointments, selectedDate, onAppointmentClick, loading }) {
  const startOfWeek = getStartOfWeek(selectedDate)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    return date
  })

  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 8 PM

  const getAppointmentsForSlot = (date, hour) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime)
      return aptDate.toDateString() === date.toDateString() &&
             aptDate.getHours() === hour
    })
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: theme.colors.text.secondary
      }}>
        Loading calendar...
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: '1px' }}>
      {/* Time Column Header */}
      <div />

      {/* Day Headers */}
      {days.map(day => (
        <div
          key={day.toISOString()}
          style={{
            padding: '12px 8px',
            textAlign: 'center',
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.radius.sm
          }}
        >
          <div style={{
            color: theme.colors.text.primary,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.weight.semibold
          }}>
            {day.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
          <div style={{
            color: theme.colors.text.secondary,
            fontSize: theme.fontSize.xs,
            marginTop: '2px'
          }}>
            {day.getDate()}
          </div>
        </div>
      ))}

      {/* Time Slots */}
      {hours.map(hour => (
        <div key={hour} style={{ display: 'contents' }}>
          {/* Time Label */}
          <div style={{
            padding: '8px',
            textAlign: 'right',
            color: theme.colors.text.tertiary,
            fontSize: theme.fontSize.xs,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}>
            {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
          </div>

          {/* Day Slots */}
          {days.map(day => {
            const slotAppointments = getAppointmentsForSlot(day, hour)
            return (
              <div
                key={`${day.toISOString()}-${hour}`}
                style={{
                  minHeight: '60px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.sm,
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                {slotAppointments.map(appointment => (
                  <div
                    key={appointment.id}
                    onClick={() => onAppointmentClick(appointment)}
                    style={{
                      background: getAppointmentColor(appointment.status),
                      color: theme.colors.white,
                      padding: '4px 6px',
                      borderRadius: theme.radius.sm,
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.weight.medium,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {appointment.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Month View Component
function MonthView({ appointments, selectedDate, onDateSelect, onAppointmentClick, loading }) {
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
  const startDate = getStartOfWeek(startOfMonth)
  const endDate = getEndOfWeek(endOfMonth)

  const days = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    days.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime)
      return aptDate.toDateString() === date.toDateString()
    })
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: theme.colors.text.secondary
      }}>
        Loading calendar...
      </div>
    )
  }

  return (
    <div>
      {/* Day Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '8px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            style={{
              padding: '8px',
              textAlign: 'center',
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
        {days.map(day => {
          const dayAppointments = getAppointmentsForDate(day)
          const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              style={{
                minHeight: '100px',
                background: isCurrentMonth ? theme.colors.bg.secondary : theme.colors.bg.hover,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.sm,
                padding: '8px',
                cursor: 'pointer',
                opacity: isCurrentMonth ? 1 : 0.5,
                borderColor: isToday ? theme.colors.white : theme.colors.border.light,
                borderWidth: isToday ? '2px' : '1px'
              }}
            >
              <div style={{
                color: isToday ? theme.colors.white : theme.colors.text.primary,
                fontSize: theme.fontSize.sm,
                fontWeight: isToday ? theme.weight.bold : theme.weight.normal,
                marginBottom: '4px'
              }}>
                {day.getDate()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {dayAppointments.slice(0, 3).map(appointment => (
                  <div
                    key={appointment.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppointmentClick(appointment)
                    }}
                    style={{
                      background: getAppointmentColor(appointment.status),
                      color: theme.colors.white,
                      padding: '2px 4px',
                      borderRadius: '2px',
                      fontSize: '10px',
                      fontWeight: theme.weight.medium,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {appointment.title}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div style={{
                    color: theme.colors.text.tertiary,
                    fontSize: '10px',
                    textAlign: 'center'
                  }}>
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Appointment Form Component
function AppointmentForm({ projectId, selectedDate, clientView, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'meeting',
    startTime: '',
    duration: 60,
    location: ''
  })
  const [loading, setLoading] = useState(false)

  const createAppointment = async () => {
    try {
      setLoading(true)
      const endpoint = clientView && projectId
        ? `/api/client/workspace/${projectId}/appointments`
        : projectId
        ? `/api/projects/${projectId}/appointments`
        : '/api/appointments'

      await api.post(endpoint, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      onSuccess()
    } catch (error) {
      console.error('Failed to create appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: theme.colors.bg.page,
        border: `1px solid ${theme.colors.border.medium}`,
        borderRadius: theme.radius.lg,
        padding: '32px',
        width: '500px',
        maxWidth: '90vw'
      }}>
        <h2 style={{
          color: theme.colors.text.primary,
          fontSize: theme.fontSize.xl,
          fontWeight: theme.weight.bold,
          marginBottom: '24px'
        }}>
          {clientView ? 'Book Meeting' : 'Create Appointment'}
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm,
              marginBottom: '6px'
            }}>
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme.colors.bg.hover,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.sm,
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px' }}>
            <div>
              <label style={{
                display: 'block',
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.sm,
                marginBottom: '6px'
              }}>
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: theme.colors.bg.hover,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.sm,
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.sm,
                marginBottom: '6px'
              }}>
                Duration (min)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: theme.colors.bg.hover,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.sm,
                  fontFamily: 'inherit'
                }}
              >
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm,
              marginBottom: '6px'
            }}>
              Location / Meeting Link
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Office address or video call link"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme.colors.bg.hover,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.sm,
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm,
              marginBottom: '6px'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Meeting agenda or notes..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px 12px',
                background: theme.colors.bg.hover,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.sm,
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.md,
              padding: '10px 20px',
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.weight.medium,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={createAppointment}
            disabled={loading || !formData.title || !formData.startTime}
            style={{
              background: theme.colors.white,
              color: theme.colors.black,
              border: 'none',
              borderRadius: theme.radius.md,
              padding: '10px 20px',
              fontSize: theme.fontSize.sm,
              fontWeight: theme.weight.medium,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Creating...' : 'Create Appointment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Appointment Details Modal
function AppointmentDetails({ appointment, clientView, onClose, onUpdate }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: theme.colors.bg.page,
        border: `1px solid ${theme.colors.border.medium}`,
        borderRadius: theme.radius.lg,
        padding: '32px',
        width: '500px',
        maxWidth: '90vw'
      }}>
        <h2 style={{
          color: theme.colors.text.primary,
          fontSize: theme.fontSize.xl,
          fontWeight: theme.weight.bold,
          marginBottom: '24px'
        }}>
          {appointment.title}
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <div style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: '4px' }}>
              Date & Time
            </div>
            <div style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.base }}>
              {new Date(appointment.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.base }}>
              {new Date(appointment.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })} ({appointment.duration} minutes)
            </div>
          </div>

          {appointment.location && (
            <div>
              <div style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: '4px' }}>
                Location
              </div>
              <div style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.base }}>
                {appointment.location}
              </div>
            </div>
          )}

          {appointment.description && (
            <div>
              <div style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: '4px' }}>
                Description
              </div>
              <div style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.base, lineHeight: 1.5 }}>
                {appointment.description}
              </div>
            </div>
          )}

          <div>
            <div style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: '4px' }}>
              Status
            </div>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: theme.radius.full,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              background: `${getAppointmentColor(appointment.status)}20`,
              color: getAppointmentColor(appointment.status),
              border: `1px solid ${getAppointmentColor(appointment.status)}40`
            }}>
              {appointment.status}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.md,
              padding: '10px 20px',
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.weight.medium,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          {!clientView && appointment.status === 'scheduled' && (
            <button
              style={{
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: theme.radius.md,
                padding: '10px 20px',
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                cursor: 'pointer'
              }}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Utility Functions
function getStartOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

function getEndOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + 6
  return new Date(d.setDate(diff))
}

function getAppointmentColor(status) {
  switch (status) {
    case 'confirmed': return '#22c55e'
    case 'scheduled': return '#3b82f6'
    case 'cancelled': return '#ef4444'
    case 'completed': return '#8b5cf6'
    default: return theme.colors.text.secondary
  }
}

export default SchedulingSystem