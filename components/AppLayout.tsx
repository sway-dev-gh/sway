'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import RightTerminal from './RightTerminal'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-terminal-bg overflow-hidden font-mono">
      {/* Left Terminal */}
      <Sidebar />

      {/* Center Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden bg-terminal-bg relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              transition: {
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
                staggerChildren: 0.1
              }
            }}
            exit={{
              opacity: 0,
              x: -30,
              scale: 0.95,
              transition: {
                duration: 0.3,
                ease: [0.55, 0.06, 0.68, 0.19]
              }
            }}
            className="flex-1 flex flex-col overflow-hidden bg-terminal-bg absolute inset-0"
            style={{ willChange: 'transform, opacity' }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Right Terminal */}
      <RightTerminal />

    </div>
  )
}