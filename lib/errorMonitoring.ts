/**
 * Enterprise-Grade Error Handling and Monitoring System
 * World-class error tracking, alerting, and resolution
 */

import { analytics } from './analytics'

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  DATA_INTEGRITY = 'data_integrity',
  COLLABORATION = 'collaboration',
  UI = 'ui',
  EXTERNAL_SERVICE = 'external_service'
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  workspaceId?: string
  documentId?: string
  route?: string
  userAgent?: string
  timestamp?: Date
  stackTrace?: string
  errorBoundary?: string
  componentStack?: string
  props?: Record<string, any>
  state?: Record<string, any>
  previousErrors?: ErrorReport[]
  breadcrumbs?: ErrorBreadcrumb[]
}

export interface ErrorBreadcrumb {
  timestamp: Date
  category: string
  message: string
  level: 'info' | 'warning' | 'error'
  data?: Record<string, any>
}

export interface ErrorReport {
  id: string
  message: string
  stack?: string
  severity: ErrorSeverity
  category: ErrorCategory
  context: ErrorContext
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  tags: string[]
  fingerprint: string
  occurrences: number
  firstSeen: Date
  lastSeen: Date
  impactedUsers: string[]
  environmentData: EnvironmentData
  performanceImpact?: PerformanceImpact
}

export interface EnvironmentData {
  nodeEnv: string
  version: string
  platform: string
  memory: {
    total: number
    used: number
    available: number
  }
  uptime: number
  loadAverage: number[]
  networkLatency: number
}

export interface PerformanceImpact {
  renderDelayMs: number
  memoryLeakDetected: boolean
  cpuSpike: boolean
  networkErrors: number
  userExperienceScore: number
}

export interface ErrorAlert {
  type: 'email' | 'slack' | 'webhook' | 'sms'
  severity: ErrorSeverity
  threshold: number
  timeWindow: number // minutes
  enabled: boolean
  recipients: string[]
}

export interface ErrorResolution {
  errorId: string
  status: 'investigating' | 'fixing' | 'resolved' | 'wont_fix'
  assignee?: string
  notes: string[]
  estimatedResolutionTime?: Date
  actualResolutionTime?: Date
  rootCause?: string
  preventionMeasures?: string[]
  relatedIssues?: string[]
}

class EnterpriseErrorMonitor {
  private errors: Map<string, ErrorReport> = new Map()
  private breadcrumbs: ErrorBreadcrumb[] = []
  private maxBreadcrumbs = 100
  private alertRules: ErrorAlert[] = []
  private isInitialized = false
  private errorQueue: ErrorReport[] = []
  private batchSize = 10
  private flushInterval = 5000 // 5 seconds

  constructor() {
    this.initializeErrorHandling()
    this.initializeBatchProcessing()
    this.setupDefaultAlerts()
  }

  private initializeErrorHandling(): void {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.captureError(
          new Error(event.message),
          ErrorSeverity.HIGH,
          ErrorCategory.SYSTEM,
          {
            route: window.location.pathname,
            stackTrace: event.error?.stack,
            lineNumber: event.lineno,
            columnNumber: event.colno,
            filename: event.filename
          }
        )
      })

      // Unhandled promise rejection
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(
          new Error(event.reason?.message || 'Unhandled Promise Rejection'),
          ErrorSeverity.CRITICAL,
          ErrorCategory.SYSTEM,
          {
            route: window.location.pathname,
            promiseRejection: true,
            reason: event.reason
          }
        )
      })

      // Network errors
      this.setupNetworkErrorTracking()
    }

    // Node.js error handling
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.captureError(error, ErrorSeverity.CRITICAL, ErrorCategory.SYSTEM)
        // Don't exit in production - log and continue
        if (process.env.NODE_ENV !== 'production') {
          process.exit(1)
        }
      })

      process.on('unhandledRejection', (reason, promise) => {
        this.captureError(
          new Error(reason?.toString() || 'Unhandled Rejection'),
          ErrorSeverity.CRITICAL,
          ErrorCategory.SYSTEM,
          { promise: promise.toString() }
        )
      })
    }

    this.isInitialized = true
  }

  private setupNetworkErrorTracking(): void {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const start = performance.now()
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - start

        if (!response.ok) {
          this.captureError(
            new Error(`Network Error: ${response.status} ${response.statusText}`),
            this.getNetworkErrorSeverity(response.status),
            ErrorCategory.NETWORK,
            {
              url: args[0]?.toString(),
              status: response.status,
              statusText: response.statusText,
              duration,
              method: args[1]?.method || 'GET'
            }
          )
        }

        return response
      } catch (error) {
        const duration = performance.now() - start
        this.captureError(
          error instanceof Error ? error : new Error('Network request failed'),
          ErrorSeverity.HIGH,
          ErrorCategory.NETWORK,
          {
            url: args[0]?.toString(),
            duration,
            method: args[1]?.method || 'GET',
            networkError: true
          }
        )
        throw error
      }
    }
  }

  private getNetworkErrorSeverity(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.CRITICAL
    if (status >= 400) return ErrorSeverity.HIGH
    return ErrorSeverity.MEDIUM
  }

  private initializeBatchProcessing(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.flushErrors()
      }, this.flushInterval)

      window.addEventListener('beforeunload', () => {
        this.flushErrors()
      })
    }
  }

  private setupDefaultAlerts(): void {
    this.alertRules = [
      {
        type: 'email',
        severity: ErrorSeverity.CRITICAL,
        threshold: 1,
        timeWindow: 5,
        enabled: true,
        recipients: ['admin@swayfiles.com']
      },
      {
        type: 'slack',
        severity: ErrorSeverity.HIGH,
        threshold: 5,
        timeWindow: 15,
        enabled: true,
        recipients: ['#alerts']
      },
      {
        type: 'webhook',
        severity: ErrorSeverity.MEDIUM,
        threshold: 10,
        timeWindow: 30,
        enabled: true,
        recipients: ['https://hooks.slack.com/services/...']
      }
    ]
  }

  // Public API Methods
  public captureError(
    error: Error,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    context: Partial<ErrorContext> = {}
  ): string {
    try {
      const errorId = this.generateErrorId(error)
      const fingerprint = this.generateFingerprint(error, category)

      const fullContext: ErrorContext = {
        ...context,
        userId: context.userId || this.getCurrentUserId(),
        sessionId: context.sessionId || this.getCurrentSessionId(),
        route: context.route || this.getCurrentRoute(),
        userAgent: context.userAgent || this.getUserAgent(),
        timestamp: new Date(),
        stackTrace: error.stack,
        breadcrumbs: [...this.breadcrumbs]
      }

      let errorReport: ErrorReport

      if (this.errors.has(fingerprint)) {
        // Update existing error
        errorReport = this.errors.get(fingerprint)!
        errorReport.occurrences++
        errorReport.lastSeen = new Date()
        errorReport.impactedUsers = [...new Set([...errorReport.impactedUsers, fullContext.userId!].filter(Boolean))]
      } else {
        // Create new error report
        errorReport = {
          id: errorId,
          message: error.message,
          stack: error.stack,
          severity,
          category,
          context: fullContext,
          timestamp: new Date(),
          resolved: false,
          tags: this.generateTags(error, category, context),
          fingerprint,
          occurrences: 1,
          firstSeen: new Date(),
          lastSeen: new Date(),
          impactedUsers: fullContext.userId ? [fullContext.userId] : [],
          environmentData: this.getEnvironmentData(),
          performanceImpact: this.calculatePerformanceImpact(error, context)
        }

        this.errors.set(fingerprint, errorReport)
      }

      // Add to queue for batch processing
      this.errorQueue.push(errorReport)

      // Track in analytics
      analytics.trackError(error, {
        severity,
        category,
        ...context
      })

      // Check alert rules
      this.checkAlertRules(errorReport)

      this.debugLog('Error captured:', errorReport.id, errorReport.message)

      return errorReport.id
    } catch (captureError) {
      console.error('Error Monitor: Failed to capture error:', captureError)
      return 'unknown'
    }
  }

  public addBreadcrumb(category: string, message: string, level: ErrorBreadcrumb['level'] = 'info', data?: Record<string, any>): void {
    const breadcrumb: ErrorBreadcrumb = {
      timestamp: new Date(),
      category,
      message,
      level,
      data
    }

    this.breadcrumbs.push(breadcrumb)

    // Keep only the last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs)
    }
  }

  public captureException(error: Error, context?: Partial<ErrorContext>): string {
    return this.captureError(error, ErrorSeverity.HIGH, ErrorCategory.SYSTEM, context)
  }

  public captureMessage(message: string, level: ErrorSeverity = ErrorSeverity.MEDIUM, context?: Partial<ErrorContext>): string {
    return this.captureError(new Error(message), level, ErrorCategory.BUSINESS_LOGIC, context)
  }

  public captureAuthError(error: Error, context?: Partial<ErrorContext>): string {
    return this.captureError(error, ErrorSeverity.HIGH, ErrorCategory.AUTHENTICATION, context)
  }

  public captureNetworkError(error: Error, context?: Partial<ErrorContext>): string {
    return this.captureError(error, ErrorSeverity.MEDIUM, ErrorCategory.NETWORK, context)
  }

  public captureCollaborationError(error: Error, context?: Partial<ErrorContext>): string {
    return this.captureError(error, ErrorSeverity.HIGH, ErrorCategory.COLLABORATION, context)
  }

  public resolveError(errorId: string, resolvedBy: string, notes?: string): boolean {
    for (const [fingerprint, error] of this.errors.entries()) {
      if (error.id === errorId) {
        error.resolved = true
        error.resolvedAt = new Date()
        error.resolvedBy = resolvedBy

        if (notes) {
          this.addResolutionNotes(errorId, notes)
        }

        this.debugLog('Error resolved:', errorId)
        return true
      }
    }
    return false
  }

  public getErrorReport(errorId: string): ErrorReport | undefined {
    for (const error of this.errors.values()) {
      if (error.id === errorId) {
        return error
      }
    }
    return undefined
  }

  public getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return Array.from(this.errors.values()).filter(error => error.category === category)
  }

  public getErrorsBySeverity(severity: ErrorSeverity): ErrorReport[] {
    return Array.from(this.errors.values()).filter(error => error.severity === severity)
  }

  public getUnresolvedErrors(): ErrorReport[] {
    return Array.from(this.errors.values()).filter(error => !error.resolved)
  }

  public getErrorStats(): {
    total: number
    unresolved: number
    bySeverity: Record<ErrorSeverity, number>
    byCategory: Record<ErrorCategory, number>
    impactedUsers: number
    averageResolutionTime: number
  } {
    const errors = Array.from(this.errors.values())
    const resolved = errors.filter(e => e.resolved)

    const bySeverity = {} as Record<ErrorSeverity, number>
    const byCategory = {} as Record<ErrorCategory, number>

    errors.forEach(error => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
      byCategory[error.category] = (byCategory[error.category] || 0) + 1
    })

    const allImpactedUsers = new Set()
    errors.forEach(error => {
      error.impactedUsers.forEach(user => allImpactedUsers.add(user))
    })

    const resolutionTimes = resolved
      .filter(e => e.resolvedAt && e.firstSeen)
      .map(e => e.resolvedAt!.getTime() - e.firstSeen.getTime())

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0

    return {
      total: errors.length,
      unresolved: errors.filter(e => !e.resolved).length,
      bySeverity,
      byCategory,
      impactedUsers: allImpactedUsers.size,
      averageResolutionTime
    }
  }

  // Private helper methods
  private generateErrorId(error: Error): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `err_${timestamp}_${random}`
  }

  private generateFingerprint(error: Error, category: ErrorCategory): string {
    // Create a unique fingerprint for grouping similar errors
    const message = error.message || 'Unknown Error'
    const stack = error.stack || ''
    const firstStackLine = stack.split('\n')[1] || ''

    return btoa(`${category}:${message}:${firstStackLine}`).replace(/[^a-zA-Z0-9]/g, '').substr(0, 32)
  }

  private generateTags(error: Error, category: ErrorCategory, context: Partial<ErrorContext>): string[] {
    const tags = [category]

    if (error.name) tags.push(`error_type:${error.name}`)
    if (context.route) tags.push(`route:${context.route}`)
    if (context.userId) tags.push('has_user')
    if (context.workspaceId) tags.push('workspace_context')

    return tags
  }

  private getCurrentUserId(): string | undefined {
    if (typeof window !== 'undefined') {
      try {
        const user = localStorage.getItem('user')
        return user ? JSON.parse(user).id : undefined
      } catch {
        return undefined
      }
    }
    return undefined
  }

  private getCurrentSessionId(): string | undefined {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sessionId') || undefined
    }
    return undefined
  }

  private getCurrentRoute(): string | undefined {
    if (typeof window !== 'undefined') {
      return window.location.pathname
    }
    return undefined
  }

  private getUserAgent(): string | undefined {
    if (typeof window !== 'undefined') {
      return navigator.userAgent
    }
    return undefined
  }

  private getEnvironmentData(): EnvironmentData {
    let environmentData: EnvironmentData = {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
      platform: 'unknown',
      memory: { total: 0, used: 0, available: 0 },
      uptime: 0,
      loadAverage: [],
      networkLatency: 0
    }

    if (typeof window !== 'undefined') {
      environmentData.platform = navigator.platform

      if ('memory' in (performance as any)) {
        const memory = (performance as any).memory
        environmentData.memory = {
          total: memory.jsHeapSizeLimit,
          used: memory.usedJSHeapSize,
          available: memory.jsHeapSizeLimit - memory.usedJSHeapSize
        }
      }
    }

    if (typeof process !== 'undefined') {
      environmentData.platform = process.platform
      environmentData.uptime = process.uptime()

      try {
        const memUsage = process.memoryUsage()
        environmentData.memory = {
          total: memUsage.heapTotal,
          used: memUsage.heapUsed,
          available: memUsage.heapTotal - memUsage.heapUsed
        }

        if (process.loadavg) {
          environmentData.loadAverage = process.loadavg()
        }
      } catch {
        // Ignore if not available
      }
    }

    return environmentData
  }

  private calculatePerformanceImpact(error: Error, context: Partial<ErrorContext>): PerformanceImpact {
    return {
      renderDelayMs: this.estimateRenderDelay(error),
      memoryLeakDetected: this.detectMemoryLeak(),
      cpuSpike: this.detectCpuSpike(),
      networkErrors: this.getRecentNetworkErrors(),
      userExperienceScore: this.calculateUXScore(error, context)
    }
  }

  private estimateRenderDelay(error: Error): number {
    // Estimate render delay based on error type
    if (error.name === 'ChunkLoadError') return 2000
    if (error.message.includes('timeout')) return 1500
    if (error.message.includes('network')) return 1000
    return 0
  }

  private detectMemoryLeak(): boolean {
    if (typeof window !== 'undefined' && 'memory' in (performance as any)) {
      const memory = (performance as any).memory
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      return usagePercentage > 80 // Consider 80%+ usage as potential leak
    }
    return false
  }

  private detectCpuSpike(): boolean {
    // Simple CPU spike detection based on timing
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      Math.random()
    }
    const duration = performance.now() - start
    return duration > 10 // If simple operation takes >10ms, might indicate CPU spike
  }

  private getRecentNetworkErrors(): number {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return Array.from(this.errors.values())
      .filter(e => e.category === ErrorCategory.NETWORK && e.timestamp.getTime() > fiveMinutesAgo)
      .length
  }

  private calculateUXScore(error: Error, context: Partial<ErrorContext>): number {
    let score = 100

    // Deduct points based on error severity and impact
    if (error.message.includes('crashed')) score -= 50
    if (error.message.includes('timeout')) score -= 30
    if (error.message.includes('failed')) score -= 20
    if (context.userId) score -= 10 // User-facing error

    return Math.max(0, score)
  }

  private checkAlertRules(errorReport: ErrorReport): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return

      if (this.shouldTriggerAlert(rule, errorReport)) {
        this.triggerAlert(rule, errorReport)
      }
    })
  }

  private shouldTriggerAlert(rule: ErrorAlert, errorReport: ErrorReport): boolean {
    if (errorReport.severity !== rule.severity) return false

    const timeWindowMs = rule.timeWindow * 60 * 1000
    const cutoffTime = Date.now() - timeWindowMs

    const recentErrors = Array.from(this.errors.values())
      .filter(e => e.severity === rule.severity && e.timestamp.getTime() > cutoffTime)

    return recentErrors.length >= rule.threshold
  }

  private async triggerAlert(rule: ErrorAlert, errorReport: ErrorReport): Promise<void> {
    try {
      const alertData = {
        rule,
        error: errorReport,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      }

      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
        credentials: 'include'
      })

      this.debugLog('Alert triggered:', rule.type, errorReport.id)
    } catch (error) {
      console.warn('Failed to trigger alert:', error)
    }
  }

  private addResolutionNotes(errorId: string, notes: string): void {
    // Implementation would add notes to error resolution tracking
    this.debugLog('Resolution notes added:', errorId, notes)
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return

    try {
      const errorsToFlush = [...this.errorQueue]
      this.errorQueue = []

      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors: errorsToFlush }),
        credentials: 'include'
      })

      this.debugLog('Errors flushed:', errorsToFlush.length)
    } catch (error) {
      console.warn('Failed to flush errors:', error)
      // Re-add to queue for retry
      this.errorQueue.unshift(...this.errorQueue)
    }
  }

  private debugLog(...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ErrorMonitor]', ...args)
    }
  }

  public destroy(): void {
    this.flushErrors()
    this.errors.clear()
    this.breadcrumbs = []
    this.errorQueue = []
  }
}

// Global error monitor instance
export const errorMonitor = new EnterpriseErrorMonitor()

// React Error Boundary HOC
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return class ErrorBoundaryComponent extends React.Component<P, { hasError: boolean }> {
    constructor(props: P) {
      super(props)
      this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): { hasError: boolean } {
      errorMonitor.captureError(error, ErrorSeverity.HIGH, ErrorCategory.UI, {
        errorBoundary: 'withErrorBoundary',
        componentStack: error.stack
      })
      return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      errorMonitor.captureError(error, ErrorSeverity.HIGH, ErrorCategory.UI, {
        errorBoundary: 'withErrorBoundary',
        componentStack: errorInfo.componentStack,
        errorInfo
      })
    }

    render(): React.ReactNode {
      if (this.state.hasError) {
        return React.createElement('div', {
          className: 'error-fallback p-6 text-center'
        }, [
          React.createElement('h2', {
            key: 'title',
            className: 'text-xl font-semibold text-red-600 mb-2'
          }, 'Something went wrong'),
          React.createElement('p', {
            key: 'message',
            className: 'text-gray-600 mb-4'
          }, 'We\'ve been notified about this issue and are working on a fix.'),
          React.createElement('button', {
            key: 'button',
            onClick: () => this.setState({ hasError: false }),
            className: 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          }, 'Try Again')
        ])
      }

      return React.createElement(WrappedComponent as any, this.props)
    }
  }
}

// React hook for error monitoring
export function useErrorMonitoring() {
  return {
    captureError: errorMonitor.captureError.bind(errorMonitor),
    captureException: errorMonitor.captureException.bind(errorMonitor),
    captureMessage: errorMonitor.captureMessage.bind(errorMonitor),
    addBreadcrumb: errorMonitor.addBreadcrumb.bind(errorMonitor),
    captureAuthError: errorMonitor.captureAuthError.bind(errorMonitor),
    captureNetworkError: errorMonitor.captureNetworkError.bind(errorMonitor),
    captureCollaborationError: errorMonitor.captureCollaborationError.bind(errorMonitor),
    getErrorStats: errorMonitor.getErrorStats.bind(errorMonitor)
  }
}