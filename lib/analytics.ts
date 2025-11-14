/**
 * Enterprise-Grade Analytics and Performance Monitoring
 * World-class real-time analytics for collaborative workspace
 */

export interface AnalyticsEvent {
  type: string
  data: Record<string, any>
  timestamp: Date
  userId?: string
  sessionId?: string
  workspaceId?: string
  deviceInfo?: DeviceInfo
  performanceMetrics?: PerformanceMetrics
}

export interface DeviceInfo {
  userAgent: string
  platform: string
  language: string
  timezone: string
  screenResolution: string
  connectionType?: string
  memoryInfo?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export interface PerformanceMetrics {
  renderTime: number
  syncLatency: number
  memoryUsage: number
  cpuUsage: number
  networkLatency: number
  operationsPerSecond: number
  errorRate: number
}

export interface CollaborationMetrics {
  activeUsers: number
  totalEdits: number
  conflictRate: number
  resolutionTime: number
  documentSize: number
  syncSuccessRate: number
  averageResponseTime: number
}

export interface UserBehaviorMetrics {
  sessionDuration: number
  documentsCreated: number
  collaborationsJoined: number
  commentsPosted: number
  featuresUsed: string[]
  keyboardShortcutsUsed: string[]
  toolbarButtonClicks: number
}

class EnterpriseAnalytics {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private startTime: Date
  private performanceObserver?: PerformanceObserver
  private memoryMonitor?: NodeJS.Timeout
  private metricsBuffer: AnalyticsEvent[] = []
  private batchSize = 50
  private flushInterval = 10000 // 10 seconds
  private isInitialized = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = new Date()
    this.initializePerformanceMonitoring()
    this.initializeBatchProcessing()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initializePerformanceMonitoring(): void {
    try {
      // Performance Observer for Core Web Vitals
      if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackPerformanceEntry(entry)
          }
        })

        this.performanceObserver.observe({
          entryTypes: ['measure', 'navigation', 'paint', 'layout-shift', 'first-input']
        })
      }

      // Memory monitoring
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
        this.memoryMonitor = setInterval(() => {
          this.trackMemoryUsage()
        }, 5000)
      }

      this.isInitialized = true
    } catch (error) {
      console.warn('Analytics: Performance monitoring initialization failed:', error)
    }
  }

  private initializeBatchProcessing(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.flushEvents()
      }, this.flushInterval)

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flushEvents()
      })

      // Flush on visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushEvents()
        }
      })
    }
  }

  private trackPerformanceEntry(entry: PerformanceEntry): void {
    const event: AnalyticsEvent = {
      type: 'performance',
      data: {
        name: entry.name,
        entryType: entry.entryType,
        startTime: entry.startTime,
        duration: entry.duration,
        ...this.extractPerformanceDetails(entry)
      },
      timestamp: new Date(),
      sessionId: this.sessionId,
      performanceMetrics: this.getCurrentPerformanceMetrics()
    }

    this.track(event)
  }

  private extractPerformanceDetails(entry: PerformanceEntry): Record<string, any> {
    const details: Record<string, any> = {}

    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming
      details.loadTime = navEntry.loadEventEnd - navEntry.navigationStart
      details.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.navigationStart
      details.firstByte = navEntry.responseStart - navEntry.navigationStart
    }

    if (entry.entryType === 'paint') {
      details.paintType = entry.name
    }

    if (entry.entryType === 'layout-shift') {
      const lsEntry = entry as PerformanceEntry & { value: number }
      details.shiftValue = lsEntry.value
    }

    if (entry.entryType === 'first-input') {
      const fiEntry = entry as PerformanceEntry & { processingStart: number }
      details.inputDelay = fiEntry.processingStart - entry.startTime
    }

    return details
  }

  private trackMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (performance as any)) {
      const memory = (performance as any).memory

      const event: AnalyticsEvent = {
        type: 'memory_usage',
        data: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        },
        timestamp: new Date(),
        sessionId: this.sessionId
      }

      this.track(event)
    }
  }

  private getCurrentPerformanceMetrics(): PerformanceMetrics {
    return {
      renderTime: this.getAverageRenderTime(),
      syncLatency: this.getAverageSyncLatency(),
      memoryUsage: this.getCurrentMemoryUsage(),
      cpuUsage: this.estimateCPUUsage(),
      networkLatency: this.getAverageNetworkLatency(),
      operationsPerSecond: this.getOperationsPerSecond(),
      errorRate: this.getErrorRate()
    }
  }

  private getAverageRenderTime(): number {
    const renderEvents = this.events.filter(e => e.type === 'render' && e.data.duration)
    if (renderEvents.length === 0) return 0

    const totalTime = renderEvents.reduce((sum, e) => sum + (e.data.duration || 0), 0)
    return totalTime / renderEvents.length
  }

  private getAverageSyncLatency(): number {
    const syncEvents = this.events.filter(e => e.type === 'collaboration_sync')
    if (syncEvents.length === 0) return 0

    const totalLatency = syncEvents.reduce((sum, e) => sum + (e.data.latency || 0), 0)
    return totalLatency / syncEvents.length
  }

  private getCurrentMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (performance as any)) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize
    }
    return 0
  }

  private estimateCPUUsage(): number {
    // Estimate CPU usage based on task timing
    const now = performance.now()
    const taskTime = 1
    const startTime = performance.now()

    // Perform a small computational task
    for (let i = 0; i < 1000; i++) {
      Math.random()
    }

    const endTime = performance.now()
    const actualTime = endTime - startTime

    return Math.min(100, (actualTime / taskTime) * 100)
  }

  private getAverageNetworkLatency(): number {
    const networkEvents = this.events.filter(e => e.type === 'network_request')
    if (networkEvents.length === 0) return 0

    const totalLatency = networkEvents.reduce((sum, e) => sum + (e.data.duration || 0), 0)
    return totalLatency / networkEvents.length
  }

  private getOperationsPerSecond(): number {
    const oneSecondAgo = Date.now() - 1000
    const recentEvents = this.events.filter(e => e.timestamp.getTime() > oneSecondAgo)
    return recentEvents.length
  }

  private getErrorRate(): number {
    const totalEvents = this.events.length
    if (totalEvents === 0) return 0

    const errorEvents = this.events.filter(e => e.type === 'error')
    return (errorEvents.length / totalEvents) * 100
  }

  private getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: 'Server',
        platform: 'Server',
        language: 'en-US',
        timezone: 'UTC',
        screenResolution: '0x0'
      }
    }

    const deviceInfo: DeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`
    }

    // Add connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      deviceInfo.connectionType = connection?.effectiveType || 'unknown'
    }

    // Add memory info if available
    if ('memory' in (performance as any)) {
      deviceInfo.memoryInfo = (performance as any).memory
    }

    return deviceInfo
  }

  // Public API methods
  public track(event: Partial<AnalyticsEvent> & { type: string; data: Record<string, any> }): void {
    try {
      const fullEvent: AnalyticsEvent = {
        ...event,
        timestamp: event.timestamp || new Date(),
        sessionId: this.sessionId,
        deviceInfo: this.getDeviceInfo(),
        performanceMetrics: event.performanceMetrics || this.getCurrentPerformanceMetrics()
      }

      this.events.push(fullEvent)
      this.metricsBuffer.push(fullEvent)

      // Auto-flush if buffer is full
      if (this.metricsBuffer.length >= this.batchSize) {
        this.flushEvents()
      }

      // Keep events array from growing too large
      if (this.events.length > 1000) {
        this.events = this.events.slice(-500)
      }

      this.debugLog('Analytics event tracked:', fullEvent.type, fullEvent.data)
    } catch (error) {
      console.warn('Analytics: Failed to track event:', error)
    }
  }

  public trackCollaborationEvent(type: string, data: Record<string, any>): void {
    this.track({
      type: `collaboration_${type}`,
      data: {
        ...data,
        timestamp: Date.now()
      }
    })
  }

  public trackUserBehavior(action: string, context: Record<string, any>): void {
    this.track({
      type: 'user_behavior',
      data: {
        action,
        context,
        sessionDuration: Date.now() - this.startTime.getTime()
      }
    })
  }

  public trackPerformanceMilestone(milestone: string, timing: number): void {
    this.track({
      type: 'performance_milestone',
      data: {
        milestone,
        timing,
        relativeToStart: Date.now() - this.startTime.getTime()
      }
    })
  }

  public trackError(error: Error, context?: Record<string, any>): void {
    this.track({
      type: 'error',
      data: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        context: context || {},
        timestamp: Date.now()
      }
    })
  }

  public getCollaborationMetrics(): CollaborationMetrics {
    const collabEvents = this.events.filter(e => e.type.startsWith('collaboration_'))

    return {
      activeUsers: this.getUniqueUsers(),
      totalEdits: collabEvents.filter(e => e.type === 'collaboration_edit').length,
      conflictRate: this.calculateConflictRate(),
      resolutionTime: this.getAverageResolutionTime(),
      documentSize: this.getCurrentDocumentSize(),
      syncSuccessRate: this.calculateSyncSuccessRate(),
      averageResponseTime: this.getAverageResponseTime()
    }
  }

  public getUserBehaviorMetrics(): UserBehaviorMetrics {
    const behaviorEvents = this.events.filter(e => e.type === 'user_behavior')

    return {
      sessionDuration: Date.now() - this.startTime.getTime(),
      documentsCreated: behaviorEvents.filter(e => e.data.action === 'document_create').length,
      collaborationsJoined: behaviorEvents.filter(e => e.data.action === 'collaboration_join').length,
      commentsPosted: behaviorEvents.filter(e => e.data.action === 'comment_post').length,
      featuresUsed: [...new Set(behaviorEvents.map(e => e.data.action))],
      keyboardShortcutsUsed: [...new Set(behaviorEvents
        .filter(e => e.data.action === 'keyboard_shortcut')
        .map(e => e.data.context.shortcut))],
      toolbarButtonClicks: behaviorEvents.filter(e => e.data.action === 'toolbar_click').length
    }
  }

  private getUniqueUsers(): number {
    const users = new Set()
    this.events.forEach(e => {
      if (e.userId) users.add(e.userId)
    })
    return users.size
  }

  private calculateConflictRate(): number {
    const totalEdits = this.events.filter(e => e.type === 'collaboration_edit').length
    const conflicts = this.events.filter(e => e.type === 'collaboration_conflict').length

    return totalEdits > 0 ? (conflicts / totalEdits) * 100 : 0
  }

  private getAverageResolutionTime(): number {
    const resolutionEvents = this.events.filter(e => e.type === 'collaboration_conflict_resolved')
    if (resolutionEvents.length === 0) return 0

    const totalTime = resolutionEvents.reduce((sum, e) => sum + (e.data.resolutionTime || 0), 0)
    return totalTime / resolutionEvents.length
  }

  private getCurrentDocumentSize(): number {
    const sizeEvents = this.events.filter(e => e.type === 'document_size_update')
    if (sizeEvents.length === 0) return 0

    const latestSizeEvent = sizeEvents[sizeEvents.length - 1]
    return latestSizeEvent.data.size || 0
  }

  private calculateSyncSuccessRate(): number {
    const syncEvents = this.events.filter(e => e.type === 'collaboration_sync')
    if (syncEvents.length === 0) return 100

    const successfulSyncs = syncEvents.filter(e => e.data.success === true).length
    return (successfulSyncs / syncEvents.length) * 100
  }

  private getAverageResponseTime(): number {
    const responseEvents = this.events.filter(e => e.data.responseTime)
    if (responseEvents.length === 0) return 0

    const totalTime = responseEvents.reduce((sum, e) => sum + (e.data.responseTime || 0), 0)
    return totalTime / responseEvents.length
  }

  private async flushEvents(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    try {
      const eventsToFlush = [...this.metricsBuffer]
      this.metricsBuffer = []

      // Send to analytics endpoint
      await this.sendAnalytics(eventsToFlush)

      this.debugLog('Analytics: Flushed', eventsToFlush.length, 'events')
    } catch (error) {
      console.warn('Analytics: Failed to flush events:', error)
      // Re-add events to buffer for retry
      this.metricsBuffer.unshift(...this.metricsBuffer)
    }
  }

  private async sendAnalytics(events: AnalyticsEvent[]): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          events,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`)
      }
    } catch (error) {
      console.warn('Analytics: Failed to send events to server:', error)
      throw error
    }
  }

  private debugLog(...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', ...args)
    }
  }

  public getSessionSummary(): {
    sessionId: string
    duration: number
    eventsTracked: number
    performanceMetrics: PerformanceMetrics
    collaborationMetrics: CollaborationMetrics
    userBehaviorMetrics: UserBehaviorMetrics
  } {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime.getTime(),
      eventsTracked: this.events.length,
      performanceMetrics: this.getCurrentPerformanceMetrics(),
      collaborationMetrics: this.getCollaborationMetrics(),
      userBehaviorMetrics: this.getUserBehaviorMetrics()
    }
  }

  public destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }

    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor)
    }

    this.flushEvents()
    this.events = []
    this.metricsBuffer = []
  }
}

// Global analytics instance
export const analytics = new EnterpriseAnalytics()

// React hook for using analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackCollaboration: analytics.trackCollaborationEvent.bind(analytics),
    trackBehavior: analytics.trackUserBehavior.bind(analytics),
    trackPerformance: analytics.trackPerformanceMilestone.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    getMetrics: analytics.getCollaborationMetrics.bind(analytics),
    getBehaviorMetrics: analytics.getUserBehaviorMetrics.bind(analytics),
    getSessionSummary: analytics.getSessionSummary.bind(analytics)
  }
}