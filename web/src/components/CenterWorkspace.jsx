import React, { useState } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'
import SectionBlock from './SectionBlock'

const CenterWorkspace = () => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [showPricingPage, setShowPricingPage] = useState(false)

  // Get sections for the current file, sorted by order
  const getCurrentFileSections = () => {
    if (!state.selectedFile) return []

    return state.selectedFile.sections
      .map(sectionId => state.sections[sectionId])
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)
  }

  const handleAddSection = () => {
    if (newSectionTitle.trim() && state.selectedFile) {
      const currentSections = getCurrentFileSections()
      actions.addSection(
        state.selectedFile.id,
        newSectionTitle.trim(),
        '',
        currentSections.length
      )
      setNewSectionTitle('')
      setShowAddSection(false)
    }
  }

  const handleDragStart = (e, sectionId) => {
    e.dataTransfer.setData('text/plain', sectionId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetSectionId) => {
    e.preventDefault()
    const draggedSectionId = e.dataTransfer.getData('text/plain')

    if (draggedSectionId !== targetSectionId) {
      const sections = getCurrentFileSections()
      const draggedIndex = sections.findIndex(s => s.id === draggedSectionId)
      const targetIndex = sections.findIndex(s => s.id === targetSectionId)

      // Create new order
      const newSections = [...sections]
      const [draggedSection] = newSections.splice(draggedIndex, 1)
      newSections.splice(targetIndex, 0, draggedSection)

      // Update order
      const newOrder = newSections.map(s => s.id)
      actions.reorderSections(newOrder)
    }
  }

  const getWorkflowStatusColor = (status) => {
    switch (status) {
      case WORKFLOW_STATES.DRAFT: return '#666666'
      case WORKFLOW_STATES.UNDER_REVIEW: return '#ffa502'
      case WORKFLOW_STATES.CHANGES_REQUESTED: return '#ff4757'
      case WORKFLOW_STATES.APPROVED: return '#2ed573'
      case WORKFLOW_STATES.DELIVERED: return '#1e90ff'
      default: return '#666666'
    }
  }

  const renderWelcomeScreen = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
      padding: '60px 40px',
      background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.95) 70%)',
      position: 'relative'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: '0 0 30px rgba(255, 255, 255, 0.1)'
      }}>
        ◧
      </div>
      <h1 style={{
        fontSize: '28px',
        color: '#ffffff',
        marginBottom: '16px',
        fontWeight: '600',
        letterSpacing: '-0.02em',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Welcome to SwayFiles v2.0
      </h1>
      <p style={{
        fontSize: '15px',
        maxWidth: '480px',
        lineHeight: '1.6',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '32px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        A developer-first workspace for reviewing and approving creative projects, code, and files.
        Create a workspace and add files to get started.
      </p>
      <div style={{
        padding: '12px 24px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: '0.02em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textTransform: 'uppercase',
        backdropFilter: 'blur(10px)'
      }}>
        GitHub × Notion-inspired collaboration
      </div>
    </div>
  )

  const renderNoFileSelected = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
      padding: '60px 40px',
      background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.01) 0%, rgba(0, 0, 0, 0.98) 60%)',
      position: 'relative'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.3))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
      }}>
        ◈
      </div>
      <h2 style={{
        fontSize: '22px',
        color: '#ffffff',
        marginBottom: '12px',
        fontWeight: '600',
        letterSpacing: '-0.01em',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Select a file to get started
      </h2>
      <p style={{
        fontSize: '14px',
        maxWidth: '360px',
        lineHeight: '1.6',
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Choose a file from the sidebar to begin reviewing and adding sections.
      </p>
    </div>
  )

  const renderFileWorkspace = () => {
    const sections = getCurrentFileSections()

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* File header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.01) 0%, rgba(0, 0, 0, 0.95) 100%)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: '22px',
                margin: 0,
                color: '#ffffff',
                fontWeight: '600',
                letterSpacing: '-0.02em',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {state.selectedFile.name}
              </h1>
              {state.selectedFile.workflow_status && (
                <div style={{
                  marginTop: '12px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: '500'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getWorkflowStatusColor(state.selectedFile.workflow_status),
                    marginRight: '8px',
                    boxShadow: `0 0 6px ${getWorkflowStatusColor(state.selectedFile.workflow_status)}40`
                  }}></span>
                  {state.selectedFile.workflow_status.replace('_', ' ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 28px'
        }}>
          {sections.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 40px',
              background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.005) 0%, rgba(0, 0, 0, 0.99) 50%)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              <div style={{
                fontSize: '32px',
                marginBottom: '20px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ◎
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: '1.5'
              }}>
                No sections yet. Add one to get started.
              </p>
            </div>
          ) : (
            sections.map(section => (
              <SectionBlock
                key={section.id}
                section={section}
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, section.id)}
              />
            ))
          )}

          {/* Add section button */}
          {showAddSection ? (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.8) 100%)',
              backdropFilter: 'blur(10px)'
            }}>
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Section title"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  outline: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSection()
                  }
                  if (e.key === 'Escape') {
                    setShowAddSection(false)
                    setNewSectionTitle('')
                  }
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.6)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.08)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.4)'
                }}
              />
              <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '10px'
              }}>
                <button
                  onClick={handleAddSection}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%)'
                    e.target.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  Add Section
                </button>
                <button
                  onClick={() => {
                    setShowAddSection(false)
                    setNewSectionTitle('')
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'rgba(255, 255, 255, 0.8)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'rgba(255, 255, 255, 0.6)'
                    e.target.style.background = 'transparent'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSection(true)}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '16px',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.5)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'rgba(255, 255, 255, 0.8)'
                e.target.style.border = '1px dashed rgba(255, 255, 255, 0.2)'
                e.target.style.background = 'rgba(255, 255, 255, 0.01)'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'rgba(255, 255, 255, 0.5)'
                e.target.style.border = '1px dashed rgba(255, 255, 255, 0.1)'
                e.target.style.background = 'transparent'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              + Add Section
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      height: '100vh',
      background: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {!state.currentWorkspace ? (
        renderWelcomeScreen()
      ) : !state.selectedFile ? (
        renderNoFileSelected()
      ) : (
        renderFileWorkspace()
      )}
    </div>
  )
}

export default CenterWorkspace