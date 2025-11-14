'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    projects: 0,
    activeCollaborations: 0,
    recentActivity: 0
  })

  useEffect(() => {
    // Simulate loading stats
    setStats({
      projects: 3,
      activeCollaborations: 1,
      recentActivity: 7
    })
  }, [])

  return (
    <AppLayout>
      <div className="min-h-screen bg-terminal-bg">
        {/* Header with Wave Logo */}
        <div className="bg-terminal-surface border-b border-terminal-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 text-terminal-text opacity-90 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 120C60 100, 80 140, 100 120C120 100, 140 140, 160 120"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"/>
                    <path d="M40 140C60 120, 80 160, 100 140C120 120, 140 160, 160 140"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"/>
                    <path d="M40 80C60 60, 80 100, 100 80C120 60, 140 100, 160 80"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-medium text-terminal-text">SwayFiles</h1>
                  <p className="text-sm text-terminal-muted">Versionless Collaboration</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-terminal-muted">Welcome back</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-medium text-terminal-text mb-2">Dashboard</h2>
              <p className="text-terminal-muted">
                Welcome to your SwayFiles workspace. Start collaborating on your projects.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-terminal-surface border border-terminal-border p-6 hover:border-terminal-text/30 transition-colors"
              >
                <h3 className="text-lg font-medium text-terminal-text mb-2">Projects</h3>
                <p className="text-3xl font-bold text-terminal-text mb-1">{stats.projects}</p>
                <p className="text-sm text-terminal-muted">Active projects</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-terminal-surface border border-terminal-border p-6 hover:border-terminal-text/30 transition-colors"
              >
                <h3 className="text-lg font-medium text-terminal-text mb-2">Collaborations</h3>
                <p className="text-3xl font-bold text-terminal-text mb-1">{stats.activeCollaborations}</p>
                <p className="text-sm text-terminal-muted">Live sessions</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-terminal-surface border border-terminal-border p-6 hover:border-terminal-text/30 transition-colors"
              >
                <h3 className="text-lg font-medium text-terminal-text mb-2">Recent Activity</h3>
                <p className="text-3xl font-bold text-terminal-text mb-1">{stats.recentActivity}</p>
                <p className="text-sm text-terminal-muted">Actions today</p>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/workspace')}
                className="bg-terminal-text text-terminal-bg p-6 font-medium hover:bg-terminal-text/90 transition-colors"
              >
                <div className="text-lg font-medium mb-2">Workspace</div>
                <div className="text-sm opacity-80">Manage your projects</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/teams')}
                className="bg-terminal-surface border border-terminal-border p-6 font-medium hover:border-terminal-text/50 transition-colors text-terminal-text"
              >
                <div className="text-lg font-medium mb-2">Teams</div>
                <div className="text-sm text-terminal-muted">Collaborate with others</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/review')}
                className="bg-terminal-surface border border-terminal-border p-6 font-medium hover:border-terminal-text/50 transition-colors text-terminal-text"
              >
                <div className="text-lg font-medium mb-2">Review</div>
                <div className="text-sm text-terminal-muted">Review workflows</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/settings')}
                className="bg-terminal-surface border border-terminal-border p-6 font-medium hover:border-terminal-text/50 transition-colors text-terminal-text"
              >
                <div className="text-lg font-medium mb-2">Settings</div>
                <div className="text-sm text-terminal-muted">Manage preferences</div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}