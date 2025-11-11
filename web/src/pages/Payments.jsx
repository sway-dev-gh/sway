import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import PaymentSystem from '../components/PaymentSystem'
import theme from '../theme'
import api from '../api/axios'

/**
 * Payments Page
 *
 * Central hub for all payment and invoicing management.
 * Overview of all payments across projects with analytics.
 */
function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/payments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.status === filter
    const matchesSearch = searchTerm === '' ||
      payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientName?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#ffffff'
      case 'sent': return '#a3a3a3'
      case 'overdue': return '#525252'
      case 'draft': return theme.colors.text.secondary
      default: return theme.colors.text.secondary
    }
  }

  const getPaymentStats = () => {
    const stats = {
      total: payments.length,
      paid: payments.filter(p => p.status === 'paid').length,
      sent: payments.filter(p => p.status === 'sent').length,
      overdue: payments.filter(p => p.status === 'overdue').length,
      totalRevenue: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.total || 0), 0),
      outstanding: payments.filter(p => p.status === 'sent' || p.status === 'overdue').reduce((sum, p) => sum + (p.total || 0), 0),
      overdueAmount: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.total || 0), 0)
    }
    return stats
  }

  const stats = getPaymentStats()

  if (loading) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: theme.colors.text.secondary
        }}>
          Loading payments...
        </div>
      </Layout>
    )
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
              Payments
            </h1>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              fontWeight: '500'
            }}>
              Manage invoices and payment processing
            </p>
          </div>
          <Link
            to="/projects"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: theme.colors.white,
              padding: '14px 28px',
              borderRadius: '100px',
              fontWeight: '700',
              fontSize: '15px',
              letterSpacing: '-0.3px',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              border: '1px solid #525252',
              textDecoration: 'none',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)'
              e.target.style.background = 'rgba(255, 255, 255, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
              e.target.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
          >
            Create from Project
          </Link>
        </div>

        {/* Payment Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Total Revenue
            </div>
            <div style={{
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: theme.weight.bold
            }}>
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Outstanding
            </div>
            <div style={{
              color: '#a3a3a3',
              fontSize: '32px',
              fontWeight: theme.weight.bold
            }}>
              {formatCurrency(stats.outstanding)}
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Overdue
            </div>
            <div style={{
              color: '#525252',
              fontSize: '32px',
              fontWeight: theme.weight.bold
            }}>
              {formatCurrency(stats.overdueAmount)}
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Total Invoices
            </div>
            <div style={{
              color: theme.colors.text.primary,
              fontSize: '32px',
              fontWeight: theme.weight.bold
            }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'draft', 'sent', 'paid', 'overdue'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: filter === status ? theme.colors.white : 'rgba(255, 255, 255, 0.08)',
                  color: filter === status ? theme.colors.black : theme.colors.text.secondary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 200ms'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 16px',
              background: theme.colors.bg.hover,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '8px',
              color: theme.colors.text.primary,
              fontSize: theme.fontSize.sm,
              width: '300px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Payments List */}
        {filteredPayments.length > 0 ? (
          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr 120px 120px 140px 100px',
              gap: '16px',
              padding: '20px 28px',
              borderBottom: `1px solid ${theme.colors.border.light}`,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: theme.fontSize.xs,
                fontWeight: theme.weight.bold,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Invoice #
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                fontWeight: theme.weight.bold,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Description
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                fontWeight: theme.weight.bold,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Client
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                fontWeight: theme.weight.bold,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Amount
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                fontWeight: theme.weight.bold,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Due Date
              </div>
              <div style={{
                fontSize: theme.fontSize.xs,
                fontWeight: theme.weight.bold,
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Status
              </div>
            </div>

            {/* Table Body */}
            <div>
              {filteredPayments.map(payment => (
                <Link
                  key={payment.id}
                  to={`/projects/${payment.projectId}?tab=payments`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr 120px 120px 140px 100px',
                    gap: '16px',
                    padding: '24px 28px',
                    borderBottom: `1px solid ${theme.colors.border.light}`,
                    textDecoration: 'none',
                    transition: 'all 200ms'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = theme.colors.bg.secondary
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                  }}
                >
                  {/* Invoice Number */}
                  <div style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.semibold
                  }}>
                    #{payment.invoiceNumber}
                  </div>

                  {/* Description */}
                  <div>
                    <div style={{
                      color: theme.colors.text.primary,
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.weight.medium,
                      marginBottom: '2px'
                    }}>
                      {payment.description}
                    </div>
                    <div style={{
                      color: theme.colors.text.tertiary,
                      fontSize: theme.fontSize.xs
                    }}>
                      {payment.projectTitle}
                    </div>
                  </div>

                  {/* Client */}
                  <div style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.fontSize.sm
                  }}>
                    {payment.clientName || 'No client'}
                  </div>

                  {/* Amount */}
                  <div style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.semibold
                  }}>
                    {formatCurrency(payment.total)}
                  </div>

                  {/* Due Date */}
                  <div style={{
                    color: payment.status === 'overdue' ? '#525252' : theme.colors.text.secondary,
                    fontSize: theme.fontSize.sm
                  }}>
                    {new Date(payment.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Status */}
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '100px',
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.weight.bold,
                    textTransform: 'uppercase',
                    background: `${getStatusColor(payment.status)}20`,
                    color: getStatusColor(payment.status),
                    border: `1px solid ${getStatusColor(payment.status)}40`,
                    textAlign: 'center'
                  }}>
                    {payment.status}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '120px 40px',
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '24px'
          }}>
            <div style={{
              fontSize: '80px',
              marginBottom: '24px',
              opacity: 0.3
            }}>
              ◯
            </div>
            <h3 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: theme.colors.text.primary,
              marginBottom: '12px',
              letterSpacing: '-0.5px'
            }}>
              {searchTerm || filter !== 'all' ? 'No payments found' : 'No invoices yet'}
            </h3>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              marginBottom: '40px'
            }}>
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice from a project'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Link
                to="/projects"
                style={{
                  background: theme.colors.white,
                  color: theme.colors.black,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.weight.medium,
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                View Projects
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Payments