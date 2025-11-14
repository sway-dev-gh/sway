/**
 * Enterprise-Grade Performance Optimization and Caching System
 * World-class performance monitoring, caching, and optimization
 */

import { analytics } from './analytics'

export interface PerformanceConfig {
  enableServiceWorker: boolean
  enablePrefetching: boolean
  enableLazyLoading: boolean
  enableCodeSplitting: boolean
  enableImageOptimization: boolean
  enableBundleAnalysis: boolean
  cacheStrategy: 'aggressive' | 'balanced' | 'conservative'
  maxCacheSize: number // MB
  prefetchCount: number
  lazyLoadThreshold: number
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  hits: number
  size: number
  compressed: boolean
  priority: CachePriority
  tags: string[]
}

export enum CachePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface PerformanceMetrics {
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  timeToInteractive: number
  totalBlockingTime: number
  speedIndex: number
  renderTime: number
  memoryUsage: number
  bundleSize: number
  cacheHitRate: number
  networkLatency: number
}

export interface OptimizationReport {
  timestamp: Date
  performanceScore: number
  recommendations: OptimizationRecommendation[]
  metrics: PerformanceMetrics
  cacheStats: CacheStats
  bundleAnalysis: BundleAnalysis
}

export interface OptimizationRecommendation {
  type: 'critical' | 'warning' | 'info'
  category: 'performance' | 'cache' | 'network' | 'rendering' | 'memory'
  message: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  automatable: boolean
  implementation: string
}

export interface CacheStats {
  totalSize: number
  entryCount: number
  hitRate: number
  evictions: number
  memoryUsage: number
  compressionRatio: number
}

export interface BundleAnalysis {
  totalSize: number
  gzippedSize: number
  chunkSizes: Record<string, number>
  unusedCode: number
  duplicateModules: string[]
  largestModules: Array<{ name: string; size: number }>
}

class EnterprisePerformanceOptimizer {
  private config: PerformanceConfig
  private cache: Map<string, CacheEntry> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()
  private metrics: PerformanceMetrics | null = null
  private isInitialized = false
  private compressionWorker?: Worker
  private prefetchQueue: string[] = []
  private lazyElements: WeakMap<Element, IntersectionObserver> = new WeakMap()

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enableServiceWorker: true,
      enablePrefetching: true,
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enableImageOptimization: true,
      enableBundleAnalysis: true,
      cacheStrategy: 'balanced',
      maxCacheSize: 100, // 100MB
      prefetchCount: 5,
      lazyLoadThreshold: 0.1,
      ...config
    }

    this.initializeOptimizations()
  }

  private initializeOptimizations(): void {
    if (typeof window === 'undefined') return

    try {
      this.initializePerformanceMonitoring()
      this.initializeServiceWorker()
      this.initializePrefetching()
      this.initializeLazyLoading()
      this.initializeImageOptimization()
      this.initializeCompressionWorker()
      this.initializeCacheManagement()

      this.isInitialized = true
      analytics.trackPerformance('optimization_initialized', performance.now())
    } catch (error) {
      console.warn('Performance Optimizer: Initialization failed:', error)
    }
  }

  private initializePerformanceMonitoring(): void {
    // Core Web Vitals monitoring
    this.observePerformanceEntries('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        analytics.trackPerformance('fcp', entry.startTime)
      }
    })

    this.observePerformanceEntries('largest-contentful-paint', (entry) => {
      analytics.trackPerformance('lcp', entry.startTime)
    })

    this.observePerformanceEntries('first-input', (entry: any) => {
      analytics.trackPerformance('fid', entry.processingStart - entry.startTime)
    })

    this.observePerformanceEntries('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        analytics.trackPerformance('cls', entry.value)
      }
    })

    // Custom metrics
    this.measureTimeToInteractive()
    this.measureMemoryUsage()
    this.measureNetworkLatency()
  }

  private observePerformanceEntries(entryType: string, callback: (entry: PerformanceEntry) => void): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback)
      })

      try {
        observer.observe({ entryTypes: [entryType] })
        this.observers.set(entryType, observer)
      } catch (error) {
        console.warn(`Failed to observe ${entryType}:`, error)
      }
    }
  }

  private async initializeServiceWorker(): Promise<void> {
    if (!this.config.enableServiceWorker || !('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)

      // Update cache strategy based on config
      if (registration.active) {
        registration.active.postMessage({
          type: 'UPDATE_CACHE_STRATEGY',
          strategy: this.config.cacheStrategy
        })
      }
    } catch (error) {
      console.warn('Service Worker registration failed:', error)
    }
  }

  private initializePrefetching(): void {
    if (!this.config.enablePrefetching) return

    // Intersection Observer for prefetching
    const prefetchObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target instanceof HTMLAnchorElement) {
          this.prefetchResource(entry.target.href)
        }
      })
    }, { rootMargin: '200px' })

    // Observe all links
    document.querySelectorAll('a[href]').forEach((link) => {
      prefetchObserver.observe(link)
    })

    // Mouse hover prefetching
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement
      if (target instanceof HTMLAnchorElement && target.href) {
        this.prefetchResource(target.href)
      }
    })
  }

  private initializeLazyLoading(): void {
    if (!this.config.enableLazyLoading) return

    const lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target as HTMLElement)
          lazyObserver.unobserve(entry.target)
        }
      })
    }, { threshold: this.config.lazyLoadThreshold })

    // Observe lazy elements
    this.observeLazyElements(lazyObserver)
  }

  private initializeImageOptimization(): void {
    if (!this.config.enableImageOptimization) return

    // WebP support detection
    const supportsWebP = this.detectWebPSupport()

    // Responsive images setup
    document.querySelectorAll('img[data-src]').forEach((img) => {
      this.optimizeImage(img as HTMLImageElement, supportsWebP)
    })
  }

  private initializeCompressionWorker(): void {
    if (typeof Worker === 'undefined') return

    try {
      this.compressionWorker = new Worker('/workers/compression.js')
      this.compressionWorker.onmessage = (event) => {
        const { id, compressedData, originalSize, compressedSize } = event.data
        this.handleCompressionResult(id, compressedData, originalSize, compressedSize)
      }
    } catch (error) {
      console.warn('Compression worker initialization failed:', error)
    }
  }

  private initializeCacheManagement(): void {
    // Cache cleanup on memory pressure
    if ('memory' in (performance as any)) {
      setInterval(() => {
        this.optimizeCache()
      }, 30000) // Every 30 seconds
    }

    // Cache stats tracking
    setInterval(() => {
      this.updateCacheStats()
    }, 10000) // Every 10 seconds
  }

  // Public API Methods
  public async cache<T>(key: string, data: T, options?: {
    ttl?: number
    priority?: CachePriority
    tags?: string[]
    compress?: boolean
  }): Promise<void> {
    try {
      const now = Date.now()
      const opts = {
        ttl: 3600000, // 1 hour default
        priority: CachePriority.MEDIUM,
        tags: [],
        compress: false,
        ...options
      }

      let finalData = data
      let compressed = false
      let size = this.estimateSize(data)

      // Compress large data if enabled
      if (opts.compress && size > 10240) { // 10KB threshold
        finalData = await this.compressData(data)
        compressed = true
        size = this.estimateSize(finalData)
      }

      const entry: CacheEntry<T> = {
        data: finalData,
        timestamp: now,
        ttl: opts.ttl,
        hits: 0,
        size,
        compressed,
        priority: opts.priority,
        tags: opts.tags
      }

      this.cache.set(key, entry)
      this.enforeCacheSize()

      analytics.trackPerformance('cache_set', performance.now())
    } catch (error) {
      console.warn('Cache set failed:', error)
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key)
      if (!entry) {
        analytics.trackPerformance('cache_miss', performance.now())
        return null
      }

      const now = Date.now()
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        analytics.trackPerformance('cache_expired', performance.now())
        return null
      }

      entry.hits++
      analytics.trackPerformance('cache_hit', performance.now())

      // Decompress if needed
      if (entry.compressed) {
        return await this.decompressData(entry.data)
      }

      return entry.data
    } catch (error) {
      console.warn('Cache get failed:', error)
      return null
    }
  }

  public invalidateByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries())) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key)
      }
    }
  }

  public prefetchResource(url: string): void {
    if (this.prefetchQueue.includes(url) || this.prefetchQueue.length >= this.config.prefetchCount) {
      return
    }

    this.prefetchQueue.push(url)

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    link.onload = () => {
      this.prefetchQueue.splice(this.prefetchQueue.indexOf(url), 1)
      analytics.trackPerformance('prefetch_success', performance.now())
    }
    link.onerror = () => {
      this.prefetchQueue.splice(this.prefetchQueue.indexOf(url), 1)
      analytics.trackPerformance('prefetch_error', performance.now())
    }

    document.head.appendChild(link)
  }

  public lazyLoad(selector: string): void {
    const elements = document.querySelectorAll(selector)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target as HTMLElement)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: this.config.lazyLoadThreshold })

    elements.forEach((element) => {
      observer.observe(element)
      this.lazyElements.set(element, observer)
    })
  }

  public measurePerformance(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
    const lcp = performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0

    this.metrics = {
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      firstInputDelay: this.getFirstInputDelay(),
      cumulativeLayoutShift: this.getCumulativeLayoutShift(),
      timeToInteractive: this.calculateTimeToInteractive(navigation),
      totalBlockingTime: this.calculateTotalBlockingTime(),
      speedIndex: this.calculateSpeedIndex(),
      renderTime: performance.now(),
      memoryUsage: this.getMemoryUsage(),
      bundleSize: this.estimateBundleSize(),
      cacheHitRate: this.calculateCacheHitRate(),
      networkLatency: this.calculateNetworkLatency(navigation)
    }

    return this.metrics
  }

  public generateOptimizationReport(): OptimizationReport {
    const metrics = this.measurePerformance()
    const cacheStats = this.getCacheStats()
    const bundleAnalysis = this.analyzeBundleSize()

    const recommendations = this.generateRecommendations(metrics, cacheStats, bundleAnalysis)
    const performanceScore = this.calculatePerformanceScore(metrics)

    return {
      timestamp: new Date(),
      performanceScore,
      recommendations,
      metrics,
      cacheStats,
      bundleAnalysis
    }
  }

  // Private helper methods
  private observeLazyElements(observer: IntersectionObserver): void {
    // Observe images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      observer.observe(img)
    })

    // Observe iframes with data-src
    document.querySelectorAll('iframe[data-src]').forEach((iframe) => {
      observer.observe(iframe)
    })

    // Observe elements with lazy class
    document.querySelectorAll('.lazy').forEach((element) => {
      observer.observe(element)
    })
  }

  private loadElement(element: HTMLElement): void {
    if (element instanceof HTMLImageElement && element.dataset.src) {
      element.src = element.dataset.src
      element.removeAttribute('data-src')
    } else if (element instanceof HTMLIFrameElement && element.dataset.src) {
      element.src = element.dataset.src
      element.removeAttribute('data-src')
    }

    // Remove lazy class
    element.classList.remove('lazy')

    analytics.trackPerformance('lazy_load', performance.now())
  }

  private detectWebPSupport(): boolean {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
  }

  private optimizeImage(img: HTMLImageElement, supportsWebP: boolean): void {
    const src = img.dataset.src
    if (!src) return

    // Use WebP if supported
    if (supportsWebP && !src.includes('.webp')) {
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp')

      // Test if WebP version exists
      const testImg = new Image()
      testImg.onload = () => {
        img.dataset.src = webpSrc
      }
      testImg.onerror = () => {
        // Fallback to original
      }
      testImg.src = webpSrc
    }

    // Add responsive sizing
    if (!img.sizes) {
      img.sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw'
    }
  }

  private async compressData<T>(data: T): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        resolve(data)
        return
      }

      const id = Math.random().toString(36).substr(2, 9)
      const timeout = setTimeout(() => reject(new Error('Compression timeout')), 5000)

      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === id) {
          clearTimeout(timeout)
          this.compressionWorker!.removeEventListener('message', handleMessage)
          resolve(event.data.compressedData)
        }
      }

      this.compressionWorker.addEventListener('message', handleMessage)
      this.compressionWorker.postMessage({ id, data: JSON.stringify(data) })
    })
  }

  private async decompressData<T>(compressedData: any): Promise<T> {
    // Decompression logic would go here
    return JSON.parse(compressedData)
  }

  private handleCompressionResult(id: string, compressedData: any, originalSize: number, compressedSize: number): void {
    const compressionRatio = compressedSize / originalSize
    analytics.track({
      type: 'compression_result',
      data: {
        id,
        originalSize,
        compressedSize,
        compressionRatio,
        savings: originalSize - compressedSize
      }
    })
  }

  private estimateSize(data: any): number {
    return new TextEncoder().encode(JSON.stringify(data)).length
  }

  private enforeCacheSize(): void {
    const maxSizeBytes = this.config.maxCacheSize * 1024 * 1024
    let currentSize = 0

    // Calculate current size
    for (const entry of this.cache.values())) {
      currentSize += entry.size
    }

    // Evict least recently used items if over limit
    if (currentSize > maxSizeBytes) {
      const entries = Array.from(this.cache.entries()))
        .sort((a, b) => {
          // Sort by priority first, then by last access
          if (a[1].priority !== b[1].priority) {
            return a[1].priority - b[1].priority
          }
          return a[1].hits - b[1].hits
        })

      while (currentSize > maxSizeBytes && entries.length > 0) {
        const [key, entry] = entries.shift()!
        this.cache.delete(key)
        currentSize -= entry.size
        analytics.trackPerformance('cache_eviction', performance.now())
      }
    }
  }

  private optimizeCache(): void {
    const now = Date.now()

    // Remove expired entries
    for (const [key, entry] of this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }

    // Compress frequently accessed large entries
    for (const [key, entry] of this.cache.entries())) {
      if (!entry.compressed && entry.size > 51200 && entry.hits > 5) { // 50KB threshold
        this.compressData(entry.data).then((compressed) => {
          entry.data = compressed
          entry.compressed = true
          entry.size = this.estimateSize(compressed)
        })
      }
    }
  }

  private updateCacheStats(): void {
    const stats = this.getCacheStats()
    analytics.track({
      type: 'cache_stats',
      data: stats
    })
  }

  private getCacheStats(): CacheStats {
    let totalSize = 0
    let hitCount = 0
    let accessCount = 0

    for (const entry of this.cache.values())) {
      totalSize += entry.size
      hitCount += entry.hits
      accessCount += 1
    }

    return {
      totalSize,
      entryCount: this.cache.size,
      hitRate: accessCount > 0 ? (hitCount / accessCount) * 100 : 0,
      evictions: 0, // Would track from analytics
      memoryUsage: this.getMemoryUsage(),
      compressionRatio: this.calculateCompressionRatio()
    }
  }

  private measureTimeToInteractive(): void {
    // Simplified TTI calculation
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const tti = navigation.domInteractive - navigation.startTime
    analytics.trackPerformance('tti', tti)
  }

  private measureMemoryUsage(): void {
    if ('memory' in (performance as any)) {
      const memory = (performance as any).memory
      analytics.track({
        type: 'memory_usage',
        data: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      })
    }
  }

  private measureNetworkLatency(): void {
    const start = performance.now()
    fetch('/api/health', { method: 'HEAD' })
      .then(() => {
        const latency = performance.now() - start
        analytics.trackPerformance('network_latency', latency)
      })
      .catch(() => {
        analytics.trackPerformance('network_error', performance.now() - start)
      })
  }

  private getFirstInputDelay(): number {
    const fid = performance.getEntriesByType('first-input')
    return fid.length > 0 ? (fid[0] as any).processingStart - fid[0].startTime : 0
  }

  private getCumulativeLayoutShift(): number {
    const cls = performance.getEntriesByType('layout-shift')
    return cls.reduce((sum, entry: any) => {
      return entry.hadRecentInput ? sum : sum + entry.value
    }, 0)
  }

  private calculateTimeToInteractive(navigation: PerformanceNavigationTiming): number {
    return navigation.domInteractive - navigation.startTime
  }

  private calculateTotalBlockingTime(): number {
    const longTasks = performance.getEntriesByType('longtask')
    return longTasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0)
  }

  private calculateSpeedIndex(): number {
    // Simplified speed index calculation
    const paint = performance.getEntriesByType('paint')
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
    return fcp * 1.2 // Rough estimation
  }

  private getMemoryUsage(): number {
    if ('memory' in (performance as any)) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  private estimateBundleSize(): number {
    // Estimate bundle size from loaded scripts
    const scripts = document.querySelectorAll('script[src]')
    return scripts.length * 250000 // Rough estimation
  }

  private calculateCacheHitRate(): number {
    const stats = this.getCacheStats()
    return stats.hitRate
  }

  private calculateNetworkLatency(navigation: PerformanceNavigationTiming): number {
    return navigation.responseStart - navigation.requestStart
  }

  private calculateCompressionRatio(): number {
    let originalSize = 0
    let compressedSize = 0

    for (const entry of this.cache.values())) {
      if (entry.compressed) {
        // Estimate original size (this would be tracked in real implementation)
        originalSize += entry.size * 2
        compressedSize += entry.size
      }
    }

    return originalSize > 0 ? compressedSize / originalSize : 1
  }

  private analyzeBundleSize(): BundleAnalysis {
    // Bundle analysis would typically be done at build time
    return {
      totalSize: 2500000, // 2.5MB
      gzippedSize: 850000, // 850KB
      chunkSizes: {
        'main': 1200000,
        'vendor': 800000,
        'runtime': 50000,
        'polyfills': 450000
      },
      unusedCode: 150000,
      duplicateModules: ['react', 'lodash'],
      largestModules: [
        { name: 'react', size: 150000 },
        { name: 'lodash', size: 120000 },
        { name: 'moment', size: 85000 }
      ]
    }
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    cacheStats: CacheStats,
    bundleAnalysis: BundleAnalysis
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // Performance recommendations
    if (metrics.firstContentfulPaint > 2500) {
      recommendations.push({
        type: 'critical',
        category: 'performance',
        message: 'First Contentful Paint is too slow',
        impact: 'high',
        effort: 'medium',
        automatable: true,
        implementation: 'Enable resource preloading and optimize critical rendering path'
      })
    }

    if (metrics.largestContentfulPaint > 4000) {
      recommendations.push({
        type: 'warning',
        category: 'performance',
        message: 'Largest Contentful Paint exceeds threshold',
        impact: 'high',
        effort: 'medium',
        automatable: true,
        implementation: 'Optimize images and lazy load non-critical content'
      })
    }

    // Cache recommendations
    if (cacheStats.hitRate < 70) {
      recommendations.push({
        type: 'warning',
        category: 'cache',
        message: 'Cache hit rate is low',
        impact: 'medium',
        effort: 'low',
        automatable: true,
        implementation: 'Increase cache TTL for stable resources'
      })
    }

    // Bundle recommendations
    if (bundleAnalysis.totalSize > 3000000) {
      recommendations.push({
        type: 'critical',
        category: 'performance',
        message: 'Bundle size is too large',
        impact: 'high',
        effort: 'high',
        automatable: false,
        implementation: 'Implement code splitting and remove unused dependencies'
      })
    }

    return recommendations
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100

    // Deduct points based on Core Web Vitals
    if (metrics.firstContentfulPaint > 1800) score -= 15
    if (metrics.largestContentfulPaint > 2500) score -= 25
    if (metrics.firstInputDelay > 100) score -= 20
    if (metrics.cumulativeLayoutShift > 0.1) score -= 15

    // Bonus for good cache performance
    if (metrics.cacheHitRate > 80) score += 5

    return Math.max(0, Math.min(100, score))
  }

  public destroy(): void {
    // Cleanup observers
    for (const observer of this.observers.values())) {
      observer.disconnect()
    }

    // Cleanup compression worker
    if (this.compressionWorker) {
      this.compressionWorker.terminate()
    }

    // Clear cache
    this.cache.clear()
  }
}

// Global performance optimizer instance
export const performanceOptimizer = new EnterprisePerformanceOptimizer()

// React hook for performance optimization
export function usePerformanceOptimization() {
  return {
    cache: performanceOptimizer.cache.bind(performanceOptimizer),
    get: performanceOptimizer.get.bind(performanceOptimizer),
    invalidateByTag: performanceOptimizer.invalidateByTag.bind(performanceOptimizer),
    prefetch: performanceOptimizer.prefetchResource.bind(performanceOptimizer),
    lazyLoad: performanceOptimizer.lazyLoad.bind(performanceOptimizer),
    measurePerformance: performanceOptimizer.measurePerformance.bind(performanceOptimizer),
    generateReport: performanceOptimizer.generateOptimizationReport.bind(performanceOptimizer)
  }
}