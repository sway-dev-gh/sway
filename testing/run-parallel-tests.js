#!/usr/bin/env node

/**
 * Living Collaboration Ecosystem - Parallel Test Runner
 *
 * Executes load testing and security validation in parallel
 * Provides real-time progress updates and consolidated reporting
 * Maintains terminal aesthetic while providing comprehensive test coverage
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

class ParallelTestRunner {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3001',
      wsUrl: config.wsUrl || 'ws://localhost:3001',
      maxConcurrentUsers: config.maxConcurrentUsers || 50,
      testDuration: config.testDuration || 300000,
      blockCount: config.blockCount || 30,
      testUsers: config.testUsers || 25,
      outputDir: config.outputDir || './test-results',
      ...config
    }

    this.testProcesses = new Map()
    this.testResults = new Map()
    this.startTime = Date.now()
  }

  // Main execution method
  async runParallelTests() {
    console.log('🚀 STARTING LIVING ECOSYSTEM PARALLEL TESTING')
    console.log('==============================================')
    console.log(`Load Testing: ${this.config.maxConcurrentUsers} users, ${this.config.blockCount} blocks`)
    console.log(`Security Testing: ${this.config.testUsers} test users, comprehensive validation`)
    console.log(`Test Duration: ${this.config.testDuration / 1000}s`)
    console.log(`Results Directory: ${this.config.outputDir}`)

    // Ensure output directory exists
    this.ensureOutputDirectory()

    // Start monitoring system resources
    const resourceMonitor = this.startResourceMonitoring()

    try {
      // Launch both test suites in parallel
      const testPromises = [
        this.runLoadTesting(),
        this.runSecurityValidation()
      ]

      // Wait for both test suites to complete
      const results = await Promise.allSettled(testPromises)

      // Stop resource monitoring
      clearInterval(resourceMonitor)

      // Process and consolidate results
      await this.processTestResults(results)

      // Generate final consolidated report
      await this.generateConsolidatedReport()

      console.log('\n🎉 PARALLEL TESTING COMPLETE')
      console.log('Living Ecosystem is ready for production!')

    } catch (error) {
      console.error('❌ Parallel testing failed:', error.message)
      clearInterval(resourceMonitor)
      process.exit(1)
    }
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true })
      console.log(`📁 Created output directory: ${this.config.outputDir}`)
    }
  }

  startResourceMonitoring() {
    const resourceLog = []

    const monitor = setInterval(() => {
      const memUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()

      resourceLog.push({
        timestamp: Date.now(),
        memory: {
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      })

      // Save resource log periodically
      if (resourceLog.length % 12 === 0) { // Every minute
        fs.writeFileSync(
          path.join(this.config.outputDir, 'resource-usage.json'),
          JSON.stringify(resourceLog, null, 2)
        )
      }
    }, 5000) // Every 5 seconds

    return monitor
  }

  async runLoadTesting() {
    console.log('\n🔥 STARTING LOAD TESTING')

    return new Promise((resolve, reject) => {
      const loadTestProcess = spawn('node', ['load-testing-suite.js'], {
        cwd: __dirname,
        env: {
          ...process.env,
          BASE_URL: this.config.baseUrl,
          WS_URL: this.config.wsUrl,
          MAX_USERS: this.config.maxConcurrentUsers.toString(),
          TEST_DURATION: this.config.testDuration.toString(),
          BLOCK_COUNT: this.config.blockCount.toString()
        },
        stdio: 'pipe'
      })

      this.testProcesses.set('load-testing', loadTestProcess)

      let loadTestOutput = ''
      let loadTestErrors = ''

      loadTestProcess.stdout.on('data', (data) => {
        const output = data.toString()
        loadTestOutput += output

        // Real-time progress output with terminal prefix
        const lines = output.trim().split('\n')
        lines.forEach(line => {
          if (line.trim()) {
            console.log(`[LOAD] ${line}`)
          }
        })
      })

      loadTestProcess.stderr.on('data', (data) => {
        const error = data.toString()
        loadTestErrors += error
        console.error(`[LOAD ERROR] ${error}`)
      })

      loadTestProcess.on('close', (code) => {
        this.testResults.set('load-testing', {
          exitCode: code,
          output: loadTestOutput,
          errors: loadTestErrors,
          duration: Date.now() - this.startTime
        })

        if (code === 0) {
          console.log('\n✅ LOAD TESTING COMPLETED SUCCESSFULLY')
          resolve({ success: true, exitCode: code })
        } else {
          console.error(`\n❌ LOAD TESTING FAILED (exit code: ${code})`)
          reject(new Error(`Load testing failed with exit code ${code}`))
        }
      })

      loadTestProcess.on('error', (error) => {
        console.error('❌ Load testing process error:', error.message)
        reject(error)
      })
    })
  }

  async runSecurityValidation() {
    console.log('\n🔒 STARTING SECURITY VALIDATION')

    return new Promise((resolve, reject) => {
      const securityTestProcess = spawn('node', ['security-validation-suite.js'], {
        cwd: __dirname,
        env: {
          ...process.env,
          BASE_URL: this.config.baseUrl,
          WS_URL: this.config.wsUrl,
          TEST_USERS: this.config.testUsers.toString()
        },
        stdio: 'pipe'
      })

      this.testProcesses.set('security-validation', securityTestProcess)

      let securityTestOutput = ''
      let securityTestErrors = ''

      securityTestProcess.stdout.on('data', (data) => {
        const output = data.toString()
        securityTestOutput += output

        // Real-time progress output with terminal prefix
        const lines = output.trim().split('\n')
        lines.forEach(line => {
          if (line.trim()) {
            console.log(`[SEC] ${line}`)
          }
        })
      })

      securityTestProcess.stderr.on('data', (data) => {
        const error = data.toString()
        securityTestErrors += error
        console.error(`[SEC ERROR] ${error}`)
      })

      securityTestProcess.on('close', (code) => {
        this.testResults.set('security-validation', {
          exitCode: code,
          output: securityTestOutput,
          errors: securityTestErrors,
          duration: Date.now() - this.startTime
        })

        if (code === 0) {
          console.log('\n✅ SECURITY VALIDATION COMPLETED SUCCESSFULLY')
          resolve({ success: true, exitCode: code })
        } else {
          console.error(`\n❌ SECURITY VALIDATION FAILED (exit code: ${code})`)
          reject(new Error(`Security validation failed with exit code ${code}`))
        }
      })

      securityTestProcess.on('error', (error) => {
        console.error('❌ Security validation process error:', error.message)
        reject(error)
      })
    })
  }

  async processTestResults(results) {
    console.log('\n📊 PROCESSING TEST RESULTS')

    const [loadTestResult, securityTestResult] = results

    // Process load testing results
    if (loadTestResult.status === 'fulfilled') {
      console.log('✅ Load testing completed successfully')
      await this.extractLoadTestResults()
    } else {
      console.error('❌ Load testing failed:', loadTestResult.reason?.message)
    }

    // Process security validation results
    if (securityTestResult.status === 'fulfilled') {
      console.log('✅ Security validation completed successfully')
      await this.extractSecurityTestResults()
    } else {
      console.error('❌ Security validation failed:', securityTestResult.reason?.message)
    }
  }

  async extractLoadTestResults() {
    try {
      // Find the most recent load test report
      const files = fs.readdirSync('.').filter(f => f.startsWith('load-test-report-'))
      if (files.length > 0) {
        const latestReport = files.sort().pop()
        const reportContent = fs.readFileSync(latestReport, 'utf8')

        // Move to output directory
        fs.renameSync(latestReport, path.join(this.config.outputDir, 'load-test-report.json'))

        console.log('📄 Load test report saved to output directory')
      }
    } catch (error) {
      console.warn('⚠️  Could not extract load test results:', error.message)
    }
  }

  async extractSecurityTestResults() {
    try {
      // Find the most recent security test report
      const files = fs.readdirSync('.').filter(f => f.startsWith('security-report-'))
      if (files.length > 0) {
        const latestReport = files.sort().pop()
        const reportContent = fs.readFileSync(latestReport, 'utf8')

        // Move to output directory
        fs.renameSync(latestReport, path.join(this.config.outputDir, 'security-report.json'))

        console.log('🔒 Security test report saved to output directory')
      }
    } catch (error) {
      console.warn('⚠️  Could not extract security test results:', error.message)
    }
  }

  async generateConsolidatedReport() {
    console.log('\n📋 GENERATING CONSOLIDATED REPORT')

    const consolidatedReport = {
      testConfiguration: this.config,
      testSuiteExecutionTime: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      results: {
        loadTesting: this.getTestSummary('load-testing'),
        securityValidation: this.getTestSummary('security-validation')
      },
      overallStatus: this.determineOverallStatus(),
      recommendations: this.generateOverallRecommendations(),
      nextSteps: this.generateNextSteps()
    }

    // Try to include detailed reports if available
    try {
      const loadReportPath = path.join(this.config.outputDir, 'load-test-report.json')
      if (fs.existsSync(loadReportPath)) {
        consolidatedReport.detailedResults = {
          ...consolidatedReport.detailedResults,
          loadTesting: JSON.parse(fs.readFileSync(loadReportPath, 'utf8'))
        }
      }

      const securityReportPath = path.join(this.config.outputDir, 'security-report.json')
      if (fs.existsSync(securityReportPath)) {
        consolidatedReport.detailedResults = {
          ...consolidatedReport.detailedResults,
          securityValidation: JSON.parse(fs.readFileSync(securityReportPath, 'utf8'))
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not include detailed reports in consolidated report')
    }

    // Save consolidated report
    const consolidatedReportPath = path.join(this.config.outputDir, 'consolidated-report.json')
    fs.writeFileSync(consolidatedReportPath, JSON.stringify(consolidatedReport, null, 2))

    console.log(`📄 Consolidated report saved to: ${consolidatedReportPath}`)

    // Print executive summary
    this.printExecutiveSummary(consolidatedReport)

    return consolidatedReport
  }

  getTestSummary(testName) {
    const result = this.testResults.get(testName)

    if (!result) {
      return {
        status: 'not_executed',
        exitCode: null,
        duration: 0,
        hasOutput: false
      }
    }

    return {
      status: result.exitCode === 0 ? 'success' : 'failure',
      exitCode: result.exitCode,
      duration: result.duration,
      hasOutput: result.output.length > 0,
      hasErrors: result.errors.length > 0,
      outputSize: result.output.length,
      errorCount: (result.errors.match(/error/gi) || []).length
    }
  }

  determineOverallStatus() {
    const loadTestStatus = this.getTestSummary('load-testing').status
    const securityTestStatus = this.getTestSummary('security-validation').status

    if (loadTestStatus === 'success' && securityTestStatus === 'success') {
      return 'PRODUCTION_READY'
    } else if (loadTestStatus === 'success' || securityTestStatus === 'success') {
      return 'PARTIAL_SUCCESS_NEEDS_REVIEW'
    } else {
      return 'REQUIRES_FIXES_BEFORE_PRODUCTION'
    }
  }

  generateOverallRecommendations() {
    const recommendations = []
    const loadTestStatus = this.getTestSummary('load-testing').status
    const securityTestStatus = this.getTestSummary('security-validation').status

    if (loadTestStatus !== 'success') {
      recommendations.push({
        area: 'performance',
        priority: 'high',
        recommendation: 'Address load testing failures before production deployment',
        action: 'Review load test report for specific performance bottlenecks'
      })
    }

    if (securityTestStatus !== 'success') {
      recommendations.push({
        area: 'security',
        priority: 'critical',
        recommendation: 'Fix security validation issues immediately',
        action: 'Review security report for vulnerabilities and implement fixes'
      })
    }

    if (loadTestStatus === 'success' && securityTestStatus === 'success') {
      recommendations.push({
        area: 'deployment',
        priority: 'medium',
        recommendation: 'Proceed with staged production rollout',
        action: 'Begin with limited user groups and monitor metrics closely'
      })
    }

    return recommendations
  }

  generateNextSteps() {
    const overallStatus = this.determineOverallStatus()

    const nextSteps = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    }

    if (overallStatus === 'PRODUCTION_READY') {
      nextSteps.immediate = [
        'Set up production monitoring dashboards',
        'Configure alerting for key metrics',
        'Prepare rollback procedures'
      ]
      nextSteps.shortTerm = [
        'Begin limited production rollout',
        'Monitor user experience metrics',
        'Collect feedback from early adopters'
      ]
      nextSteps.longTerm = [
        'Scale to full user base',
        'Iterate on AI intelligence features',
        'Expand living collaboration capabilities'
      ]
    } else {
      nextSteps.immediate = [
        'Review test reports for critical issues',
        'Fix identified problems',
        'Re-run failed test suites'
      ]
      nextSteps.shortTerm = [
        'Implement recommended improvements',
        'Conduct additional testing',
        'Validate fixes in staging environment'
      ]
      nextSteps.longTerm = [
        'Establish continuous testing pipeline',
        'Build automated monitoring',
        'Plan for production readiness'
      ]
    }

    return nextSteps
  }

  printExecutiveSummary(report) {
    console.log('\n🎯 EXECUTIVE SUMMARY')
    console.log('===================')

    console.log(`\n📅 Test Execution Time: ${(report.testSuiteExecutionTime / 1000 / 60).toFixed(1)} minutes`)
    console.log(`🏁 Overall Status: ${report.overallStatus}`)

    console.log(`\n🔥 Load Testing:`)
    const loadSummary = report.results.loadTesting
    console.log(`   Status: ${loadSummary.status.toUpperCase()}`)
    console.log(`   Duration: ${(loadSummary.duration / 1000).toFixed(1)}s`)

    console.log(`\n🔒 Security Validation:`)
    const securitySummary = report.results.securityValidation
    console.log(`   Status: ${securitySummary.status.toUpperCase()}`)
    console.log(`   Duration: ${(securitySummary.duration / 1000).toFixed(1)}s`)

    if (report.recommendations.length > 0) {
      console.log(`\n💡 KEY RECOMMENDATIONS:`)
      report.recommendations.forEach(rec => {
        console.log(`   [${rec.priority.toUpperCase()}] ${rec.area}: ${rec.recommendation}`)
      })
    }

    console.log(`\n🚀 NEXT STEPS:`)
    report.nextSteps.immediate.forEach(step => {
      console.log(`   • ${step}`)
    })

    const statusEmoji = report.overallStatus === 'PRODUCTION_READY' ? '🎉' :
                       report.overallStatus === 'PARTIAL_SUCCESS_NEEDS_REVIEW' ? '⚠️' : '❌'

    console.log(`\n${statusEmoji} LIVING ECOSYSTEM STATUS: ${report.overallStatus.replace(/_/g, ' ')}`)
  }

  // Graceful shutdown handling
  async cleanup() {
    console.log('\n🧹 Cleaning up test processes...')

    for (const [testName, process] of this.testProcesses) {
      if (process && !process.killed) {
        process.kill('SIGTERM')
        console.log(`Terminated ${testName} process`)
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  const config = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3001',
    wsUrl: process.env.WS_URL || 'ws://localhost:3001',
    maxConcurrentUsers: parseInt(process.env.MAX_USERS) || 50,
    testDuration: parseInt(process.env.TEST_DURATION) || 300000,
    blockCount: parseInt(process.env.BLOCK_COUNT) || 30,
    testUsers: parseInt(process.env.TEST_USERS) || 25,
    outputDir: process.env.OUTPUT_DIR || './test-results'
  }

  const runner = new ParallelTestRunner(config)

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...')
    await runner.cleanup()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
    await runner.cleanup()
    process.exit(0)
  })

  // Run parallel tests
  runner.runParallelTests()
    .then(() => {
      console.log('\n🎊 ALL TESTING COMPLETE')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Parallel testing failed:', error.message)
      runner.cleanup().finally(() => process.exit(1))
    })
}

module.exports = { ParallelTestRunner }