import React, { useState } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'
import { formatDistanceToNow } from 'date-fns'

const RightPanel = ({ collapsed, onToggleCollapse }) => {
  const { state, WORKFLOW_STATES } = useWorkspace()
  const [activeTab, setActiveTab] = useState('activity')

  const tabs = [
    { id: 'activity', label: 'Activity', icon: '◐' },
    { id: 'stats', label: 'Stats', icon: '◊' },
    { id: 'team', label: 'Team', icon: '◯' }
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'workspace_created': return '◧'
      case 'file_added': return '◈'
      case 'section_added': return '⊞'
      case 'sections_reordered': return '⋮⋮'
      case 'comment_added': return '💬'
      case 'workflow_updated': return '✓'
      default: return '◦'
    }
  }

  const getWorkflowStats = () => {
    const sections = Object.values(state.sections)
    const totalSections = sections.length

    const stats = {
      draft: sections.filter(s => s.workflowState === WORKFLOW_STATES.DRAFT).length,
      underReview: sections.filter(s => s.workflowState === WORKFLOW_STATES.UNDER_REVIEW).length,
      changesRequested: sections.filter(s => s.workflowState === WORKFLOW_STATES.CHANGES_REQUESTED).length,
      approved: sections.filter(s => s.workflowState === WORKFLOW_STATES.APPROVED).length,
      delivered: sections.filter(s => s.workflowState === WORKFLOW_STATES.DELIVERED).length
    }

    return { ...stats, total: totalSections }
  }

  const renderActivityTab = () => {
    return (
      <div style={{
        padding: '16px',
        height: 'calc(100% - 120px)',
        overflow: 'auto'
      }}>
        <div style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#999999',
          marginBottom: '12px'
        }}>
          Recent Activity
        </div>

        {state.activities.length === 0 ? (
          <div style={{
            color: '#666666',
            fontSize: '11px',
            textAlign: 'center',
            padding: '40px 20px',
            lineHeight: '1.5'
          }}>
            No activity yet.{'\n'}
            Create a workspace and add files to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {state.activities.map(activity => (
              <div
                key={activity.id}
                style={{
                  padding: '8px',
                  border: '1px solid #333333',
                  background: '#111111'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '10px',
                    color: '#999999',
                    marginTop: '1px'
                  }}>
                    {getActivityIcon(activity.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#ffffff',
                      lineHeight: '1.3',
                      marginBottom: '2px'
                    }}>
                      {activity.description}
                    </div>
                    <div style={{
                      fontSize: '9px',
                      color: '#666666',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{activity.user}</span>
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderStatsTab = () => {
    const workflowStats = getWorkflowStats()
    const totalComments = Object.values(state.comments).length

    return (
      <div style={{
        padding: '16px',
        height: 'calc(100% - 120px)',
        overflow: 'auto'
      }}>
        <div style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#999999',
          marginBottom: '12px'
        }}>
          Project Statistics
        </div>

        {/* Workspace Overview */}
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          border: '1px solid #333333',
          background: '#111111'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#ffffff',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            Overview
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#ffffff'
            }}>
              <span>Files</span>
              <span>{state.files.length}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#ffffff'
            }}>
              <span>Sections</span>
              <span>{workflowStats.total}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#ffffff'
            }}>
              <span>Comments</span>
              <span>{totalComments}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#ffffff'
            }}>
              <span>Activities</span>
              <span>{state.activities.length}</span>
            </div>
          </div>
        </div>

        {/* Workflow Status */}
        {workflowStats.total > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            border: '1px solid #333333',
            background: '#111111'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#ffffff',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              Workflow Status
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'Draft', value: workflowStats.draft, color: '#666666' },
                { label: 'Under Review', value: workflowStats.underReview, color: '#ffa502' },
                { label: 'Changes Requested', value: workflowStats.changesRequested, color: '#ff4757' },
                { label: 'Approved', value: workflowStats.approved, color: '#2ed573' },
                { label: 'Delivered', value: workflowStats.delivered, color: '#1e90ff' }
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: item.color,
                    borderRadius: '50%'
                  }} />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    fontSize: '10px',
                    color: '#ffffff'
                  }}>
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div style={{
              marginTop: '8px',
              height: '4px',
              background: '#333333',
              borderRadius: '2px',
              overflow: 'hidden',
              display: 'flex'
            }}>
              {workflowStats.approved > 0 && (
                <div style={{
                  height: '100%',
                  background: '#2ed573',
                  width: `${(workflowStats.approved / workflowStats.total) * 100}%`
                }} />
              )}
              {workflowStats.delivered > 0 && (
                <div style={{
                  height: '100%',
                  background: '#1e90ff',
                  width: `${(workflowStats.delivered / workflowStats.total) * 100}%`
                }} />
              )}
            </div>
            <div style={{
              fontSize: '9px',
              color: '#666666',
              marginTop: '4px',
              textAlign: 'center'
            }}>
              {Math.round(((workflowStats.approved + workflowStats.delivered) / workflowStats.total) * 100)}% Complete
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div style={{
          padding: '12px',
          border: '1px solid #333333',
          background: '#111111'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#ffffff',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            Performance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#ffffff'
            }}>
              <span>Avg. Comments per Section</span>
              <span>
                {workflowStats.total > 0 ? (totalComments / workflowStats.total).toFixed(1) : '0'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#ffffff'
            }}>
              <span>Approval Rate</span>
              <span>
                {workflowStats.total > 0 ? Math.round((workflowStats.approved / workflowStats.total) * 100) : 0}%
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#ffffff'
            }}>
              <span>Revision Rate</span>
              <span>
                {workflowStats.total > 0 ? Math.round((workflowStats.changesRequested / workflowStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTeamTab = () => {
    const collaborators = state.collaborators.length || 1 // At least the current user

    return (
      <div style={{
        padding: '16px',
        height: 'calc(100% - 120px)',
        overflow: 'auto'
      }}>
        <div style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#999999',
          marginBottom: '12px'
        }}>
          Team Members ({collaborators})
        </div>

        <div style={{
          padding: '12px',
          border: '1px solid #333333',
          background: '#111111',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#666666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#ffffff'
            }}>
              Y
            </div>
            <div>
              <div style={{
                fontSize: '11px',
                color: '#ffffff',
                fontWeight: 'bold'
              }}>
                You (Owner)
              </div>
              <div style={{
                fontSize: '9px',
                color: '#666666'
              }}>
                Active now
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '9px',
            color: '#999999'
          }}>
            Full access to all files and workflows
          </div>
        </div>

        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666666',
          fontSize: '11px',
          lineHeight: '1.5'
        }}>
          Invite collaborators to review and approve sections.{'\n'}
          External collaborators can access via secure links without signing up.
        </div>

        <button
          style={{
            width: '100%',
            background: 'none',
            border: '1px solid #666666',
            color: '#ffffff',
            padding: '8px',
            fontSize: '10px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          Invite Collaborators
        </button>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'activity': return renderActivityTab()
      case 'stats': return renderStatsTab()
      case 'team': return renderTeamTab()
      default: return renderActivityTab()
    }
  }

  if (collapsed) {
    return (
      <div style={{
        width: '40px',
        height: '100vh',
        background: '#000000',
        borderLeft: '1px solid #333333',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0'
      }}>
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            color: '#666666',
            cursor: 'pointer',
            fontSize: '12px',
            transform: 'rotate(-90deg)',
            marginBottom: '20px'
          }}
        >
          ◐
        </button>
        <div style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontSize: '10px',
          color: '#666666',
          letterSpacing: '2px'
        }}>
          PANEL
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '320px',
      height: '100vh',
      background: '#000000',
      borderLeft: '1px solid #333333',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #333333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#ffffff',
          fontWeight: 'bold'
        }}>
          Project Panel
        </div>
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            color: '#666666',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ╱
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333333'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              background: activeTab === tab.id ? '#111111' : 'transparent',
              border: 'none',
              color: activeTab === tab.id ? '#ffffff' : '#666666',
              padding: '12px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #ffffff' : '2px solid transparent'
            }}
            title={tab.label}
          >
            <div style={{ marginBottom: '2px' }}>{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {renderTabContent()}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #333333',
        fontSize: '9px',
        color: '#666666',
        textAlign: 'center'
      }}>
        {state.currentWorkspace ? (
          <div>
            <div>{state.currentWorkspace.name}</div>
            <div style={{ marginTop: '2px', opacity: 0.7 }}>
              Real-time collaboration
            </div>
          </div>
        ) : (
          'No workspace selected'
        )}
      </div>
    </div>
  )
}

export default RightPanel