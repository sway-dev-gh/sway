import React, { useState, useEffect } from 'react'
import LeftSidebar from './components/LeftSidebar'
import CenterWorkspace from './components/CenterWorkspace'
import RightPanel from './components/RightPanel'
import AuthForm from './components/AuthForm'
import { WorkspaceProvider, useWorkspace } from './stores/WorkspaceStore'

const AuthenticatedApp = () => {
  const { state, actions } = useWorkspace()
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  // Initialize authentication on app start
  useEffect(() => {
    actions.initializeAuth()
  }, [])

  // Show loading state while checking authentication
  if (state.isLoading && !state.isAuthenticated) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '24px',
            marginBottom: '16px'
          }}>
            ◧
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666666'
          }}>
            Initializing SwayFiles...
          </div>
        </div>
      </div>
    )
  }

  // Show auth form if not authenticated
  if (!state.isAuthenticated) {
    return <AuthForm />
  }

  // Show main workspace interface if authenticated
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: '#000000',
      color: '#ffffff',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar - Project Navigator */}
      <LeftSidebar />

      {/* Center Workspace - Main File & Section Workspace */}
      <CenterWorkspace />

      {/* Right Panel - Activity Feed & Stats (Collapsible) */}
      <RightPanel
        collapsed={rightPanelCollapsed}
        onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
      />
    </div>
  )
}

const App = () => {
  return (
    <WorkspaceProvider>
      <AuthenticatedApp />
    </WorkspaceProvider>
  )
}

export default App