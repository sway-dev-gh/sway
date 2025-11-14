'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'terminal-dark' | 'terminal-light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('terminal-dark')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('sway-theme') as Theme
    if (savedTheme && ['terminal-dark', 'terminal-light'].includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      // Default to dark mode
      setTheme('terminal-dark')
    }
  }, [])

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('terminal-dark', 'terminal-light')

    // Add current theme class
    root.classList.add(theme)

    // Save theme to localStorage
    localStorage.setItem('sway-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'terminal-dark' ? 'terminal-light' : 'terminal-dark')
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}