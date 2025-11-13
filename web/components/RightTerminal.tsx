'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Terminal, Activity, FileText, Clock } from 'lucide-react'

interface TerminalLog {
  id: string
  timestamp: string
  type: 'info' | 'error' | 'success' | 'warning'
  message: string
  user?: string
}

const logs: TerminalLog[] = []

export default function RightTerminal() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'logs' | 'activity' | 'output'>('logs')

  const tabs = [
    { key: 'logs', label: 'Recent', icon: Clock },
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'output', label: 'Notifications', icon: FileText },
  ]

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 64 : 320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col bg-terminal-surface border-l border-terminal-border h-screen"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-terminal-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              <span className="text-sm text-terminal-text font-medium">
                Activity
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-terminal-muted hover:text-terminal-text transition-colors p-1"
        >
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Tabs */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex border-b border-terminal-border"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-2 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                  activeTab === tab.key
                    ? 'bg-terminal-accent text-terminal-text border-b border-terminal-text'
                    : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <tab.icon size={12} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full p-2"
            >
              {activeTab === 'logs' && (
                <div className="space-y-3">
                  <div className="text-sm text-terminal-text mb-3 border-b border-terminal-border pb-2">
                    Recent Activity
                  </div>
                  <div className="space-y-3 max-h-full overflow-y-auto">
                    <div className="text-center py-8">
                      <p className="text-terminal-muted text-sm">No recent activity</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3">
                  <div className="text-sm text-terminal-text mb-3 border-b border-terminal-border pb-2">
                    Activity Feed
                  </div>
                  <div className="space-y-3">
                    <div className="text-center py-8">
                      <p className="text-terminal-muted text-sm">No activity yet</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'output' && (
                <div className="space-y-3">
                  <div className="text-sm text-terminal-text mb-3 border-b border-terminal-border pb-2">
                    Notifications
                  </div>
                  <div className="space-y-3">
                    <div className="text-center py-8">
                      <p className="text-terminal-muted text-sm">No notifications</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed state */}
        {collapsed && (
          <div className="flex flex-col items-center py-4 space-y-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`p-2 rounded transition-colors relative ${
                  activeTab === tab.key
                    ? 'bg-terminal-accent text-terminal-text'
                    : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover'
                }`}
                title={tab.label}
              >
                <tab.icon size={16} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-terminal-border p-2">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs font-mono text-terminal-muted text-center"
            >
              SYSTEM ONLINE
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}