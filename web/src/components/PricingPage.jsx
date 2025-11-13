import React, { useState, useEffect } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY_HERE')

const PricingPage = ({ onClose }) => {
  const { state, actions } = useWorkspace()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/billing/plans`)
      const data = await response.json()

      if (data.success) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId) => {
    if (planId === 'free') {
      onClose?.()
      return
    }

    setSubscribing(planId)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/billing/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      })

      const data = await response.json()

      if (data.success) {
        const stripe = await stripePromise
        const result = await stripe.confirmCardPayment(data.clientSecret)

        if (result.error) {
          console.error('Payment failed:', result.error)
          alert('Payment failed: ' + result.error.message)
        } else {
          // Payment succeeded, refresh user data
          await actions.initializeAuth()
          onClose?.()
          alert('Successfully subscribed! Welcome to ' + planId.charAt(0).toUpperCase() + planId.slice(1) + ' plan!')
        }
      } else {
        alert('Subscription failed: ' + data.message)
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('An error occurred while subscribing')
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ color: '#ffffff', fontSize: '16px' }}>Loading plans...</div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '1200px',
        background: '#000000',
        border: '1px solid #333333',
        borderRadius: '8px',
        padding: '48px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '48px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              color: '#ffffff'
            }}>
              Choose Your Plan
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#999999',
              margin: 0
            }}>
              Upgrade your workspace to unlock powerful collaboration features
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #333333',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>

        {/* Plans Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.popular ? '#111111' : '#0a0a0a',
                border: plan.popular ? '2px solid #ffffff' : '1px solid #333333',
                borderRadius: '8px',
                padding: '32px',
                position: 'relative'
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#ffffff',
                  color: '#000000',
                  padding: '4px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0',
                  color: '#ffffff',
                  textTransform: 'capitalize'
                }}>
                  {plan.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#ffffff'
                  }}>
                    {plan.formattedPrice}
                  </span>
                  {plan.interval && (
                    <span style={{
                      fontSize: '14px',
                      color: '#999999',
                      marginLeft: '4px'
                    }}>
                      /{plan.interval}
                    </span>
                  )}
                </div>
              </div>

              {/* Features List */}
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 32px 0'
              }}>
                <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                  {plan.features.maxWorkspaces === -1 ? 'Unlimited' : plan.features.maxWorkspaces} workspaces
                </li>
                <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                  {plan.features.maxFiles === -1 ? 'Unlimited' : plan.features.maxFiles} files
                </li>
                <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                  {plan.features.maxCollaborators === -1 ? 'Unlimited' : plan.features.maxCollaborators} collaborators
                </li>
                <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                  {plan.features.storageGB}GB storage
                </li>
                <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                  {plan.features.maxFileSizeMB}MB max file size
                </li>
                {plan.features.guestLinks && (
                  <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                    Guest collaboration links
                  </li>
                )}
                {plan.features.apiAccess && (
                  <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                    API access
                  </li>
                )}
                {plan.features.prioritySupport && (
                  <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                    Priority support
                  </li>
                )}
                {plan.features.customBranding && (
                  <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                    Custom branding
                  </li>
                )}
                {plan.features.sso && (
                  <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                    Single Sign-On (SSO)
                  </li>
                )}
                {plan.features.auditLogs && (
                  <li style={{ marginBottom: '12px', color: '#cccccc', fontSize: '14px' }}>
                    Audit logs
                  </li>
                )}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing === plan.id}
                style={{
                  width: '100%',
                  background: plan.popular ? '#ffffff' : '#333333',
                  color: plan.popular ? '#000000' : '#ffffff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: subscribing === plan.id ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  opacity: subscribing === plan.id ? 0.6 : 1
                }}
              >
                {subscribing === plan.id ? 'Processing...' :
                 plan.id === 'free' ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          color: '#666666',
          fontSize: '12px',
          lineHeight: '1.5'
        }}>
          <p>All plans include secure cloud storage, real-time collaboration, and version history</p>
          <p>Cancel anytime • Secure payments powered by Stripe • SOC 2 compliant</p>
        </div>
      </div>
    </div>
  )
}

export default PricingPage