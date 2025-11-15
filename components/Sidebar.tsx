'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  FolderOpen,
  Users,
  FileCheck,
  Activity,
  Settings
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ElementType
  count?: number
}

const navigation: NavigationItem[] = [
  { name: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'workspace', href: '/workspace', icon: FolderOpen },
  { name: 'teams', href: '/teams', icon: Users },
  { name: 'review', href: '/review', icon: FileCheck },
  { name: 'activity', href: '/activity', icon: Activity },
  { name: 'settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col bg-terminal-surface border-r border-terminal-border h-screen font-mono"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-terminal-border overflow-hidden">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              <img
                src="/logo.png"
                alt="Sway"
                className="h-8"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Logo */}
        {collapsed && (
          <div className="flex items-center justify-center w-full">
            <img
              src="/logo.png"
              alt="Sway"
              className="h-6 w-6 object-contain"
            />
          </div>
        )}

        <div className="flex items-center">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-terminal-muted hover:text-terminal-text transition-colors p-1"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  className={`flex items-center text-sm transition-colors group cursor-pointer relative ${
                    isActive
                      ? 'text-terminal-text bg-terminal-hover'
                      : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover'
                  }`}
                >
                  <div className="flex items-center space-x-3 w-full py-3 px-4">
                    {!collapsed && (
                      <>
                        <item.icon size={16} />
                        <span className="text-terminal-text capitalize">{item.name}</span>
                        {item.count && (
                          <span className="text-terminal-muted ml-auto text-xs">({item.count})</span>
                        )}
                      </>
                    )}

                    {collapsed && (
                      <div className="flex items-center justify-center w-full">
                        <item.icon size={16} />
                      </div>
                    )}
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-terminal-text"
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>

      </nav>

      {/* User Status and Logout */}
      <div className="border-t border-terminal-border p-4">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* User Info */}
              <div className="text-xs text-terminal-muted space-y-1">
                <div className="text-terminal-text font-medium">
                  {user?.username || 'User'}
                </div>
                <div className="text-[10px]">{user?.email}</div>
              </div>


              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center space-x-2 w-full text-xs text-terminal-muted hover:text-terminal-text transition-colors py-2 px-2 hover:bg-terminal-hover rounded-sm"
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-2 h-2 bg-terminal-text rounded-full"></div>
            <button
              onClick={logout}
              className="text-terminal-muted hover:text-terminal-text transition-colors p-1"
            >
              <LogOut size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}