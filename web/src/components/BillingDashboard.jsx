import React, { useState, useEffect } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'

const BillingDashboard = () => {
  const { state, actions } = useWorkspace()
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Load subscription and usage data in parallel
      const [subscriptionRes, usageRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/billing/subscription`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/billing/usage`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const [subscriptionData, usageData] = await Promise.all([
        subscriptionRes.json(),
        usageRes.json()
      ])

      if (subscriptionData.success) {
        setSubscription(subscriptionData.subscription)
      }

      if (usageData.success) {
        setUsage(usageData.usage)
      }
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openBillingPortal = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/billing/portal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success) {
        window.open(data.url, '_blank')
      } else {
        actions.showConfirmDialog({
          message: 'Unable to open billing portal: ' + data.message,
          confirmText: 'OK',
          showCancel: false
        })
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      actions.showConfirmDialog({
        message: 'An error occurred while opening the billing portal',
        confirmText: 'OK',
        showCancel: false
      })
    }
  }

  const cancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/billing/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success) {
        actions.showConfirmDialog({
          message: 'Subscription canceled successfully',
          confirmText: 'OK',
          showCancel: false
        })
        loadBillingData() // Reload data
      } else {
        actions.showConfirmDialog({
          message: 'Failed to cancel subscription: ' + data.message,
          confirmText: 'OK',
          showCancel: false
        })
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      actions.showConfirmDialog({
        message: 'An error occurred while canceling subscription',
        confirmText: 'OK',
        showCancel: false
      })
    }
  }

  const getUsageBarColor = (percentage) => {
    if (percentage >= 90) return '#ff4757'
    if (percentage >= 75) return '#ffa502'
    return '#2ed573'
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', color: '#ffffff' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Billing & Usage</h2>
        <div>Loading billing information...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '24px', color: '#ffffff' }}>
        Billing & Usage
      </h2>

      {/* Current Plan */}
      <div style={{
        background: '#111111',
        border: '1px solid #333333',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#ffffff' }}>
          Current Plan
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
              {subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1) || 'Free'} Plan
            </div>
            <div style={{ fontSize: '14px', color: '#999999' }}>
              {subscription?.status === 'active' ? 'Active' : subscription?.status || 'Active'}
              {subscription?.currentPeriodEnd && (
                <> • Renews {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}</>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {subscription?.plan !== 'free' && (
              <>
                <button
                  onClick={openBillingPortal}
                  style={{
                    background: '#333333',
                    border: '1px solid #555555',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Manage Billing
                </button>
                <button
                  onClick={cancelSubscription}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ff4757',
                    color: '#ff4757',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      {usage && (
        <div style={{
          background: '#111111',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '24px', color: '#ffffff' }}>
            Usage This Month
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px'
          }}>
            {/* Workspaces */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#cccccc' }}>Workspaces</span>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>
                  {usage.workspaces.current} / {usage.workspaces.max === -1 ? '∞' : usage.workspaces.max}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#333333',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(usage.workspaces.percentage, 100)}%`,
                  height: '100%',
                  background: getUsageBarColor(usage.workspaces.percentage),
                  borderRadius: '4px'
                }} />
              </div>
            </div>

            {/* Files */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#cccccc' }}>Files</span>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>
                  {usage.files.current} / {usage.files.max === -1 ? '∞' : usage.files.max}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#333333',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(usage.files.percentage, 100)}%`,
                  height: '100%',
                  background: getUsageBarColor(usage.files.percentage),
                  borderRadius: '4px'
                }} />
              </div>
            </div>

            {/* Collaborators */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#cccccc' }}>Collaborators</span>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>
                  {usage.collaborators.current} / {usage.collaborators.max === -1 ? '∞' : usage.collaborators.max}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#333333',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(usage.collaborators.percentage, 100)}%`,
                  height: '100%',
                  background: getUsageBarColor(usage.collaborators.percentage),
                  borderRadius: '4px'
                }} />
              </div>
            </div>

            {/* Storage */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#cccccc' }}>Storage</span>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>
                  {usage.storage.current}GB / {usage.storage.max === -1 ? '∞' : usage.storage.max + 'GB'}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#333333',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(usage.storage.percentage, 100)}%`,
                  height: '100%',
                  background: getUsageBarColor(usage.storage.percentage),
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          </div>

          {/* Usage warnings */}
          {Object.values(usage).some(metric => metric.percentage >= 90) && (
            <div style={{
              background: '#ff4757',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '4px',
              marginTop: '16px',
              fontSize: '14px'
            }}>
              You're approaching your plan limits. Consider upgrading to avoid disruptions.
            </div>
          )}
        </div>
      )}

      {/* Plan Features */}
      {usage?.plan && (
        <div style={{
          background: '#111111',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#ffffff' }}>
            {usage.plan.name} Features
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ color: '#cccccc', fontSize: '14px' }}>
              {usage.plan.features.maxWorkspaces === -1 ? 'Unlimited' : usage.plan.features.maxWorkspaces} workspaces
            </div>
            <div style={{ color: '#cccccc', fontSize: '14px' }}>
              {usage.plan.features.maxFiles === -1 ? 'Unlimited' : usage.plan.features.maxFiles} files
            </div>
            <div style={{ color: '#cccccc', fontSize: '14px' }}>
              {usage.plan.features.maxCollaborators === -1 ? 'Unlimited' : usage.plan.features.maxCollaborators} collaborators
            </div>
            <div style={{ color: '#cccccc', fontSize: '14px' }}>
              {usage.plan.features.storageGB}GB storage
            </div>
            <div style={{ color: '#cccccc', fontSize: '14px' }}>
              {usage.plan.features.maxFileSizeMB}MB max file size
            </div>
            {usage.plan.features.guestLinks && (
              <div style={{ color: '#cccccc', fontSize: '14px' }}>
                Guest collaboration links
              </div>
            )}
            {usage.plan.features.apiAccess && (
              <div style={{ color: '#cccccc', fontSize: '14px' }}>
                API access
              </div>
            )}
            {usage.plan.features.prioritySupport && (
              <div style={{ color: '#cccccc', fontSize: '14px' }}>
                Priority support
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingDashboard