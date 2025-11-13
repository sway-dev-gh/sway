import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './components/Dashboard/Dashboard'
import CollaborationView from './components/Collaboration/CollaborationView'
import Settings from './components/Settings/Settings'
import './styles.css'

const App = () => {
  return (
    <Router>
      <div className="h-screen w-screen bg-terminal-bg text-terminal-text font-mono overflow-hidden">
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collaborate" element={<CollaborationView />} />
            <Route path="/collaborate/:fileId" element={<CollaborationView />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
      </div>
    </Router>
  )
}

export default App