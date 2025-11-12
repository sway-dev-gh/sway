import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useReviewStore from '../store/reviewStore'
import SectionReviewInterface from './SectionReviewInterface'
import WorkflowStateManager from './WorkflowStateManager'
import VersionHistory from './VersionHistory'
import ReviewerManager from './ReviewerManager'
import ApprovalTracker from './ApprovalTracker'
import theme from '../theme'
import { standardStyles } from './StandardStyles'
import toast from 'react-hot-toast'

const ProjectWorkspace = ({ projectId, onClose }) => {
  const [selectedSection, setSelectedSection] = useState(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // overview, reviewers, approvals, workflow, history
  const [uploadData, setUploadData] = useState({
    filename: '',
    filepath: '',
    file_size: 0,
    sections: []
  })
  const [newSectionName, setNewSectionName] = useState('')
  const [activeFileVersions, setActiveFileVersions] = useState(null)
  const [activeFileWorkflow, setActiveFileWorkflow] = useState(null)
  const [projectSections, setProjectSections] = useState([])

  const navigate = useNavigate()

  const {
    currentProject,
    isLoading,
    error,
    fetchProject,
    uploadFileWithSections,
    generateExternalAccess
  } = useReviewStore()

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId, fetchProject])

  useEffect(() => {
    // Extract all sections from project files
    if (currentProject && currentProject.files) {
      const allSections = currentProject.files.reduce((sections, file) => {
        if (file.sections) {
          return [...sections, ...file.sections.map(section => ({
            ...section,
            fileId: file.id,
            filename: file.filename
          }))]
        }
        return sections
      }, [])
      setProjectSections(allSections)
    }
  }, [currentProject])

  const handleReviewerUpdate = () => {
    // Refresh project data when reviewers are updated
    fetchProject(projectId)
  }

  const handleWorkflowUpdate = () => {
    // Refresh project data when workflow state changes
    fetchProject(projectId)
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: '#525252',
      under_review: '#1e40af',
      changes_requested: '#dc2626',
      approved: '#059669',
      delivered: '#7c3aed'
    }
    return colors[status] || '#525252'
  }

  const getStatusBackground = (status) => {
    const backgrounds = {
      draft: '#262626',
      under_review: '#1e3a8a',
      changes_requested: '#991b1b',
      approved: '#047857',
      delivered: '#5b21b6'
    }
    return backgrounds[status] || '#262626'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#059669',
      normal: '#525252',
      high: '#d97706',
      urgent: '#dc2626'
    }
    return colors[priority] || '#525252'
  }

  const handleUploadFile = async () => {
    if (!uploadData.filename || uploadData.sections.length === 0) {
      toast.error('Please provide filename and at least one section')
      return
    }

    try {
      await uploadFileWithSections(projectId, uploadData)
      toast.success('File uploaded successfully!')
      setUploadModalOpen(false)
      setUploadData({
        filename: '',
        filepath: '',
        file_size: 0,
        sections: []
      })
      // Refresh project data
      fetchProject(projectId)
    } catch (error) {
      toast.error('Failed to upload file')
    }
  }

  const addSection = () => {
    if (!newSectionName.trim()) return

    setUploadData({
      ...uploadData,
      sections: [
        ...uploadData.sections,
        {
          name: newSectionName.trim(),
          type: 'content',
          description: '',
          data: {}
        }
      ]
    })
    setNewSectionName('')
  }

  const removeSection = (index) => {
    setUploadData({
      ...uploadData,
      sections: uploadData.sections.filter((_, i) => i !== index)
    })
  }

  const generateShareLink = async (fileId, sectionId = null) => {
    try {
      const accessData = {
        project_id: projectId,
        file_id: fileId,
        section_id: sectionId,
        collaborator_email: '',
        collaborator_name: '',
        access_level: 'view_comment',
        expires_in_days: 7
      }

      const result = await generateExternalAccess(accessData)

      // Copy to clipboard
      navigator.clipboard.writeText(result.access_url)
      toast.success('Share link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to generate share link')
    }
  }

  if (isLoading) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: theme.colors.text.secondary
      }}>
        Loading project workspace...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: theme.colors.text.secondary
      }}>
        Error: {error}
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: theme.colors.text.secondary
      }}>
        Project not found
      </div>
    )
  }

  // If a section is selected, show the review interface
  if (selectedSection) {
    return (
      <SectionReviewInterface
        sectionId={selectedSection}
        onClose={() => setSelectedSection(null)}
      />
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.bg.page,
      color: theme.colors.text.primary
    }}>
      {/* Header */}
      <div style={{
        background: '#000000',
        borderBottom: `1px solid ${theme.colors.border.light}`,
        padding: '32px',
        marginBottom: '32px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ marginBottom: '16px' }}>
              {onClose && (
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.colors.text.secondary,
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '0',
                    marginBottom: '8px'
                  }}
                >
                  ← Back to Projects
                </button>
              )}
            </div>

            <h1 style={standardStyles.pageHeader}>
              {currentProject.title}
            </h1>

            <p style={{
              ...standardStyles.pageDescription,
              marginBottom: '16px'
            }}>
              {currentProject.description}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '13px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: theme.colors.text.secondary }}>
                  Workspace:
                </span>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  background: '#262626',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {currentProject.workspace_type}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: theme.colors.text.secondary }}>
                  Template:
                </span>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  background: '#262626',
                  textTransform: 'capitalize'
                }}>
                  {currentProject.workflow_template}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setUploadModalOpen(true)}
              style={standardStyles.primaryButton}
            >
              Upload File
            </button>

            <button
              onClick={() => generateShareLink(null, null)}
              style={standardStyles.secondaryButton}
            >
              Share Project
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 32px auto',
        padding: '0 32px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={standardStyles.statsNumber}>
              {currentProject.files_with_workflow || 0}
            </div>
            <div style={{
              fontSize: '13px',
              color: theme.colors.text.secondary
            }}>
              Files in Workflow
            </div>
          </div>

          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={standardStyles.statsNumber}>
              {currentProject.approved_sections || 0}
            </div>
            <div style={{
              fontSize: '13px',
              color: theme.colors.text.secondary
            }}>
              Approved Sections
            </div>
          </div>

          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={standardStyles.statsNumber}>
              {currentProject.pending_reviews || 0}
            </div>
            <div style={{
              fontSize: '13px',
              color: theme.colors.text.secondary
            }}>
              Pending Reviews
            </div>
          </div>

          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={standardStyles.statsNumber}>
              {currentProject.unresolved_comments || 0}
            </div>
            <div style={{
              fontSize: '13px',
              color: theme.colors.text.secondary
            }}>
              Open Comments
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 32px auto',
        padding: '0 32px'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${theme.colors.border.light}`,
          marginBottom: '32px'
        }}>
          {[
            { key: 'overview', label: 'Files & Sections', icon: '📁' },
            { key: 'reviewers', label: 'Review Team', icon: '👥' },
            { key: 'approvals', label: 'Approval Tracking', icon: '✅' },
            { key: 'workflow', label: 'Workflow Status', icon: '🔄' },
            { key: 'history', label: 'Version History', icon: '📖' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                color: activeTab === tab.key ? theme.colors.text.primary : theme.colors.text.secondary,
                borderBottom: activeTab === tab.key ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.color = theme.colors.text.primary
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.color = theme.colors.text.secondary
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 32px'
      }}>
        {activeTab === 'overview' && (
          <div>
            <h2 style={{
              ...standardStyles.sectionHeader,
              marginBottom: '24px'
            }}>
              Files & Sections
            </h2>

        {currentProject.files && currentProject.files.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {currentProject.files.map((file) => (
              <div
                key={file.id}
                style={{
                  background: '#000000',
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {/* File Header */}
                <div style={{
                  padding: '24px',
                  borderBottom: `1px solid ${theme.colors.border.light}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: theme.weight.semibold,
                      color: theme.colors.text.primary,
                      margin: '0 0 8px 0'
                    }}>
                      {file.filename}
                    </h3>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '13px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: theme.colors.text.secondary }}>
                          Status:
                        </span>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: theme.weight.medium,
                          color: getStatusColor(file.current_state),
                          background: getStatusBackground(file.current_state),
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {file.current_state?.replace('_', ' ') || 'draft'}
                        </div>
                      </div>

                      {file.priority_level && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ color: theme.colors.text.secondary }}>
                            Priority:
                          </span>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: theme.weight.medium,
                            color: getPriorityColor(file.priority_level),
                            background: '#262626',
                            textTransform: 'capitalize'
                          }}>
                            {file.priority_level}
                          </div>
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: theme.colors.text.secondary }}>
                          Progress:
                        </span>
                        <div style={{
                          color: theme.colors.text.primary,
                          fontWeight: theme.weight.medium
                        }}>
                          {file.completion_percentage || 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => generateShareLink(file.id)}
                      style={{
                        ...standardStyles.secondaryButton,
                        padding: '6px 12px',
                        fontSize: '12px'
                      }}
                    >
                      Share
                    </button>
                  </div>
                </div>

                {/* File Sections */}
                {file.sections && file.sections.length > 0 && (
                  <div style={{ padding: '24px' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: theme.weight.semibold,
                      color: theme.colors.text.primary,
                      margin: '0 0 16px 0'
                    }}>
                      Sections ({file.sections.length})
                    </h4>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '12px'
                    }}>
                      {file.sections.map((section, index) => (
                        <div
                          key={section.id}
                          onClick={() => setSelectedSection(section.id)}
                          style={{
                            background: '#0a0a0a',
                            border: `1px solid ${theme.colors.border.light}`,
                            borderLeft: `4px solid ${getStatusColor(section.section_status)}`,
                            borderRadius: '6px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1a1a1a'
                            e.currentTarget.style.borderColor = theme.colors.border.medium
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#0a0a0a'
                            e.currentTarget.style.borderColor = theme.colors.border.light
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '8px'
                          }}>
                            <h5 style={{
                              fontSize: '14px',
                              fontWeight: theme.weight.medium,
                              color: theme.colors.text.primary,
                              margin: 0
                            }}>
                              {section.section_name}
                            </h5>

                            <div style={{
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: theme.weight.medium,
                              color: getStatusColor(section.section_status),
                              background: getStatusBackground(section.section_status),
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px'
                            }}>
                              {section.section_status?.replace('_', ' ') || 'draft'}
                            </div>
                          </div>

                          <div style={{
                            fontSize: '13px',
                            color: theme.colors.text.secondary,
                            marginBottom: '8px'
                          }}>
                            Type: {section.section_type}
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '11px',
                            color: theme.colors.text.tertiary
                          }}>
                            {section.assigned_reviewers && section.assigned_reviewers.length > 0 && (
                              <span>
                                {section.assigned_reviewers.length} reviewer{section.assigned_reviewers.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {section.is_required_for_approval && (
                              <span style={{
                                color: '#dc2626',
                                fontWeight: theme.weight.medium
                              }}>
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!file.sections || file.sections.length === 0) && (
                  <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: theme.colors.text.secondary,
                    fontSize: '13px'
                  }}>
                    No sections defined for this file
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px',
            padding: '64px 32px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px',
              color: theme.colors.text.secondary,
              opacity: 0.3
            }}>
              📁
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              margin: '0 0 8px 0'
            }}>
              No files uploaded yet
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              margin: '0 0 24px 0'
            }}>
              Upload your first file to start the review workflow
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              style={standardStyles.primaryButton}
            >
              Upload File
            </button>
          </div>
        )}
          </div>
        )}

        {activeTab === 'reviewers' && (
          <ReviewerManager
            projectId={projectId}
            sections={projectSections}
            onReviewerUpdate={handleReviewerUpdate}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalTracker
            projectId={projectId}
            sections={projectSections}
            onWorkflowUpdate={handleWorkflowUpdate}
          />
        )}

        {activeTab === 'workflow' && (
          <WorkflowStateManager
            projectId={projectId}
            onStateChange={handleWorkflowUpdate}
          />
        )}

        {activeTab === 'history' && (
          <VersionHistory
            projectId={projectId}
            fileId={activeFileVersions}
          />
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '90vw',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              margin: '0 0 24px 0'
            }}>
              Upload File with Sections
            </h2>

            {/* Filename */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: theme.weight.medium,
                color: theme.colors.text.secondary,
                marginBottom: '6px'
              }}>
                Filename *
              </label>
              <input
                type="text"
                value={uploadData.filename}
                onChange={(e) => setUploadData({
                  ...uploadData,
                  filename: e.target.value
                })}
                placeholder="e.g., design-document.pdf"
                style={{
                  width: '100%',
                  background: '#0a0a0a',
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '4px',
                  padding: '10px 12px',
                  color: theme.colors.text.primary,
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Sections */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: theme.weight.medium,
                color: theme.colors.text.secondary,
                marginBottom: '12px'
              }}>
                Sections for Review *
              </label>

              {/* Add new section */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Section name"
                  style={{
                    flex: 1,
                    background: '#0a0a0a',
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '4px',
                    padding: '8px 12px',
                    color: theme.colors.text.primary,
                    fontSize: '13px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addSection()
                    }
                  }}
                />
                <button
                  onClick={addSection}
                  disabled={!newSectionName.trim()}
                  style={{
                    ...standardStyles.secondaryButton,
                    padding: '8px 16px',
                    opacity: !newSectionName.trim() ? 0.5 : 1
                  }}
                >
                  Add
                </button>
              </div>

              {/* Sections list */}
              {uploadData.sections.length > 0 && (
                <div style={{
                  background: '#0a0a0a',
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '6px',
                  padding: '12px'
                }}>
                  {uploadData.sections.map((section, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: index < uploadData.sections.length - 1 ?
                          `1px solid ${theme.colors.border.light}` : 'none'
                      }}
                    >
                      <span style={{
                        color: theme.colors.text.primary,
                        fontSize: '13px'
                      }}>
                        {section.name}
                      </span>
                      <button
                        onClick={() => removeSection(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadData.sections.length === 0 && (
                <div style={{
                  background: '#0a0a0a',
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                  color: theme.colors.text.secondary,
                  fontSize: '13px'
                }}>
                  No sections added yet. Add at least one section for review.
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setUploadModalOpen(false)}
                style={standardStyles.secondaryButton}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadFile}
                disabled={!uploadData.filename || uploadData.sections.length === 0 || isLoading}
                style={{
                  ...standardStyles.primaryButton,
                  opacity: (!uploadData.filename || uploadData.sections.length === 0 || isLoading) ? 0.5 : 1
                }}
              >
                {isLoading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectWorkspace