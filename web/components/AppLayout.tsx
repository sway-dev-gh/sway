'use client'

import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import RightTerminal from './RightTerminal'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-terminal-bg overflow-hidden font-mono">
      {/* Left Terminal */}
      <Sidebar />

      {/* Center Workspace */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col overflow-hidden bg-terminal-bg"
      >
        {children}
      </motion.main>

      {/* Right Terminal */}
      <RightTerminal />
    </div>
  )
}