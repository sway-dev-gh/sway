import React, { useState, useEffect } from 'react'
import useReviewStore from '../store/reviewStore'
import toast from 'react-hot-toast'

const WorkflowStateManager = ({ fileId, currentState, onStateChange }) => {
  const { updateFileState, fetchFileStateHistory } = useReviewStore()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [stateHistory, setStateHistory] = useState([])
  const [changeReason, setChangeReason] = useState('')
  const [selectedState, setSelectedState] = useState('')

  // Define workflow states and their transitions
  const workflowStates = {
    draft: {
      label: 'Draft',
      color: 'bg-gray-500',
      transitions: ['under_review', 'delivered'],
      description: 'Work in progress'
    },
    under_review: {
      label: 'Under Review',
      color: 'bg-blue-500',
      transitions: ['changes_requested', 'approved', 'draft'],
      description: 'Being reviewed by team'
    },
    changes_requested: {
      label: 'Changes Requested',
      color: 'bg-yellow-500',
      transitions: ['under_review', 'draft'],
      description: 'Needs revisions'
    },
    approved: {
      label: 'Approved',
      color: 'bg-green-500',
      transitions: ['delivered', 'under_review'],
      description: 'Ready for delivery'
    },
    delivered: {
      label: 'Delivered',
      color: 'bg-purple-500',
      transitions: ['under_review'],
      description: 'Completed and delivered'
    }
  }

  const currentStateInfo = workflowStates[currentState] || workflowStates.draft
  const availableTransitions = currentStateInfo.transitions.map(state => ({
    key: state,
    ...workflowStates[state]
  }))

  const handleStateTransition = async () => {
    if (!selectedState) {
      toast.error('Please select a target state')
      return
    }

    setIsTransitioning(true)
    try {
      await updateFileState(fileId, {
        new_state: selectedState,
        change_reason: changeReason || `Transitioned to ${workflowStates[selectedState]?.label}`,
        priority_level: 'normal'
      })

      toast.success(`File moved to ${workflowStates[selectedState]?.label}`)
      setSelectedState('')
      setChangeReason('')

      // Notify parent component
      if (onStateChange) {
        onStateChange(selectedState)
      }
    } catch (error) {
      console.error('State transition failed:', error)
      toast.error('Failed to transition state')
    } finally {
      setIsTransitioning(false)
    }
  }

  const loadStateHistory = async () => {
    try {
      const history = await fetchFileStateHistory(fileId)
      setStateHistory(history)
      setShowHistory(true)
    } catch (error) {
      console.error('Failed to load state history:', error)
      toast.error('Failed to load state history')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="bg-[#1C1C1C] border border-[#333] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Workflow Status</h3>
        <button
          onClick={loadStateHistory}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          View History
        </button>
      </div>

      {/* Current State Display */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <span className={`inline-block w-3 h-3 rounded-full ${currentStateInfo.color}`}></span>
          <span className="text-white font-medium">{currentStateInfo.label}</span>
        </div>
        <p className="text-gray-400 text-sm">{currentStateInfo.description}</p>
      </div>

      {/* State Transition Controls */}
      {availableTransitions.length > 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transition to:
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#444] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select target state...</option>
              {availableTransitions.map(state => (
                <option key={state.key} value={state.key}>
                  {state.label} - {state.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason for change (optional):
            </label>
            <textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Brief explanation of why this transition is being made..."
              className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#444] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="2"
            />
          </div>

          <button
            onClick={handleStateTransition}
            disabled={!selectedState || isTransitioning}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {isTransitioning ? 'Transitioning...' : 'Update Status'}
          </button>
        </div>
      )}

      {/* State History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1C1C1C] border border-[#333] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Workflow History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {stateHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No state history available</p>
              ) : (
                stateHistory.map((entry, index) => (
                  <div key={entry.id} className="border-l-2 border-gray-600 pl-4 pb-4">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${workflowStates[entry.new_state]?.color || 'bg-gray-500'}`}></span>
                      <span className="text-white font-medium">
                        {entry.previous_state !== entry.new_state
                          ? `${workflowStates[entry.previous_state]?.label || entry.previous_state} → ${workflowStates[entry.new_state]?.label || entry.new_state}`
                          : workflowStates[entry.new_state]?.label || entry.new_state
                        }
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">{entry.change_reason}</p>
                    <div className="text-xs text-gray-500">
                      {formatDate(entry.changed_at)} • {entry.changed_by_name || 'Unknown user'}
                      {entry.version_number && ` • Version ${entry.version_number}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowStateManager