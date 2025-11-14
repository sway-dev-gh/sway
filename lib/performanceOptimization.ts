'use client'

import { analytics } from './analytics'

// Types
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  expiry: number
  hits: number
  lastAccessed: number
  priority: number
}

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
  memoryUsage: number
  cacheHitRate: number
}

interface OptimizationConfig {
  maxCacheSize: number
  cacheExpiry: number
  preloadThreshold: number
  compressionLevel: number
  enableBatching: boolean
  enablePreloading: boolean
  enableCompression: boolean
}

// Enhanced Intelligent Cache System
class EnterpriseIntelligentCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly maxSize: number
  private readonly defaultExpiry: number
  private accessPatterns = new Map<string, number[]>()
  private preloadQueue = new Set<string>()

  constructor(maxSize: number = 1000, defaultExpiry: number = 3600000) {
    this.maxSize = maxSize
    this.defaultExpiry = defaultExpiry

    // Start cleanup and optimization routines
    this.startCleanupRoutine()
    this.startOptimizationRoutine()
  }

  set(key: string, value: T, expiry?: number): void {
    const now = Date.now()
    const expiryTime = now + (expiry || this.defaultExpiry)

    // Make space if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastImportant()
    }

    this.cache.set(key, {
      data: value,
      timestamp: now,
      expiry: expiryTime,
      hits: 0,
      lastAccessed: now,
      priority: this.calculatePriority(key)
    })

    this.recordAccess(key)
    analytics.trackPerformance('cache_write', now - Date.now())
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      analytics.trackPerformance('cache_miss', 1)
      return null
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      analytics.trackPerformance('cache_expired', 1)
      return null
    }

    entry.hits++
    entry.lastAccessed = Date.now()
    this.recordAccess(key)

    analytics.trackPerformance('cache_hit', 1)
    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry ? Date.now() <= entry.expiry : false
  }

  delete(key: string): boolean {
    this.accessPatterns.delete(key)
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.accessPatterns.clear()
    this.preloadQueue.clear()
  }

  getStats(): { size: number; hitRate: number; totalHits: number; totalMisses: number } {
    const entries = Array.from(this.cache.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0)

    return {
      size: this.cache.size,
      hitRate: totalHits > 0 ? (totalHits / (totalHits + 100)) * 100 : 0,
      totalHits,
      totalMisses: 100
    }
  }

  private calculatePriority(key: string): number {
    const accessHistory = this.accessPatterns.get(key) || []
    const recency = accessHistory.length > 0 ? (Date.now() - accessHistory[accessHistory.length - 1]) : 0
    const frequency = accessHistory.length

    return frequency / (recency + 1)
  }

  private recordAccess(key: string): void {
    const history = this.accessPatterns.get(key) || []
    history.push(Date.now())

    // Keep only recent access history
    if (history.length > 10) {
      history.splice(0, history.length - 10)
    }

    this.accessPatterns.set(key, history)
  }

  private evictLeastImportant(): void {
    let leastImportantKey = ''
    let lowestScore = Infinity

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const score = entry.priority * entry.hits / (Date.now() - entry.lastAccessed + 1)
      if (score < lowestScore) {
        lowestScore = score
        leastImportantKey = key
      }
    }

    if (leastImportantKey) {
      this.delete(leastImportantKey)
      analytics.trackPerformance('cache_eviction', 1)
    }
  }

  private startCleanupRoutine(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of Array.from(this.cache.entries())) {
        if (now > entry.expiry) {
          this.delete(key)
        }
      }
    }, 60000) // Clean up every minute
  }

  private startOptimizationRoutine(): void {
    setInterval(() => {
      this.optimizeCache()
      this.predictivePreload()
    }, 300000) // Optimize every 5 minutes
  }

  private optimizeCache(): void {
    const entries = Array.from(this.cache.entries())

    // Boost priority of frequently accessed items
    for (const [key, entry] of entries) {
      if (entry.hits > 10) {
        entry.priority *= 1.1
      }
    }

    analytics.trackPerformance('cache_optimization', entries.length)
  }

  private predictivePreload(): void {
    // Analyze access patterns and preload likely needed data
    for (const [key, accessTimes] of Array.from(this.accessPatterns.entries())) {
      if (accessTimes.length > 3 && this.predictNextAccess(accessTimes)) {
        this.preloadQueue.add(key)
      }
    }

    analytics.trackPerformance('predictive_preload', this.preloadQueue.size)
  }

  private predictNextAccess(accessTimes: number[]): boolean {
    if (accessTimes.length < 2) return false

    const intervals = []
    for (let i = 1; i < accessTimes.length; i++) {
      intervals.push(accessTimes[i] - accessTimes[i - 1])
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    const lastAccess = accessTimes[accessTimes.length - 1]

    return Date.now() - lastAccess > avgInterval * 0.8
  }
}

// Performance Monitor
class EnterprisePerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private observers = new Set<PerformanceObserver>()
  private startTime = Date.now()

  constructor() {
    this.setupPerformanceObservers()
    this.startMetricsCollection()
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined') return

    try {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMetric('page_load', navEntry.loadEventEnd - navEntry.startTime)
            this.recordMetric('dom_ready', navEntry.domContentLoadedEventEnd - navEntry.startTime)
            this.recordMetric('first_byte', navEntry.responseStart - navEntry.startTime)
          }
        }
      })

      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.add(navObserver)

      // Paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(`paint_${entry.name}`, entry.startTime)
          analytics.trackPerformance(entry.name, entry.startTime)
        }
      })

      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.add(paintObserver)

      // Layout shifts
      const layoutObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const lsEntry = entry as any
          if (lsEntry.value) {
            this.recordMetric('layout_shift', lsEntry.value)
            analytics.trackPerformance('layout_shift', lsEntry.value)
          }
        }
      })

      layoutObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.add(layoutObserver)

      // Long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('long_task', entry.duration)
          analytics.trackPerformance('long_task', entry.duration)
        }
      })

      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.add(longTaskObserver)

    } catch (error) {
      console.warn('Performance Observer setup failed:', error)
    }
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only recent values
    if (values.length > 100) {
      values.splice(0, values.length - 100)
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectRuntimeMetrics()
    }, 30000) // Collect every 30 seconds
  }

  private collectRuntimeMetrics(): void {
    if (typeof window === 'undefined') return

    // Memory metrics
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.recordMetric('memory_used', memory.usedJSHeapSize)
      this.recordMetric('memory_total', memory.totalJSHeapSize)
      analytics.trackPerformance('memory_usage', memory.usedJSHeapSize)
    }

    // Connection metrics
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.recordMetric('network_speed', this.getNetworkSpeed(connection.effectiveType))
      analytics.trackPerformance('network_speed', this.getNetworkSpeed(connection.effectiveType))
    }
  }

  private getNetworkSpeed(effectiveType: string): number {
    const speeds: Record<string, number> = {
      'slow-2g': 1,
      '2g': 2,
      '3g': 3,
      '4g': 4
    }
    return speeds[effectiveType] || 3
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {}

    for (const [name, values] of Array.from(this.metrics.entries())) {
      if (values.length > 0) {
        const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length
        const min = Math.min(...values)
        const max = Math.max(...values)

        result[name] = { avg, min, max, count: values.length }
      }
    }

    return result
  }

  destroy(): void {
    for (const observer of Array.from(this.observers)) {
      observer.disconnect()
    }
    this.observers.clear()
    this.metrics.clear()
  }
}

// Main Performance Optimizer
class EnterprisePerformanceOptimizer {
  private intelligentCache = new EnterpriseIntelligentCache()
  private monitor = new EnterprisePerformanceMonitor()
  private config: OptimizationConfig

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      maxCacheSize: 1000,
      cacheExpiry: 3600000,
      preloadThreshold: 0.8,
      compressionLevel: 6,
      enableBatching: true,
      enablePreloading: true,
      enableCompression: true,
      ...config
    }
  }

  // Caching methods
  cacheSet<T>(key: string, value: T, expiry?: number): void {
    this.intelligentCache.set(key, value, expiry)
  }

  cacheGet<T>(key: string): T | null {
    return this.intelligentCache.get(key)
  }

  cacheHas(key: string): boolean {
    return this.intelligentCache.has(key)
  }

  // Performance measurement
  measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      analytics.trackPerformance(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      analytics.trackPerformance(`${name}_error`, duration)
      throw error
    }
  }

  // Async performance measurement
  async measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      analytics.trackPerformance(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      analytics.trackPerformance(`${name}_error`, duration)
      throw error
    }
  }

  // Resource optimization
  optimizeImage(src: string, options: { width?: number; height?: number; quality?: number } = {}): string {
    const { width, height, quality = 85 } = options
    const params = new URLSearchParams()

    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    params.set('q', quality.toString())
    params.set('f', 'webp')

    return `/api/image?${params.toString()}&src=${encodeURIComponent(src)}`
  }

  // Batch operations
  batch<T>(operations: Array<() => Promise<T>>, batchSize: number = 5): Promise<T[]> {
    if (!this.config.enableBatching) {
      return Promise.all(operations.map(op => op()))
    }

    const batches: Array<Array<() => Promise<T>>> = []
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize))
    }

    return batches.reduce(async (acc, batch) => {
      const results = await acc
      const batchResults = await Promise.all(batch.map(op => op()))
      return [...results, ...batchResults]
    }, Promise.resolve([] as T[]))
  }

  // Resource preloading
  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'fetch' = 'fetch'): void {
    if (!this.config.enablePreloading || typeof document === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url

    switch (type) {
      case 'script':
        link.as = 'script'
        break
      case 'style':
        link.as = 'style'
        break
      case 'image':
        link.as = 'image'
        break
      case 'fetch':
        link.as = 'fetch'
        link.crossOrigin = 'anonymous'
        break
    }

    document.head.appendChild(link)
    analytics.trackPerformance('resource_preload', 1)
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics {
    const monitorMetrics = this.monitor.getMetrics()
    const cacheStats = this.intelligentCache.getStats()

    return {
      loadTime: monitorMetrics.page_load?.avg || 0,
      renderTime: monitorMetrics.paint_first_contentful_paint?.avg || 0,
      interactionTime: monitorMetrics.first_input_delay?.avg || 0,
      memoryUsage: monitorMetrics.memory_used?.avg || 0,
      cacheHitRate: cacheStats.hitRate
    }
  }

  // Get cache statistics
  getCacheStats() {
    return this.intelligentCache.getStats()
  }

  // Cleanup
  destroy(): void {
    this.monitor.destroy()
    this.intelligentCache.clear()
  }
}

// Global instance
export const performanceOptimizer = new EnterprisePerformanceOptimizer()

// React hooks
export function usePerformanceOptimizer() {
  return {
    cache: {
      set: performanceOptimizer.cacheSet.bind(performanceOptimizer),
      get: performanceOptimizer.cacheGet.bind(performanceOptimizer),
      has: performanceOptimizer.cacheHas.bind(performanceOptimizer)
    },
    measure: performanceOptimizer.measurePerformance.bind(performanceOptimizer),
    measureAsync: performanceOptimizer.measureAsyncPerformance.bind(performanceOptimizer),
    optimizeImage: performanceOptimizer.optimizeImage.bind(performanceOptimizer),
    batch: performanceOptimizer.batch.bind(performanceOptimizer),
    preload: performanceOptimizer.preloadResource.bind(performanceOptimizer),
    getMetrics: performanceOptimizer.getMetrics.bind(performanceOptimizer),
    getCacheStats: performanceOptimizer.getCacheStats.bind(performanceOptimizer)
  }
}

export type { PerformanceMetrics, OptimizationConfig, CacheEntry }
export { EnterprisePerformanceOptimizer, EnterpriseIntelligentCache, EnterprisePerformanceMonitor }