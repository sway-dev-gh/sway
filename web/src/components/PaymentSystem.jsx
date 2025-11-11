import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import theme from '../theme'
import api from '../api/axios'

// Initialize Stripe (you'll need to set your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_')

/**
 * Payment Processing System
 *
 * Complete payment solution for SwayFiles business platform:
 * - Create and send invoices
 * - Process payments via Stripe
 * - Track payment status
 * - Client-facing payment forms
 */

// Main Payment System Component
function PaymentSystem({ projectId, clientView = false, style = {} }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentContainer projectId={projectId} clientView={clientView} style={style} />
    </Elements>
  )
}

// Payment Container (inside Stripe Elements context)
function PaymentContainer({ projectId, clientView, style }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(null)

  useEffect(() => {
    fetchPayments()
  }, [projectId])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const endpoint = clientView
        ? `/api/client/workspace/${projectId}/payments`
        : `/api/projects/${projectId}/payments`

      const { data } = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return theme.colors.white
      case 'sent': return '#a3a3a3'
      case 'overdue': return '#525252'
      case 'draft': return theme.colors.text.secondary
      default: return theme.colors.text.secondary
    }
  }

  return (
    <div style={{
      background: theme.colors.bg.hover,
      border: `1px solid ${theme.colors.border.light}`,
      borderRadius: theme.radius.lg,
      padding: '24px',
      ...style
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{
          color: theme.colors.text.primary,
          fontSize: theme.fontSize.lg,
          fontWeight: theme.weight.semibold
        }}>
          {clientView ? 'Invoices & Payments' : 'Payment Management'}
        </h3>
        {!clientView && (
          <button
            onClick={() => setShowCreateInvoice(true)}
            style={{
              background: theme.colors.white,
              color: theme.colors.black,
              padding: '8px 16px',
              borderRadius: theme.radius.md,
              border: 'none',
              fontSize: theme.fontSize.sm,
              fontWeight: theme.weight.medium,
              cursor: 'pointer'
            }}
          >
            + Create Invoice
          </button>
        )}
      </div>

      {/* Payments List */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          color: theme.colors.text.secondary,
          padding: '40px'
        }}>
          Loading payments...
        </div>
      ) : payments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: theme.colors.text.secondary
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>◯</div>
          <h4 style={{ marginBottom: '8px' }}>
            {clientView ? 'No invoices yet' : 'No payments created'}
          </h4>
          <p style={{ fontSize: theme.fontSize.sm }}>
            {clientView
              ? 'Invoices will appear here when they\'re created'
              : 'Create your first invoice to start getting paid'
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {payments.map(payment => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              clientView={clientView}
              onPaymentClick={() => setShowPaymentForm(payment)}
              onStatusUpdate={fetchPayments}
            />
          ))}
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <InvoiceCreator
          projectId={projectId}
          onClose={() => setShowCreateInvoice(false)}
          onSuccess={() => {
            setShowCreateInvoice(false)
            fetchPayments()
          }}
        />
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          payment={showPaymentForm}
          onClose={() => setShowPaymentForm(null)}
          onSuccess={() => {
            setShowPaymentForm(null)
            fetchPayments()
          }}
        />
      )}
    </div>
  )
}

// Individual Payment Card Component
function PaymentCard({ payment, clientView, onPaymentClick, onStatusUpdate }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return theme.colors.white
      case 'sent': return '#a3a3a3'
      case 'overdue': return '#525252'
      case 'draft': return theme.colors.text.secondary
      default: return theme.colors.text.secondary
    }
  }

  const markAsPaid = async () => {
    try {
      await api.put(`/api/projects/payments/${payment.id}/mark-paid`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      onStatusUpdate()
    } catch (error) {
      console.error('Failed to mark as paid:', error)
    }
  }

  return (
    <div style={{
      background: theme.colors.bg.secondary,
      border: `1px solid ${theme.colors.border.light}`,
      borderRadius: theme.radius.md,
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <h4 style={{
            color: theme.colors.text.primary,
            fontSize: theme.fontSize.base,
            fontWeight: theme.weight.semibold,
            margin: 0
          }}>
            Invoice #{payment.invoiceNumber}
          </h4>
          <div style={{
            padding: '2px 8px',
            borderRadius: theme.radius.full,
            fontSize: theme.fontSize.xs,
            fontWeight: theme.weight.semibold,
            textTransform: 'uppercase',
            background: `${getStatusColor(payment.status)}20`,
            color: getStatusColor(payment.status),
            border: `1px solid ${getStatusColor(payment.status)}40`
          }}>
            {payment.status}
          </div>
        </div>
        <p style={{
          color: theme.colors.text.secondary,
          fontSize: theme.fontSize.sm,
          marginBottom: '4px'
        }}>
          {payment.description}
        </p>
        <div style={{
          color: theme.colors.text.tertiary,
          fontSize: theme.fontSize.xs
        }}>
          Due: {new Date(payment.dueDate).toLocaleDateString()} |
          Issued: {new Date(payment.issuedDate).toLocaleDateString()}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            color: theme.colors.text.primary,
            fontSize: theme.fontSize.lg,
            fontWeight: theme.weight.bold
          }}>
            {formatCurrency(payment.total)}
          </div>
          {payment.subtotal !== payment.total && (
            <div style={{
              color: theme.colors.text.tertiary,
              fontSize: theme.fontSize.xs
            }}>
              Subtotal: {formatCurrency(payment.subtotal)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {clientView && payment.status === 'sent' && (
            <button
              onClick={onPaymentClick}
              style={{
                background: theme.colors.white,
                color: theme.colors.black,
                padding: '8px 16px',
                borderRadius: theme.radius.md,
                border: 'none',
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                cursor: 'pointer'
              }}
            >
              Pay Now
            </button>
          )}

          {!clientView && payment.status === 'sent' && (
            <button
              onClick={markAsPaid}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: theme.colors.white,
                padding: '8px 16px',
                borderRadius: theme.radius.md,
                border: `1px solid rgba(255, 255, 255, 0.2)`,
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                cursor: 'pointer'
              }}
            >
              Mark Paid
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Invoice Creator Modal
function InvoiceCreator({ projectId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subtotal: '',
    tax: '0',
    discount: '0',
    dueDate: '',
    lineItems: [
      { description: '', quantity: 1, unitPrice: '', total: 0 }
    ]
  })
  const [loading, setLoading] = useState(false)

  const updateLineItem = (index, field, value) => {
    const newLineItems = [...formData.lineItems]
    newLineItems[index] = { ...newLineItems[index], [field]: value }

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(newLineItems[index].quantity) || 0
      const unitPrice = parseFloat(newLineItems[index].unitPrice) || 0
      newLineItems[index].total = quantity * unitPrice
    }

    setFormData(prev => ({ ...prev, lineItems: newLineItems }))
  }

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', quantity: 1, unitPrice: '', total: 0 }]
    }))
  }

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }))
  }

  const calculateTotal = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + item.total, 0)
    const tax = parseFloat(formData.tax) || 0
    const discount = parseFloat(formData.discount) || 0
    return subtotal + tax - discount
  }

  const createInvoice = async () => {
    try {
      setLoading(true)
      const total = calculateTotal()

      await api.post(`/api/projects/${projectId}/payments`, {
        ...formData,
        subtotal: formData.lineItems.reduce((sum, item) => sum + item.total, 0),
        tax: parseFloat(formData.tax) || 0,
        discount: parseFloat(formData.discount) || 0,
        total
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      onSuccess()
    } catch (error) {
      console.error('Failed to create invoice:', error)
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
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h2 style={{
          color: theme.colors.text.primary,
          fontSize: theme.fontSize.xl,
          fontWeight: theme.weight.bold,
          marginBottom: '24px'
        }}>
          Create Invoice
        </h2>

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.sm,
                marginBottom: '6px'
              }}>
                Invoice Title
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
            <div>
              <label style={{
                display: 'block',
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.sm,
                marginBottom: '6px'
              }}>
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
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
          </div>

          {/* Description */}
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

          {/* Line Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.sm
              }}>
                Line Items
              </label>
              <button
                onClick={addLineItem}
                style={{
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.md,
                  padding: '6px 12px',
                  color: theme.colors.text.secondary,
                  fontSize: theme.fontSize.sm,
                  cursor: 'pointer'
                }}
              >
                + Add Item
              </button>
            </div>

            {formData.lineItems.map((item, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 80px 120px 120px auto',
                gap: '12px',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  style={{
                    padding: '8px 10px',
                    background: theme.colors.bg.hover,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.sm,
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.sm,
                    fontFamily: 'inherit'
                  }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                  style={{
                    padding: '8px 10px',
                    background: theme.colors.bg.hover,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.sm,
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.sm,
                    fontFamily: 'inherit'
                  }}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                  style={{
                    padding: '8px 10px',
                    background: theme.colors.bg.hover,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.sm,
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.sm,
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.weight.medium,
                  minWidth: '80px'
                }}>
                  ${item.total.toFixed(2)}
                </div>
                {formData.lineItems.length > 1 && (
                  <button
                    onClick={() => removeLineItem(index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.colors.text.tertiary,
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Tax & Discount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.sm,
                marginBottom: '6px'
              }}>
                Tax ($)
              </label>
              <input
                type="number"
                value={formData.tax}
                onChange={(e) => setFormData(prev => ({ ...prev, tax: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
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
                Discount ($)
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
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
                Total
              </label>
              <div style={{
                padding: '8px 10px',
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.base,
                fontWeight: theme.weight.bold
              }}>
                ${calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '32px'
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
            onClick={createInvoice}
            disabled={loading || !formData.title || !formData.dueDate}
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
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Payment Form Component (Stripe Payment)
function PaymentForm({ payment, onClose, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError('')

    const card = elements.getElement(CardElement)

    try {
      // Create payment intent on server
      const { data } = await api.post(`/api/payments/${payment.id}/process`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: payment.client?.name || 'Client'
          }
        }
      })

      if (result.error) {
        setError(result.error.message)
      } else {
        onSuccess()
      }
    } catch (error) {
      setError('Payment failed. Please try again.')
      console.error('Payment error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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
          Pay Invoice #{payment.invoiceNumber}
        </h2>

        {/* Payment Details */}
        <div style={{
          background: theme.colors.bg.hover,
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: theme.radius.md,
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: theme.colors.text.secondary }}>Amount Due:</span>
            <span style={{ color: theme.colors.text.primary, fontWeight: theme.weight.bold, fontSize: theme.fontSize.lg }}>
              {formatCurrency(payment.total)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: theme.colors.text.secondary }}>Due Date:</span>
            <span style={{ color: theme.colors.text.primary }}>
              {new Date(payment.dueDate).toLocaleDateString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: theme.colors.text.secondary }}>Description:</span>
            <span style={{ color: theme.colors.text.primary, textAlign: 'right', maxWidth: '200px' }}>
              {payment.description}
            </span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm,
              marginBottom: '8px'
            }}>
              Card Details
            </label>
            <div style={{
              background: theme.colors.bg.hover,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.md,
              padding: '12px'
            }}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      fontFamily: 'inherit',
                      '::placeholder': {
                        color: theme.colors.text.tertiary
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              color: theme.colors.text.primary,
              fontSize: theme.fontSize.sm,
              marginBottom: '16px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: theme.radius.md
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                background: 'transparent',
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.md,
                padding: '12px',
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading}
              style={{
                flex: 1,
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: theme.radius.md,
                padding: '12px',
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Processing...' : `Pay ${formatCurrency(payment.total)}`}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          color: theme.colors.text.tertiary,
          fontSize: theme.fontSize.xs
        }}>
          Payments are processed securely by Stripe
        </div>
      </div>
    </div>
  )
}

export default PaymentSystem