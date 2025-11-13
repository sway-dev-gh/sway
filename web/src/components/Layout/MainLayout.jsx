import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const MainLayout = ({ children }) => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '▣' },
    { path: '/collaborate', label: 'Collaborate', icon: '◈' },
    { path: '/settings', label: 'Settings', icon: '◯' }
  ]

  const isActive = (path) => {
    if (path === '/collaborate') {
      return location.pathname.startsWith('/collaborate')
    }
    return location.pathname === path
  }

  return (
    <div className="flex h-screen bg-terminal-bg">
      {/* Sidebar Navigation */}
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 80 : 240 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-terminal-surface border-r border-terminal-border flex flex-col"
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-terminal-border">
          <motion.div
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-3"
          >
            <div className="text-lg text-terminal-text">◧</div>
            <div className="text-sm font-medium text-terminal-text tracking-tight">
              SwayFiles
            </div>
          </motion.div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-terminal-muted hover:text-terminal-text transition-colors p-1"
          >
            <div className="text-xs">
              {isCollapsed ? '▶' : '◀'}
            </div>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6">
          <div className="space-y-2 px-3">
            {navItems.map((item) => {
              const active = isActive(item.path)
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={`
                      relative flex items-center space-x-3 px-3 py-2 rounded-md text-sm
                      transition-colors cursor-pointer
                      ${active
                        ? 'bg-terminal-accent text-terminal-text'
                        : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-accent/50'
                      }
                    `}
                  >
                    <div className="text-base">{item.icon}</div>
                    <motion.span
                      animate={{ opacity: isCollapsed ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>

                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-terminal-text rounded-r"
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-terminal-border">
          <motion.div
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-terminal-muted"
          >
            <div className="mb-1">Versionless Collaboration</div>
            <div className="text-[10px] opacity-60">v2.0.0</div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-terminal-surface border-b border-terminal-border flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            {/* Breadcrumb */}
            <div className="text-sm text-terminal-muted">
              <span className="text-terminal-text">SwayFiles</span>
              <span className="mx-2">/</span>
              <span>
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname.startsWith('/collaborate') && 'Collaboration'}
                {location.pathname === '/settings' && 'Settings'}
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-terminal-muted">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Connected</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 overflow-hidden"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

export default MainLayout