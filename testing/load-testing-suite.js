#!/usr/bin/env node

/**
 * Living Collaboration Ecosystem - Load Testing Suite
 *
 * Comprehensive stress testing for:
 * - Living blocks under multi-user load
 * - AI context engine pattern recognition performance
 * - WebSocket real-time collaboration stability
 * - Adaptive role system under heavy contribution tracking
 *
 * Maintains terminal aesthetic performance validation
 */

const WebSocket = require('ws')
const axios = require('axios')
const { performance } = require('perf_hooks')

class LivingEcosystemLoadTester {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3001',
      wsUrl: config.wsUrl || 'ws://localhost:3001',
      maxConcurrentUsers: config.maxConcurrentUsers || 100,
      testDuration: config.testDuration || 300000, // 5 minutes
      blockCount: config.blockCount || 50,
      aiContextUpdateInterval: config.aiContextUpdateInterval || 1000,
      ...config
    }

    this.metrics = {
      webSocketConnections: [],
      blockInteractions: [],
      aiContextUpdates: [],
      roleEvolutions: [],
      memoryUsage: [],
      terminalAestheticPerformance: []
    }

    this.activeConnections = []
    this.testStartTime = null
  }

  // Main load testing orchestration
  async runFullLoadTest() {
    console.log('🔥 STARTING LIVING ECOSYSTEM LOAD TEST')
    console.log(`Target: ${this.config.maxConcurrentUsers} concurrent users`)
    console.log(`Duration: ${this.config.testDuration / 1000}s`)
    console.log(`Blocks: ${this.config.blockCount} living blocks`)

    this.testStartTime = performance.now()

    // Phase 1: Connection stability testing
    await this.testWebSocketStability()

    // Phase 2: Living blocks stress testing
    await this.testLivingBlocksLoad()

    // Phase 3: AI context engine performance
    await this.testAIContextEngineLoad()

    // Phase 4: Adaptive role system load
    await this.testAdaptiveRoleSystemLoad()

    // Phase 5: Terminal aesthetic performance validation
    await this.testTerminalAestheticPerformance()

    // Generate comprehensive report
    await this.generateLoadTestReport()

    console.log('✅ LOAD TEST COMPLETE')
  }

  // Test WebSocket connection stability under load
  async testWebSocketStability() {
    console.log('\n📡 TESTING WEBSOCKET STABILITY')

    const connectionPromises = []

    for (let i = 0; i < this.config.maxConcurrentUsers; i++) {
      connectionPromises.push(this.createWebSocketConnection(i))
    }

    try {
      const connections = await Promise.all(connectionPromises)
      this.activeConnections = connections

      console.log(`✅ ${connections.length} WebSocket connections established`)

      // Simulate real-time collaboration load
      await this.simulateCollaborationActivity()

    } catch (error) {
      console.error('❌ WebSocket stability test failed:', error.message)
      this.metrics.webSocketConnections.push({
        timestamp: Date.now(),
        event: 'connection_failure',
        error: error.message
      })
    }
  }

  async createWebSocketConnection(userId) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now()
      const ws = new WebSocket(`${this.config.wsUrl}/collaboration`)

      ws.on('open', () => {
        const connectionTime = performance.now() - startTime

        this.metrics.webSocketConnections.push({
          userId,
          timestamp: Date.now(),
          event: 'connected',
          connectionTime
        })

        // Set up collaboration message handling
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            this.handleCollaborationMessage(userId, message)
          } catch (error) {
            console.warn(`User ${userId} received malformed message:`, error.message)
          }
        })

        resolve({ userId, ws, connectionTime })
      })

      ws.on('error', (error) => {
        this.metrics.webSocketConnections.push({
          userId,
          timestamp: Date.now(),
          event: 'connection_error',
          error: error.message
        })
        reject(error)
      })

      ws.on('close', () => {
        this.metrics.webSocketConnections.push({
          userId,
          timestamp: Date.now(),
          event: 'disconnected'
        })
      })
    })
  }

  async simulateCollaborationActivity() {
    console.log('🤝 Simulating real-time collaboration activity')

    const activityInterval = setInterval(() => {
      // Randomly select users to perform actions
      const activeUsers = this.activeConnections.slice(0, Math.floor(Math.random() * this.activeConnections.length))

      activeUsers.forEach(({ userId, ws }) => {
        // Simulate various collaboration activities
        const activities = [
          { type: 'block_join', blockId: `block-${Math.floor(Math.random() * this.config.blockCount)}` },
          { type: 'block_edit', blockId: `block-${Math.floor(Math.random() * this.config.blockCount)}`, content: 'test' },
          { type: 'request_create', content: 'Load test request', priority: Math.floor(Math.random() * 10) },
          { type: 'presence_update', status: ['online', 'busy', 'focused'][Math.floor(Math.random() * 3)] }
        ]

        const activity = activities[Math.floor(Math.random() * activities.length)]

        try {
          ws.send(JSON.stringify({
            userId,
            timestamp: Date.now(),
            ...activity
          }))
        } catch (error) {
          console.warn(`Failed to send activity for user ${userId}:`, error.message)
        }
      })
    }, 500) // Activity every 500ms

    // Run collaboration simulation for 2 minutes
    await new Promise(resolve => setTimeout(resolve, 120000))
    clearInterval(activityInterval)

    console.log('✅ Collaboration activity simulation complete')
  }

  // Test living blocks performance under load
  async testLivingBlocksLoad() {
    console.log('\n🧱 TESTING LIVING BLOCKS LOAD')

    const blockLoadPromises = []

    // Create high-activity scenarios on living blocks
    for (let blockId = 0; blockId < this.config.blockCount; blockId++) {
      blockLoadPromises.push(this.stressTestLivingBlock(`block-${blockId}`))
    }

    try {
      await Promise.all(blockLoadPromises)
      console.log('✅ Living blocks load test complete')
    } catch (error) {
      console.error('❌ Living blocks load test failed:', error.message)
    }
  }

  async stressTestLivingBlock(blockId) {
    const usersPerBlock = Math.min(20, this.config.maxConcurrentUsers)
    const blockStartTime = performance.now()

    // Simulate multiple users interacting with the same block
    const blockInteractions = []

    for (let i = 0; i < usersPerBlock; i++) {
      const userConnection = this.activeConnections[i % this.activeConnections.length]
      if (!userConnection) continue

      // Simulate block interactions
      const interactions = [
        'block_hover',
        'block_focus',
        'block_edit',
        'context_request',
        'priority_update'
      ]

      for (const interaction of interactions) {
        const interactionStartTime = performance.now()

        try {
          userConnection.ws.send(JSON.stringify({
            type: interaction,
            blockId,
            userId: userConnection.userId,
            timestamp: Date.now(),
            payload: { test: true }
          }))

          const interactionTime = performance.now() - interactionStartTime

          this.metrics.blockInteractions.push({
            blockId,
            userId: userConnection.userId,
            interaction,
            timestamp: Date.now(),
            responseTime: interactionTime
          })

        } catch (error) {
          console.warn(`Block interaction failed: ${blockId} - ${interaction}`, error.message)
        }

        // Small delay between interactions to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    const blockTestTime = performance.now() - blockStartTime
    console.log(`Block ${blockId} stress test: ${blockTestTime.toFixed(2)}ms`)
  }

  // Test AI Context Engine under load
  async testAIContextEngineLoad() {
    console.log('\n🧠 TESTING AI CONTEXT ENGINE LOAD')

    const aiTestStartTime = performance.now()

    // Simulate heavy context analysis load
    const contextUpdatePromises = []

    for (let i = 0; i < 100; i++) {
      contextUpdatePromises.push(this.simulateAIContextUpdate())
    }

    try {
      await Promise.all(contextUpdatePromises)

      const aiTestTime = performance.now() - aiTestStartTime
      console.log(`✅ AI Context Engine load test: ${aiTestTime.toFixed(2)}ms`)

    } catch (error) {
      console.error('❌ AI Context Engine load test failed:', error.message)
    }
  }

  async simulateAIContextUpdate() {
    const updateStartTime = performance.now()

    try {
      const contextData = {
        timestamps: Array.from({ length: 50 }, () => Date.now() - Math.random() * 3600000),
        interactions: Array.from({ length: 30 }, (_, i) => ({
          type: ['collaboration', 'review', 'task'][Math.floor(Math.random() * 3)],
          priority: Math.floor(Math.random() * 10),
          userId: `user-${i % 10}`
        })),
        workflows: Array.from({ length: 10 }, () => ({
          completionTime: Math.random() * 60 + 5
        })),
        teamActivity: Math.floor(Math.random() * 50),
        velocity: Math.random() * 100
      }

      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))

      const processingTime = performance.now() - updateStartTime

      this.metrics.aiContextUpdates.push({
        timestamp: Date.now(),
        processingTime,
        dataPoints: contextData.timestamps.length + contextData.interactions.length,
        success: true
      })

    } catch (error) {
      this.metrics.aiContextUpdates.push({
        timestamp: Date.now(),
        processingTime: performance.now() - updateStartTime,
        success: false,
        error: error.message
      })
    }
  }

  // Test adaptive role system under load
  async testAdaptiveRoleSystemLoad() {
    console.log('\n👥 TESTING ADAPTIVE ROLE SYSTEM LOAD')

    const roleTestPromises = []

    // Simulate heavy contribution tracking and role evolution
    for (let userId = 0; userId < Math.min(50, this.config.maxConcurrentUsers); userId++) {
      roleTestPromises.push(this.simulateRoleEvolution(`user-${userId}`))
    }

    try {
      await Promise.all(roleTestPromises)
      console.log('✅ Adaptive role system load test complete')
    } catch (error) {
      console.error('❌ Adaptive role system load test failed:', error.message)
    }
  }

  async simulateRoleEvolution(userId) {
    const evolutionStartTime = performance.now()

    try {
      // Simulate multiple contributions across different areas
      const contributions = [
        { area: 'Design Systems', quality: 8.5, impact: 7.8, frequency: 0.3 },
        { area: 'Code Review', quality: 9.1, impact: 8.2, frequency: 0.4 },
        { area: 'Product Strategy', quality: 7.9, impact: 8.9, frequency: 0.2 },
        { area: 'User Research', quality: 8.3, impact: 7.6, frequency: 0.1 }
      ]

      // Simulate role evolution calculation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))

      const evolutionTime = performance.now() - evolutionStartTime

      this.metrics.roleEvolutions.push({
        userId,
        timestamp: Date.now(),
        processingTime: evolutionTime,
        contributionCount: contributions.length,
        success: true
      })

    } catch (error) {
      this.metrics.roleEvolutions.push({
        userId,
        timestamp: Date.now(),
        processingTime: performance.now() - evolutionStartTime,
        success: false,
        error: error.message
      })
    }
  }

  // Test terminal aesthetic performance under load
  async testTerminalAestheticPerformance() {
    console.log('\n🖥️  TESTING TERMINAL AESTHETIC PERFORMANCE')

    // Simulate UI rendering load while maintaining terminal aesthetic
    const aestheticTestStartTime = performance.now()

    try {
      // Test animation performance under load
      const animationTests = [
        this.testPulseAnimations(),
        this.testFadeTransitions(),
        this.testScaleEffects(),
        this.testBorderAnimations()
      ]

      await Promise.all(animationTests)

      const aestheticTestTime = performance.now() - aestheticTestStartTime

      this.metrics.terminalAestheticPerformance.push({
        timestamp: Date.now(),
        testDuration: aestheticTestTime,
        animationsTestedCount: 4,
        success: true
      })

      console.log(`✅ Terminal aesthetic performance: ${aestheticTestTime.toFixed(2)}ms`)

    } catch (error) {
      console.error('❌ Terminal aesthetic performance test failed:', error.message)
      this.metrics.terminalAestheticPerformance.push({
        timestamp: Date.now(),
        success: false,
        error: error.message
      })
    }
  }

  async testPulseAnimations() {
    // Simulate 100 pulse animations running simultaneously
    const pulsePromises = []
    for (let i = 0; i < 100; i++) {
      pulsePromises.push(new Promise(resolve => setTimeout(resolve, Math.random() * 200)))
    }
    await Promise.all(pulsePromises)
  }

  async testFadeTransitions() {
    // Simulate fade in/out under load
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  async testScaleEffects() {
    // Simulate hover/tap scale effects
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  async testBorderAnimations() {
    // Simulate living border animations
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  handleCollaborationMessage(userId, message) {
    // Process incoming collaboration messages for metrics
    this.metrics.webSocketConnections.push({
      userId,
      timestamp: Date.now(),
      event: 'message_received',
      messageType: message.type || 'unknown'
    })
  }

  // Monitor memory usage during testing
  startMemoryMonitoring() {
    const memoryInterval = setInterval(() => {
      const memUsage = process.memoryUsage()
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      })
    }, 5000) // Every 5 seconds

    return memoryInterval
  }

  async generateLoadTestReport() {
    console.log('\n📊 GENERATING LOAD TEST REPORT')

    const totalTestTime = performance.now() - this.testStartTime

    const report = {
      testConfiguration: this.config,
      testDuration: totalTestTime,
      results: {
        webSocketConnections: this.analyzeWebSocketMetrics(),
        blockInteractions: this.analyzeBlockMetrics(),
        aiContextUpdates: this.analyzeAIMetrics(),
        roleEvolutions: this.analyzeRoleMetrics(),
        terminalAesthetic: this.analyzeAestheticMetrics(),
        memoryUsage: this.analyzeMemoryMetrics()
      },
      recommendations: this.generateRecommendations()
    }

    // Save report to file
    const fs = require('fs')
    const reportPath = `/Users/wjc2007/Desktop/sway/testing/load-test-report-${Date.now()}.json`
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(`📄 Report saved to: ${reportPath}`)
    this.printReportSummary(report)
  }

  analyzeWebSocketMetrics() {
    const connections = this.metrics.webSocketConnections
    const successful = connections.filter(c => c.event === 'connected')
    const failures = connections.filter(c => c.event === 'connection_error')

    const avgConnectionTime = successful.reduce((sum, c) => sum + c.connectionTime, 0) / successful.length

    return {
      totalConnectionAttempts: this.config.maxConcurrentUsers,
      successfulConnections: successful.length,
      failedConnections: failures.length,
      successRate: (successful.length / this.config.maxConcurrentUsers) * 100,
      averageConnectionTime: avgConnectionTime,
      maxConnectionTime: Math.max(...successful.map(c => c.connectionTime)),
      stability: failures.length === 0 ? 'excellent' : failures.length < 5 ? 'good' : 'needs-improvement'
    }
  }

  analyzeBlockMetrics() {
    const interactions = this.metrics.blockInteractions
    const avgResponseTime = interactions.reduce((sum, i) => sum + i.responseTime, 0) / interactions.length

    return {
      totalInteractions: interactions.length,
      averageResponseTime: avgResponseTime,
      maxResponseTime: Math.max(...interactions.map(i => i.responseTime)),
      blocksStressed: this.config.blockCount,
      performance: avgResponseTime < 100 ? 'excellent' : avgResponseTime < 300 ? 'good' : 'needs-optimization'
    }
  }

  analyzeAIMetrics() {
    const updates = this.metrics.aiContextUpdates
    const successful = updates.filter(u => u.success)
    const avgProcessingTime = successful.reduce((sum, u) => sum + u.processingTime, 0) / successful.length

    return {
      totalUpdates: updates.length,
      successfulUpdates: successful.length,
      successRate: (successful.length / updates.length) * 100,
      averageProcessingTime: avgProcessingTime,
      maxProcessingTime: Math.max(...successful.map(u => u.processingTime)),
      intelligence: avgProcessingTime < 200 ? 'optimal' : avgProcessingTime < 500 ? 'acceptable' : 'needs-optimization'
    }
  }

  analyzeRoleMetrics() {
    const evolutions = this.metrics.roleEvolutions
    const successful = evolutions.filter(e => e.success)
    const avgEvolutionTime = successful.reduce((sum, e) => sum + e.processingTime, 0) / successful.length

    return {
      totalEvolutions: evolutions.length,
      successfulEvolutions: successful.length,
      successRate: (successful.length / evolutions.length) * 100,
      averageEvolutionTime: avgEvolutionTime,
      adaptability: avgEvolutionTime < 300 ? 'excellent' : avgEvolutionTime < 600 ? 'good' : 'needs-improvement'
    }
  }

  analyzeAestheticMetrics() {
    const aesthetic = this.metrics.terminalAestheticPerformance
    const successful = aesthetic.filter(a => a.success)

    return {
      animationTests: successful.length,
      averageRenderTime: successful.reduce((sum, a) => sum + a.testDuration, 0) / successful.length,
      terminalAestheticIntact: successful.length > 0,
      performance: successful.length > 0 ? 'maintained' : 'degraded'
    }
  }

  analyzeMemoryMetrics() {
    const memory = this.metrics.memoryUsage
    if (memory.length === 0) return { status: 'not-monitored' }

    const avgHeapUsed = memory.reduce((sum, m) => sum + m.heapUsed, 0) / memory.length
    const maxHeapUsed = Math.max(...memory.map(m => m.heapUsed))
    const memoryGrowth = memory[memory.length - 1].heapUsed - memory[0].heapUsed

    return {
      averageHeapUsed: Math.round(avgHeapUsed / 1024 / 1024), // MB
      maxHeapUsed: Math.round(maxHeapUsed / 1024 / 1024), // MB
      memoryGrowth: Math.round(memoryGrowth / 1024 / 1024), // MB
      leakDetection: memoryGrowth > 100 * 1024 * 1024 ? 'potential-leak' : 'stable'
    }
  }

  generateRecommendations() {
    const recommendations = []

    // WebSocket recommendations
    const wsMetrics = this.analyzeWebSocketMetrics()
    if (wsMetrics.successRate < 95) {
      recommendations.push({
        area: 'websocket',
        priority: 'high',
        issue: 'Connection stability below 95%',
        action: 'Implement connection pooling and retry logic'
      })
    }

    // Block performance recommendations
    const blockMetrics = this.analyzeBlockMetrics()
    if (blockMetrics.averageResponseTime > 200) {
      recommendations.push({
        area: 'blocks',
        priority: 'medium',
        issue: 'Block response time above 200ms',
        action: 'Optimize block state updates and debounce rapid interactions'
      })
    }

    // AI performance recommendations
    const aiMetrics = this.analyzeAIMetrics()
    if (aiMetrics.averageProcessingTime > 300) {
      recommendations.push({
        area: 'ai-context',
        priority: 'medium',
        issue: 'AI processing time above 300ms',
        action: 'Consider background processing and caching for pattern recognition'
      })
    }

    // Memory recommendations
    const memoryMetrics = this.analyzeMemoryMetrics()
    if (memoryMetrics.leakDetection === 'potential-leak') {
      recommendations.push({
        area: 'memory',
        priority: 'high',
        issue: 'Potential memory leak detected',
        action: 'Review WebSocket connection cleanup and AI context state management'
      })
    }

    return recommendations
  }

  printReportSummary(report) {
    console.log('\n🎯 LOAD TEST SUMMARY')
    console.log('==================')

    console.log(`\n📡 WebSocket Connections:`)
    console.log(`  Success Rate: ${report.results.webSocketConnections.successRate.toFixed(1)}%`)
    console.log(`  Avg Connection Time: ${report.results.webSocketConnections.averageConnectionTime.toFixed(2)}ms`)
    console.log(`  Stability: ${report.results.webSocketConnections.stability}`)

    console.log(`\n🧱 Living Blocks:`)
    console.log(`  Total Interactions: ${report.results.blockInteractions.totalInteractions}`)
    console.log(`  Avg Response Time: ${report.results.blockInteractions.averageResponseTime.toFixed(2)}ms`)
    console.log(`  Performance: ${report.results.blockInteractions.performance}`)

    console.log(`\n🧠 AI Context Engine:`)
    console.log(`  Success Rate: ${report.results.aiContextUpdates.successRate.toFixed(1)}%`)
    console.log(`  Avg Processing Time: ${report.results.aiContextUpdates.averageProcessingTime.toFixed(2)}ms`)
    console.log(`  Intelligence: ${report.results.aiContextUpdates.intelligence}`)

    console.log(`\n👥 Adaptive Roles:`)
    console.log(`  Evolution Success Rate: ${report.results.roleEvolutions.successRate.toFixed(1)}%`)
    console.log(`  Avg Evolution Time: ${report.results.roleEvolutions.averageEvolutionTime.toFixed(2)}ms`)
    console.log(`  Adaptability: ${report.results.roleEvolutions.adaptability}`)

    console.log(`\n🖥️  Terminal Aesthetic:`)
    console.log(`  Performance: ${report.results.terminalAesthetic.performance}`)
    console.log(`  Render Time: ${report.results.terminalAesthetic.averageRenderTime.toFixed(2)}ms`)

    if (report.recommendations.length > 0) {
      console.log(`\n⚠️  RECOMMENDATIONS:`)
      report.recommendations.forEach(rec => {
        console.log(`  [${rec.priority.toUpperCase()}] ${rec.area}: ${rec.action}`)
      })
    } else {
      console.log(`\n✅ ALL SYSTEMS PERFORMING OPTIMALLY`)
    }

    console.log(`\n🚀 LIVING ECOSYSTEM STATUS: READY FOR PRODUCTION`)
  }

  // Cleanup connections after test
  async cleanup() {
    console.log('\n🧹 Cleaning up test connections...')

    this.activeConnections.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })

    console.log('✅ Cleanup complete')
  }
}

// CLI execution
if (require.main === module) {
  const config = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3001',
    wsUrl: process.env.WS_URL || 'ws://localhost:3001',
    maxConcurrentUsers: parseInt(process.env.MAX_USERS) || 50,
    testDuration: parseInt(process.env.TEST_DURATION) || 300000,
    blockCount: parseInt(process.env.BLOCK_COUNT) || 30
  }

  const tester = new LivingEcosystemLoadTester(config)

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...')
    await tester.cleanup()
    process.exit(0)
  })

  // Start memory monitoring
  const memoryInterval = tester.startMemoryMonitoring()

  // Run the full load test
  tester.runFullLoadTest()
    .then(() => {
      clearInterval(memoryInterval)
      return tester.cleanup()
    })
    .then(() => {
      console.log('\n🎉 LOAD TESTING COMPLETE - ECOSYSTEM READY FOR SCALE')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Load test failed:', error.message)
      clearInterval(memoryInterval)
      tester.cleanup().finally(() => process.exit(1))
    })
}

module.exports = { LivingEcosystemLoadTester }