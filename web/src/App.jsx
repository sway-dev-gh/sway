import React, { useState } from 'react'
import LeftSidebar from './components/LeftSidebar'
import CenterWorkspace from './components/CenterWorkspace'
import RightPanel from './components/RightPanel'
import { WorkspaceProvider } from './stores/WorkspaceStore'

const App = () => {
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  return (
    <WorkspaceProvider>
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
    </WorkspaceProvider>
  )
}

export default App