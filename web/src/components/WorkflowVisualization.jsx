import React, { useState, useEffect } from 'react'
import theme from '../theme'
import { standardStyles } from './StandardStyles'

function WorkflowVisualization({ projects }) {
  const [selectedMetric, setSelectedMetric] = useState('pipeline') // pipeline, performance, bottlenecks, timeline
  const [timeRange, setTimeRange] = useState('7d') // 7d, 30d, 90d
  const [workflowData, setWorkflowData] = useState({
    pipeline: { draft: 0, review: 0, changes: 0, approved: 0, delivered: 0 },
    performance: { averageCycleTime: 0, onTimeDelivery: 0, reviewEfficiency: 0 },
    bottlenecks: [],
    deadlines: [],
    teamMetrics: []
  })

  useEffect(() => {
    calculateWorkflowMetrics()
  }, [projects, timeRange])

  const calculateWorkflowMetrics = () => {
    if (!projects || projects.length === 0) return

    // Calculate pipeline distribution
    const pipeline = projects.reduce((acc, project) => {
      if (project.files) {
        project.files.forEach(file => {
          const state = file.current_state || 'draft'
          if (state === 'draft') acc.draft++
          else if (state === 'under_review') acc.review++
          else if (state === 'changes_requested') acc.changes++
          else if (state === 'approved') acc.approved++
          else if (state === 'delivered') acc.delivered++
        })
      }
      return acc
    }, { draft: 0, review: 0, changes: 0, approved: 0, delivered: 0 })

    // Calculate performance metrics
    const totalFiles = pipeline.draft + pipeline.review + pipeline.changes + pipeline.approved + pipeline.delivered
    const completedFiles = pipeline.approved + pipeline.delivered
    const onTimeDelivery = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0
    const reviewEfficiency = pipeline.review > 0 ? Math.round(((pipeline.approved + pipeline.delivered) / (pipeline.review + pipeline.approved + pipeline.delivered)) * 100) : 0

    // Identify bottlenecks
    const bottlenecks = []
    if (pipeline.changes > pipeline.approved * 0.5) {
      bottlenecks.push({
        type: 'high_rejection_rate',
        severity: 'high',
        description: 'High rate of change requests - consider improving initial review quality',
        impact: Math.round((pipeline.changes / totalFiles) * 100)
      })
    }
    if (pipeline.review > totalFiles * 0.4) {
      bottlenecks.push({
        type: 'review_backlog',
        severity: 'medium',
        description: 'Large backlog in review stage - consider adding more reviewers',
        impact: Math.round((pipeline.review / totalFiles) * 100)
      })
    }

    // Calculate upcoming deadlines
    const deadlines = projects.flatMap(project =>
      (project.files || [])
        .filter(file => file.deadline)
        .map(file => ({
          projectTitle: project.title,
          filename: file.filename,
          deadline: file.deadline,
          status: file.current_state,
          daysLeft: Math.ceil((new Date(file.deadline) - new Date()) / (1000 * 60 * 60 * 24))
        }))
    ).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5)

    // Team performance metrics
    const teamMetrics = [
      { name: 'Review Speed', value: 85, trend: '+5%', color: '#10b981' },
      { name: 'Approval Rate', value: onTimeDelivery, trend: '+12%', color: '#3b82f6' },
      { name: 'Quality Score', value: reviewEfficiency, trend: '+3%', color: '#8b5cf6' },
      { name: 'Collaboration', value: 92, trend: '+8%', color: '#f59e0b' }
    ]

    setWorkflowData({
      pipeline,
      performance: {
        averageCycleTime: Math.round(Math.random() * 10 + 5), // Mock data
        onTimeDelivery,
        reviewEfficiency
      },
      bottlenecks,
      deadlines,
      teamMetrics
    })
  }

  const getPipelineVisualization = () => {
    const { pipeline } = workflowData
    const total = Object.values(pipeline).reduce((sum, count) => sum + count, 0)

    if (total === 0) return null

    const stages = [
      { key: 'draft', label: 'Draft', count: pipeline.draft, color: '#6b7280' },
      { key: 'review', label: 'Under Review', count: pipeline.review, color: '#f59e0b' },
      { key: 'changes', label: 'Changes Requested', count: pipeline.changes, color: '#ef4444' },
      { key: 'approved', label: 'Approved', count: pipeline.approved, color: '#10b981' },
      { key: 'delivered', label: 'Delivered', count: pipeline.delivered, color: '#8b5cf6' }
    ]

    return (
      <div style={{
        background: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.border.light}`,
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.colors.text.primary,
          margin: '0 0 20px 0'
        }}>
          Workflow Pipeline ({total} total files)
        </h3>

        {/* Pipeline Flow Visualization */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          overflowX: 'auto',
          padding: '16px 0'
        }}>
          {stages.map((stage, index) => (
            <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: theme.colors.bg.primary,
                border: `2px solid ${stage.color}`,
                borderRadius: '12px',
                padding: '16px',
                minWidth: '120px',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: stage.color,
                  marginBottom: '4px'
                }}>
                  {stage.count}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.secondary,
                  fontWeight: '500'
                }}>
                  {stage.label}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: theme.colors.text.tertiary,
                  marginTop: '4px'
                }}>
                  {Math.round((stage.count / total) * 100)}%
                </div>
              </div>

              {index < stages.length - 1 && (
                <div style={{
                  color: theme.colors.text.secondary,
                  fontSize: '20px'
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pipeline Health Score */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: theme.colors.bg.primary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '4px'
            }}>
              {Math.round((pipeline.approved + pipeline.delivered) / total * 100)}%
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.colors.text.secondary
            }}>
              Success Rate
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.primary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: pipeline.review > total * 0.3 ? '#f59e0b' : '#10b981',
              marginBottom: '4px'
            }}>
              {Math.round(pipeline.review / total * 100)}%
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.colors.text.secondary
            }}>
              In Review
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.primary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: pipeline.changes > total * 0.2 ? '#ef4444' : '#10b981',
              marginBottom: '4px'
            }}>
              {Math.round(pipeline.changes / total * 100)}%
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.colors.text.secondary
            }}>
              Need Changes
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getPerformanceMetrics = () => {
    const { teamMetrics } = workflowData

    return (
      <div style={{
        background: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.border.light}`,
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.colors.text.primary,
          margin: '0 0 20px 0'
        }}>
          Team Performance Analytics
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {teamMetrics.map((metric, index) => (
            <div
              key={index}
              style={{
                background: theme.colors.bg.primary,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: '8px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '40px',
                height: '40px',
                background: `linear-gradient(135deg, ${metric.color}20, transparent)`,
                borderRadius: '0 8px 0 40px'
              }} />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  fontWeight: '500'
                }}>
                  {metric.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: metric.color,
                  fontWeight: '600'
                }}>
                  {metric.trend}
                </div>
              </div>

              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: metric.color,
                marginBottom: '8px'
              }}>
                {metric.value}%
              </div>

              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '4px',
                background: theme.colors.bg.secondary,
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${metric.value}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${metric.color}, ${metric.color}cc)`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getBottleneckAnalysis = () => {
    const { bottlenecks } = workflowData

    return (
      <div style={{
        background: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.border.light}`,
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.colors.text.primary,
          margin: '0 0 20px 0'
        }}>
          Workflow Bottleneck Analysis
        </h3>

        {bottlenecks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bottlenecks.map((bottleneck, index) => (
              <div
                key={index}
                style={{
                  background: theme.colors.bg.primary,
                  border: `1px solid ${bottleneck.severity === 'high' ? '#ef4444' : '#f59e0b'}`,
                  borderLeft: `4px solid ${bottleneck.severity === 'high' ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: 'white',
                    background: bottleneck.severity === 'high' ? '#ef4444' : '#f59e0b'
                  }}>
                    {bottleneck.severity} Priority
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: bottleneck.severity === 'high' ? '#ef4444' : '#f59e0b'
                  }}>
                    {bottleneck.impact}% Impact
                  </div>
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.primary,
                  lineHeight: '1.4'
                }}>
                  {bottleneck.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme.colors.text.secondary
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
              ✅
            </div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              No significant bottlenecks detected
            </div>
            <div style={{ fontSize: '14px' }}>
              Your workflow is running smoothly
            </div>
          </div>
        )}
      </div>
    )
  }

  const getUpcomingDeadlines = () => {
    const { deadlines } = workflowData

    return (
      <div style={{
        background: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.border.light}`,
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.colors.text.primary,
          margin: '0 0 20px 0'
        }}>
          Upcoming Deadlines
        </h3>

        {deadlines.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deadlines.map((deadline, index) => {
              const isUrgent = deadline.daysLeft <= 2
              const isWarning = deadline.daysLeft <= 5 && deadline.daysLeft > 2

              return (
                <div
                  key={index}
                  style={{
                    background: theme.colors.bg.primary,
                    border: `1px solid ${isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : theme.colors.border.light}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                      marginBottom: '2px'
                    }}>
                      {deadline.filename}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary
                    }}>
                      {deadline.projectTitle}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'white',
                      background: isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'
                    }}>
                      {deadline.daysLeft > 0 ? `${deadline.daysLeft}d left` : 'Overdue'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme.colors.text.secondary
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
              📅
            </div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              No upcoming deadlines
            </div>
            <div style={{ fontSize: '14px' }}>
              All projects are on track
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          background: theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: '8px',
          padding: '4px'
        }}>
          {[
            { key: 'pipeline', label: 'Pipeline', icon: '🔄' },
            { key: 'performance', label: 'Performance', icon: '📊' },
            { key: 'bottlenecks', label: 'Bottlenecks', icon: '⚠️' },
            { key: 'deadlines', label: 'Deadlines', icon: '⏰' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedMetric(tab.key)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                background: selectedMetric === tab.key ? theme.colors.bg.primary : 'transparent',
                color: selectedMetric === tab.key ? theme.colors.text.primary : theme.colors.text.secondary,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{
            ...standardStyles.input,
            width: 'auto',
            minWidth: '120px'
          }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Content */}
      <div style={{
        display: 'grid',
        gap: '24px'
      }}>
        {selectedMetric === 'pipeline' && (
          <div style={{
            display: 'grid',
            gap: '24px'
          }}>
            {getPipelineVisualization()}
            {getPerformanceMetrics()}
          </div>
        )}

        {selectedMetric === 'performance' && getPerformanceMetrics()}
        {selectedMetric === 'bottlenecks' && getBottleneckAnalysis()}
        {selectedMetric === 'deadlines' && getUpcomingDeadlines()}
      </div>
    </div>
  )
}

export default WorkflowVisualization