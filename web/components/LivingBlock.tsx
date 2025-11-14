'use client'

import React, { useState, useEffect, useRef, ReactNode } from 'react'
import { useCollaboration } from '@/contexts/CollaborationContext'
import { motion, AnimatePresence } from 'framer-motion'

interface LivingBlockProps {
  id: string
  title: string
  children: ReactNode
  type?: 'project' | 'file' | 'discussion' | 'task'
  priority?: number
  className?: string
}

interface PresenceIndicator {
  userId: string
  name: string
  mode: 'viewing' | 'editing'
  position?: { x: number; y: number }
}

export default function LivingBlock({
  id,
  title,
  children,
  type = 'project',
  priority = 5,
  className = ''
}: LivingBlockProps) {
  const { state, joinBlock, leaveBlock, recordInteraction, getContextualSuggestions } = useCollaboration()
  const [isHovered, setIsHovered] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activityPulse, setActivityPulse] = useState(0)
  const blockRef = useRef<HTMLDivElement>(null)

  // Get block activity from collaboration state
  const blockActivity = state.blockActivities.get(id)
  const isBeingViewed = blockActivity?.viewers.length > 0
  const isBeingEdited = blockActivity?.editors.length > 0
  const activityLevel = blockActivity?.activityLevel || 0

  // Join block when component mounts or becomes active
  useEffect(() => {
    if (isActive) {
      joinBlock(id, 'view')
      return () => leaveBlock(id)
    }
  }, [isActive, id])

  // Generate contextual suggestions based on activity
  useEffect(() => {
    if (isHovered && blockActivity) {
      const contextualSuggestions = getContextualSuggestions({
        blockId: id,
        activityLevel,
        viewers: blockActivity.viewers,
        type
      })
      setSuggestions(contextualSuggestions)
    }
  }, [isHovered, blockActivity, id, type])

  // Activity pulse animation
  useEffect(() => {
    if (activityLevel > 5) {
      const interval = setInterval(() => {
        setActivityPulse(prev => (prev + 1) % 3)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activityLevel])

  // Record interactions for AI learning
  const handleInteraction = (interactionType: string, details?: any) => {
    recordInteraction({
      type: interactionType,
      blockId: id,
      blockType: type,
      priority,
      details,
      timestamp: Date.now()
    })
  }

  // Dynamic styling based on activity and context
  const getBlockStyling = () => {
    const baseClasses = "bg-terminal-surface border transition-all duration-300"

    let borderClass = "border-terminal-border"
    let glowClass = ""

    // High activity blocks get subtle emphasis
    if (activityLevel > 7) {
      borderClass = "border-terminal-text"
      glowClass = "shadow-[0_0_10px_rgba(255,255,255,0.1)]"
    } else if (activityLevel > 4) {
      borderClass = "border-terminal-muted"
    }

    // Being edited gets priority styling
    if (isBeingEdited) {
      borderClass = "border-terminal-text"
      glowClass = "shadow-[0_0_15px_rgba(255,255,255,0.2)]"
    }

    // Hovered state
    if (isHovered) {
      glowClass = "shadow-[0_0_5px_rgba(255,255,255,0.1)]"
    }

    return `${baseClasses} ${borderClass} ${glowClass}`
  }

  // Presence indicators
  const renderPresenceIndicators = () => {
    if (!blockActivity) return null

    const allUsers = [...blockActivity.viewers, ...blockActivity.editors]
    if (allUsers.length === 0) return null

    return (
      <div className="absolute -top-2 -right-2 flex space-x-1">
        <AnimatePresence>
          {allUsers.slice(0, 3).map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className={`w-3 h-3 rounded-full ${
                blockActivity.editors.includes(user)
                  ? 'bg-terminal-text' // Editing
                  : 'bg-terminal-muted' // Viewing
              }`}
              title={`${user.name} ${blockActivity.editors.includes(user) ? 'editing' : 'viewing'}`}
            />
          ))}
        </AnimatePresence>

        {allUsers.length > 3 && (
          <div className="w-3 h-3 rounded-full bg-terminal-border text-[6px] flex items-center justify-center text-terminal-text">
            +{allUsers.length - 3}
          </div>
        )}
      </div>
    )
  }

  // Activity level indicator
  const renderActivityIndicator = () => {
    if (activityLevel < 3) return null

    const intensity = Math.min(activityLevel / 10, 1)

    return (
      <div className="absolute top-2 left-2">
        <div
          className={`w-2 h-2 rounded-full ${
            activityLevel > 7 ? 'bg-terminal-text' : 'bg-terminal-muted'
          }`}
          style={{ opacity: 0.3 + (intensity * 0.7) }}
        />
      </div>
    )
  }

  // Contextual suggestions overlay
  const renderSuggestions = () => {
    if (!isHovered || suggestions.length === 0) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-terminal-bg border border-terminal-border p-3 text-xs text-terminal-muted z-10"
      >
        <div className="mb-1 text-terminal-text">Contextual Insights:</div>
        {suggestions.slice(0, 2).map((suggestion, index) => (
          <div key={index} className="mb-1">
            • {suggestion}
          </div>
        ))}
      </motion.div>
    )
  }

  // Smart action suggestions
  const renderSmartActions = () => {
    if (!isHovered || !blockActivity?.contextualInfo) return null

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute top-2 right-2 bg-terminal-text text-terminal-bg px-2 py-1 text-xs"
      >
        {blockActivity.contextualInfo}
      </motion.div>
    )
  }

  return (
    <div className="relative group">
      <motion.div
        ref={blockRef}
        className={`${getBlockStyling()} ${className} relative overflow-hidden`}
        onMouseEnter={() => {
          setIsHovered(true)
          handleInteraction('block_hover')
        }}
        onMouseLeave={() => {
          setIsHovered(false)
        }}
        onFocus={() => {
          setIsActive(true)
          handleInteraction('block_focus')
        }}
        onBlur={() => {
          setIsActive(false)
        }}
        onClick={() => {
          handleInteraction('block_click', { priority, activityLevel })
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isHovered ? 1.01 : 1
        }}
        transition={{
          duration: 0.2,
          scale: { duration: 0.1 }
        }}
        layout
        layoutId={id}
      >
        {/* Activity pulse overlay */}
        {activityLevel > 6 && (
          <motion.div
            className="absolute inset-0 border border-terminal-text opacity-20"
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Presence indicators */}
        {renderPresenceIndicators()}

        {/* Activity level indicator */}
        {renderActivityIndicator()}

        {/* Smart actions */}
        {renderSmartActions()}

        {/* Block header with living title */}
        <div className="flex items-center justify-between mb-4">
          <motion.h3
            className="text-terminal-text font-medium"
            animate={{
              color: activityLevel > 7 ? '#ffffff' : '#e5e5e5'
            }}
          >
            {title}
          </motion.h3>

          {/* Priority indicator */}
          {priority > 7 && (
            <div className="w-1 h-1 bg-terminal-text rounded-full opacity-60" />
          )}
        </div>

        {/* Block content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Hover glow effect */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 border border-terminal-text opacity-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>

      {/* Contextual suggestions */}
      <AnimatePresence>
        {renderSuggestions()}
      </AnimatePresence>
    </div>
  )
}