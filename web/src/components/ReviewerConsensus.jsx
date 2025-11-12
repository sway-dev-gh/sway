import { useState, useEffect } from 'react'

const ReviewerConsensus = ({ projectId, fileId, sectionId }) => {
  const [reviewers, setReviewers] = useState([])
  const [consensusStatus, setConsensusStatus] = useState('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviewerData()
  }, [projectId, fileId, sectionId])

  const fetchReviewerData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}/sections/${sectionId}/reviewers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setReviewers(data.reviewers || [])
        calculateConsensus(data.reviewers || [])
      }
    } catch (error) {
      console.error('Failed to fetch reviewer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateConsensus = (reviewersList) => {
    if (reviewersList.length === 0) {
      setConsensusStatus('no-reviewers')
      return
    }

    const statuses = reviewersList.map(r => r.status).filter(s => s !== 'pending')
    const approved = statuses.filter(s => s === 'approved').length
    const rejected = statuses.filter(s => s === 'changes_requested').length
    const total = statuses.length

    if (total === 0) {
      setConsensusStatus('pending')
    } else if (approved > rejected && approved >= Math.ceil(total * 0.6)) {
      setConsensusStatus('approved')
    } else if (rejected >= Math.ceil(total * 0.4)) {
      setConsensusStatus('rejected')
    } else {
      setConsensusStatus('mixed')
    }
  }

  const getConsensusDisplay = () => {
    const statusMap = {
      'no-reviewers': { label: 'No Reviewers', color: '#666666', icon: '👥' },
      'pending': { label: 'Pending Review', color: '#ffd43b', icon: '⏳' },
      'approved': { label: 'Approved', color: '#51cf66', icon: '✅' },
      'rejected': { label: 'Changes Requested', color: '#ff6b6b', icon: '❌' },
      'mixed': { label: 'Mixed Feedback', color: '#4c6ef5', icon: '🤔' }
    }
    return statusMap[consensusStatus]
  }

  const getStatusIcon = (status) => {
    const statusMap = {
      'pending': '⏳',
      'approved': '✅',
      'changes_requested': '❌',
      'under_review': '👀'
    }
    return statusMap[status] || '•'
  }

  if (loading) {
    return (
      <div style={{
        fontSize: '12px',
        color: '#a3a3a3'
      }}>
        Loading reviewers...
      </div>
    )
  }

  const consensus = getConsensusDisplay()

  return (
    <div style={{
      background: '#000000',
      border: '1px solid #333333',
      borderRadius: '6px',
      padding: '12px',
      marginTop: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '500',
          color: '#ffffff'
        }}>
          Reviewer Consensus
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: '500',
          color: consensus.color
        }}>
          <span>{consensus.icon}</span>
          <span>{consensus.label}</span>
        </div>
      </div>

      {reviewers.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {reviewers.map((reviewer, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px'
              }}
            >
              <div style={{
                color: '#a3a3a3'
              }}>
                {reviewer.name}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>{getStatusIcon(reviewer.status)}</span>
                <span style={{
                  color: reviewer.status === 'approved' ? '#51cf66' :
                        reviewer.status === 'changes_requested' ? '#ff6b6b' : '#a3a3a3'
                }}>
                  {reviewer.status === 'approved' ? 'Approved' :
                   reviewer.status === 'changes_requested' ? 'Rejected' :
                   reviewer.status === 'under_review' ? 'Reviewing' : 'Pending'}
                </span>
              </div>
            </div>
          ))}

          {/* Consensus Rules */}
          <div style={{
            marginTop: '8px',
            padding: '6px',
            background: '#1a1a1a',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#666666'
          }}>
            Consensus: 60% approval needed, 40% rejection blocks
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: '11px',
          color: '#666666',
          textAlign: 'center',
          padding: '8px'
        }}>
          No reviewers assigned
        </div>
      )}
    </div>
  )
}

export default ReviewerConsensus