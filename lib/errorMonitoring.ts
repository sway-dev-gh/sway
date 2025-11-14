'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { analytics } from './analytics'

interface ErrorInfo {
  componentStack: string
}

interface ErrorContext {
  route?: string
  details?: any
}

class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    analytics.trackError(error, {
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      details: errorInfo
    } as any)
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        className: 'error-fallback p-6 text-center'
      }, [
        React.createElement('h2', { key: 'title', className: 'text-xl font-bold text-red-600 mb-4' }, 'Something went wrong'),
        React.createElement('p', { key: 'message', className: 'text-gray-600 mb-4' }, 'An unexpected error occurred. Please refresh the page.'),
        React.createElement('button', {
          key: 'button',
          className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700',
          onClick: () => window.location.reload()
        }, 'Refresh Page')
      ])
    }

    return this.props.children
  }
}

interface ErrorMonitoringContextType {
  trackError: (error: Error, context?: ErrorContext) => void
}

const ErrorMonitoringContext = createContext<ErrorMonitoringContextType | null>(null)

export function ErrorMonitoringProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analytics.trackError(
        new Error(event.message || 'Unknown Error'),
        {
          route: window.location.pathname,
          details: event
        } as any
      )
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(
        new Error(event.reason?.toString() || 'Unhandled Promise Rejection'),
        {
          route: window.location.pathname,
          details: event.reason
        } as any
      )
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const trackError = (error: Error, context?: ErrorContext) => {
    analytics.trackError(error, context as any)
  }

  return (
    <ErrorMonitoringContext.Provider value={{ trackError }}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ErrorMonitoringContext.Provider>
  )
}

export function useErrorMonitoring() {
  const context = useContext(ErrorMonitoringContext)
  if (!context) {
    throw new Error('useErrorMonitoring must be used within ErrorMonitoringProvider')
  }
  return context
}

export { ErrorBoundary }
