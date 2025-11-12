import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import TopNavigation from '../components/TopNavigation'
import theme from '../theme'
import api from '../api/axios'
import { standardStyles } from '../components/StandardStyles'

function WorkflowDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    totalReviewers: 0
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchStats()
  }, [navigate])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      // Fetch real review data from API
      const [reviewsResponse, reviewersResponse] = await Promise.all([
        api.get('/api/reviews', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/reviewers', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const reviews = reviewsResponse.data.reviews || []
      const reviewers = reviewersResponse.data.reviewers || []

      setStats({
        totalReviews: reviews.length,
        pendingReviews: reviews.filter(r => r.status === 'pending').length,
        approvedReviews: reviews.filter(r => r.status === 'approved').length,
        totalReviewers: reviewers.length
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Set to actual zeros, not fake data
      setStats({
        totalReviews: 0,
        pendingReviews: 0,
        approvedReviews: 0,
        totalReviewers: 0
      })
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
              Review & Approval Workflows
            </h1>
            <p style={standardStyles.pageDescription}>
              Manage your review processes, track approvals, and collaborate with your team
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>

            {/* Total Reviews */}
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
                Total Reviews
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                {stats.totalReviews}
              </div>
              <Link to="/projects" style={{
                color: theme.colors.text.secondary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                View all reviews →
              </Link>
            </div>

            {/* Pending Reviews */}
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
                Pending Review
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '600',
                color: '#f59e0b',
                marginBottom: '8px'
              }}>
                {stats.pendingReviews}
              </div>
              <div style={{
                color: theme.colors.text.secondary,
                fontSize: '14px'
              }}>
                Awaiting feedback
              </div>
            </div>

            {/* Approved Reviews */}
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
                Approved
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '600',
                color: '#10b981',
                marginBottom: '8px'
              }}>
                {stats.approvedReviews}
              </div>
              <div style={{
                color: theme.colors.text.secondary,
                fontSize: '14px'
              }}>
                Ready to proceed
              </div>
            </div>

            {/* Total Reviewers */}
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
                Active Reviewers
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                {stats.totalReviewers}
              </div>
              <Link to="/clients" style={{
                color: theme.colors.text.secondary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Manage reviewers →
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
                background: '#3b82f6',
                color: theme.colors.white,
                padding: '16px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                textAlign: 'center',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}>
                + Create New Review
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
                Add Reviewer
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
                View Activity
              </Link>
            </div>
          </div>

          {/* Empty State Message */}
          {stats.totalReviews === 0 && (
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
                Welcome to Your Review Workflows
              </h3>
              <p style={{
                fontSize: '16px',
                color: theme.colors.text.secondary,
                marginBottom: '32px',
                maxWidth: '500px',
                margin: '0 auto 32px auto'
              }}>
                Get started by creating your first review workflow to collect feedback, manage approvals, and collaborate with your team.
              </p>
              <Link to="/projects" style={{
                background: '#3b82f6',
                color: theme.colors.white,
                padding: '16px 32px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '14px',
                display: 'inline-block'
              }}>
                Create Your First Review
              </Link>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default WorkflowDashboard