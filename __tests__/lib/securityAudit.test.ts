/**
 * Comprehensive Security Audit System Tests
 * Testing enterprise-grade security and audit logging for world-class standards
 */

import {
  securityAudit,
  SecurityEventType,
  SecuritySeverity,
  trackLogin,
  trackDataAccess,
  trackPermissionCheck,
  detectSecurityViolation,
  logSecurityEvent,
  logAuditEvent
} from '../../lib/securityAudit'
import { analytics } from '../../lib/analytics'
import { useErrorMonitoring } from '../../lib/errorMonitoring'
const errorMonitoring = { captureError: jest.fn() }

// Mock dependencies
jest.mock('../../lib/analytics')
jest.mock('../../lib/errorMonitoring')

const mockAnalytics = analytics as jest.Mocked<typeof analytics>
const mockErrorMonitoring = errorMonitoring as jest.Mocked<typeof errorMonitoring>

// Mock console for log verification
const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

describe('Security Audit System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    consoleSpy.mockClear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Security Event Logging', () => {
    it('should log basic security events correctly', () => {
      logSecurityEvent(
        SecurityEventType.LOGIN_SUCCESS,
        SecuritySeverity.LOW,
        { email: 'test@example.com' },
        'user-123'
      )

      // Advance timers to trigger buffer flush
      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('auth.login.success'),
        expect.stringContaining('low'),
        expect.objectContaining({
          email: 'test@example.com'
        })
      )

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'security_event',
        expect.objectContaining({
          type: SecurityEventType.LOGIN_SUCCESS,
          severity: SecuritySeverity.LOW
        })
      )
    })

    it('should calculate risk scores appropriately', () => {
      // Low risk event
      logSecurityEvent(
        SecurityEventType.LOGIN_SUCCESS,
        SecuritySeverity.LOW,
        { email: 'test@example.com' }
      )

      jest.advanceTimersByTime(6000)

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'security_event',
        expect.objectContaining({
          riskScore: expect.any(Number)
        })
      )

      const lowRiskCall = mockAnalytics.track.mock.calls.find(call =>
        call[0]?.type === 'security_event'
      )
      expect(lowRiskCall?.[0]?.data?.riskScore).toBeLessThan(0.5)

      // High risk event
      mockAnalytics.track.mockClear()
      logSecurityEvent(
        SecurityEventType.BRUTE_FORCE_DETECTED,
        SecuritySeverity.CRITICAL,
        { sensitiveData: true, privilegedUser: true }
      )

      jest.advanceTimersByTime(6000)

      const highRiskCall = mockAnalytics.track.mock.calls.find(call =>
        call[0]?.type === 'security_event'
      )
      expect(highRiskCall?.[0]?.data?.riskScore).toBeGreaterThan(0.8)
    })

    it('should identify threat indicators correctly', () => {
      logSecurityEvent(
        SecurityEventType.LOGIN_FAILURE,
        SecuritySeverity.MEDIUM,
        {
          email: 'test@example.com',
          unusualGeolocation: true,
          unusualTime: true
        }
      )

      jest.advanceTimersByTime(6000)

      // Verify that the logged event includes threat indicators
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.anything(),
        expect.objectContaining({
          email: 'test@example.com',
          unusualGeolocation: true,
          unusualTime: true
        })
      )
    })

    it('should handle critical events immediately', () => {
      logSecurityEvent(
        SecurityEventType.PRIVILEGE_ESCALATION,
        SecuritySeverity.CRITICAL,
        { userId: 'user-123', targetRole: 'admin' },
        'user-123'
      )

      // Critical events should be processed immediately, not buffered
      expect(mockErrorMonitoring.captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'security',
          severity: SecuritySeverity.CRITICAL
        })
      )
    })

    it('should flush buffer when full', () => {
      // Fill buffer with events
      for (let i = 0; i < 101; i++) {
        logSecurityEvent(
          SecurityEventType.DATA_ACCESS,
          SecuritySeverity.LOW,
          { access: i }
        )
      }

      // Buffer should flush automatically when full
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Authentication Security', () => {
    it('should track successful login attempts', () => {
      trackLogin('user@example.com', true, '192.168.1.100', {
        userId: 'user-123',
        deviceInfo: 'Chrome/MacOS'
      })

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('auth.login.success'),
        expect.objectContaining({
          email: 'user@example.com',
          ipAddress: '192.168.1.100'
        })
      )
    })

    it('should detect and handle brute force attacks', () => {
      const ipAddress = '192.168.1.200'

      // Simulate multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        trackLogin('target@example.com', false, ipAddress, {
          attemptNumber: i + 1
        })
      }

      jest.advanceTimersByTime(6000)

      // Should detect brute force attack
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('security.brute_force'),
        expect.objectContaining({
          targetEmail: 'target@example.com',
          sourceIp: ipAddress
        })
      )
    })

    it('should reset failed attempts after successful login', () => {
      const ipAddress = '192.168.1.300'

      // Multiple failed attempts
      for (let i = 0; i < 3; i++) {
        trackLogin('user@example.com', false, ipAddress)
      }

      // Successful login should reset counter
      trackLogin('user@example.com', true, ipAddress, { userId: 'user-123' })

      // Additional failed attempt should not trigger brute force
      trackLogin('user@example.com', false, ipAddress)

      jest.advanceTimersByTime(6000)

      // Should not have brute force detection
      const bruteForceLogs = consoleSpy.mock.calls.filter(call =>
        call[1]?.includes('security.brute_force')
      )
      expect(bruteForceLogs).toHaveLength(0)
    })

    it('should detect suspicious login patterns', () => {
      // Mock suspicious login detection
      jest.spyOn(securityAudit as any, 'isSuspiciousLogin').mockReturnValue(true)
      jest.spyOn(securityAudit as any, 'getSuspiciousFactors').mockReturnValue([
        'unusual_location', 'new_device'
      ])

      trackLogin('user@example.com', true, '192.168.1.400', {
        userId: 'user-123',
        location: 'Unknown'
      })

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('auth.login.suspicious'),
        expect.objectContaining({
          email: 'user@example.com',
          suspiciousFactors: ['unusual_location', 'new_device']
        })
      )
    })
  })

  describe('Data Access Tracking', () => {
    it('should track regular data access', () => {
      trackDataAccess('user-123', 'document', 'doc-456', 'read', false)

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('data.access'),
        expect.objectContaining({
          resourceType: 'document',
          resourceId: 'doc-456',
          action: 'read'
        })
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.stringContaining('data_access.read'),
        expect.objectContaining({
          userId: 'user-123',
          resourceType: 'document',
          resourceId: 'doc-456'
        })
      )
    })

    it('should escalate sensitive data access', () => {
      trackDataAccess('user-123', 'user_profile', 'profile-789', 'read', true)

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('data.sensitive.access'),
        expect.objectContaining({
          resourceType: 'user_profile',
          sensitiveData: true
        })
      )
    })

    it('should track different access types', () => {
      const accessTypes = ['read', 'write', 'delete', 'export'] as const

      accessTypes.forEach(action => {
        trackDataAccess('user-123', 'document', 'doc-123', action, false)
      })

      jest.advanceTimersByTime(6000)

      accessTypes.forEach(action => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[AUDIT]'),
          expect.stringContaining(`data_access.${action}`),
          expect.anything()
        )
      })
    })
  })

  describe('Permission and Access Control', () => {
    it('should track successful permission checks', () => {
      trackPermissionCheck('user-123', 'document:doc-456', 'read', true)

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('access.permission.granted'),
        expect.objectContaining({
          resource: 'document:doc-456',
          permission: 'read',
          reason: 'authorized'
        })
      )
    })

    it('should track and escalate permission denials', () => {
      trackPermissionCheck(
        'user-123',
        'admin:settings',
        'write',
        false,
        'insufficient_privileges'
      )

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('access.permission.denied'),
        expect.objectContaining({
          resource: 'admin:settings',
          permission: 'write',
          reason: 'insufficient_privileges'
        })
      )
    })
  })

  describe('Security Violation Detection', () => {
    it('should detect and log SQL injection attempts', () => {
      const maliciousRequest = {
        url: '/api/users',
        method: 'GET',
        headers: {
          'user-agent': 'AttackBot/1.0',
          'referer': 'http://evil.com'
        },
        params: {
          id: "1' OR '1'='1"
        }
      }

      detectSecurityViolation('sql_injection', maliciousRequest, {
        detectedPattern: "' OR '1'='1",
        riskLevel: 'high'
      })

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('security.sql_injection'),
        expect.objectContaining({
          violationType: 'sql_injection',
          request: expect.objectContaining({
            url: '/api/users',
            method: 'GET'
          })
        })
      )
    })

    it('should detect XSS attempts', () => {
      const xssRequest = {
        url: '/api/comments',
        method: 'POST',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'content-type': 'application/json'
        },
        body: {
          comment: '<script>alert("XSS")</script>'
        }
      }

      detectSecurityViolation('xss', xssRequest, {
        detectedScript: '<script>alert("XSS")</script>'
      })

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('security.xss_attempt'),
        expect.objectContaining({
          violationType: 'xss'
        })
      )
    })

    it('should detect CSRF attempts', () => {
      const csrfRequest = {
        url: '/api/transfer',
        method: 'POST',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'referer': 'http://malicious-site.com'
        },
        body: {
          amount: 1000,
          to: 'attacker-account'
        }
      }

      detectSecurityViolation('csrf', csrfRequest, {
        missingToken: true,
        suspiciousReferer: true
      })

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('security.csrf_attempt'),
        expect.anything()
      )
    })
  })

  describe('Session Management', () => {
    it('should track session creation and management', () => {
      securityAudit.trackSessionActivity('user-123', 'session-456', 'created')

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.stringContaining('session_management.created'),
        expect.objectContaining({
          userId: 'user-123',
          sessionId: 'session-456'
        })
      )
    })

    it('should detect excessive concurrent sessions', () => {
      const userId = 'user-123'

      // Create multiple sessions exceeding limit
      for (let i = 0; i < 5; i++) {
        securityAudit.trackSessionActivity(userId, `session-${i}`, 'created')
      }

      jest.advanceTimersByTime(6000)

      // Should detect suspicious activity
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('security.suspicious_activity'),
        expect.objectContaining({
          userId,
          concurrentSessions: expect.any(Number)
        })
      )
    })

    it('should track session termination', () => {
      const userId = 'user-123'
      const sessionId = 'session-456'

      // Create and then terminate session
      securityAudit.trackSessionActivity(userId, sessionId, 'created')
      securityAudit.trackSessionActivity(userId, sessionId, 'terminated')

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.stringContaining('session_management.terminated'),
        expect.objectContaining({
          userId,
          sessionId
        })
      )
    })
  })

  describe('Audit Trail Management', () => {
    it('should create comprehensive audit entries', () => {
      logAuditEvent(
        'user_management',
        'create_user',
        'success',
        {
          userId: 'admin-123',
          newUserId: 'user-456',
          assignedRole: 'editor'
        },
        'user',
        'user-456'
      )

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.stringContaining('user_management.create_user'),
        expect.stringContaining('success'),
        expect.objectContaining({
          newUserId: 'user-456',
          assignedRole: 'editor'
        })
      )

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'audit_event',
        expect.objectContaining({
          type: 'user_management',
          action: 'create_user',
          outcome: 'success',
          resourceType: 'user'
        })
      )
    })

    it('should track failed operations', () => {
      logAuditEvent(
        'data_export',
        'export_sensitive_data',
        'failure',
        {
          userId: 'user-123',
          reason: 'insufficient_permissions',
          requestedData: 'user_financial_records'
        },
        'sensitive_data'
      )

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.stringContaining('data_export.export_sensitive_data'),
        expect.stringContaining('failure'),
        expect.objectContaining({
          reason: 'insufficient_permissions'
        })
      )
    })

    it('should generate compliance tags appropriately', () => {
      // Test GDPR tagging
      logAuditEvent(
        'data_access',
        'read_user_data',
        'success',
        { userId: 'user-123' },
        'user_data',
        'profile-456'
      )

      // Test PCI DSS tagging
      logAuditEvent(
        'financial_transaction',
        'process_payment',
        'success',
        { amount: 100 },
        'payment',
        'payment-789'
      )

      jest.advanceTimersByTime(6000)

      // Both should be tracked with appropriate compliance considerations
      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'audit_event',
        expect.objectContaining({
          type: 'data_access',
          resourceType: 'user_data'
        })
      )

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'audit_event',
        expect.objectContaining({
          type: 'financial_transaction',
          resourceType: 'payment'
        })
      )
    })
  })

  describe('Compliance and Reporting', () => {
    it('should generate compliance reports', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const report = await securityAudit.generateComplianceReport(
        startDate,
        endDate,
        ['gdpr', 'sox']
      )

      expect(report).toHaveProperty('period')
      expect(report.period.start).toBe(startDate.toISOString())
      expect(report.period.end).toBe(endDate.toISOString())
      expect(report.standards).toEqual(['gdpr', 'sox'])
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('details')
      expect(report).toHaveProperty('attestation')
      expect(report.attestation).toHaveProperty('signature')
    })

    it('should export audit logs with proper logging', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const exportFile = await securityAudit.exportAuditLogs(
        startDate,
        endDate,
        'json'
      )

      expect(exportFile).toMatch(/audit_logs_\d+\.json/)

      jest.advanceTimersByTime(6000)

      // Should log the export event
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('compliance.audit_log.export'),
        expect.objectContaining({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format: 'json'
        })
      )
    })

    it('should support different export formats', async () => {
      const formats = ['json', 'csv', 'xml'] as const

      for (const format of formats) {
        const exportFile = await securityAudit.exportAuditLogs(
          new Date('2024-01-01'),
          new Date('2024-01-31'),
          format
        )

        expect(exportFile).toMatch(new RegExp(`audit_logs_\\d+\\.${format}`))
      }
    })
  })

  describe('Buffer Management and Performance', () => {
    it('should flush buffers periodically', () => {
      // Add events to buffer
      logSecurityEvent(
        SecurityEventType.DATA_ACCESS,
        SecuritySeverity.LOW,
        { test: 'periodic flush' }
      )

      logAuditEvent(
        'test_event',
        'test_action',
        'success',
        { test: 'periodic flush' }
      )

      // Advance timers to trigger periodic flush
      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalledTimes(2)
    })

    it('should handle high volume events efficiently', () => {
      const startTime = Date.now()

      // Generate high volume of events
      for (let i = 0; i < 1000; i++) {
        logSecurityEvent(
          SecurityEventType.DATA_ACCESS,
          SecuritySeverity.LOW,
          { eventNumber: i }
        )
      }

      jest.advanceTimersByTime(6000)

      const endTime = Date.now()
      const processingTime = endTime - startTime

      // Should handle high volume efficiently (less than 1 second)
      expect(processingTime).toBeLessThan(1000)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle undefined or null values gracefully', () => {
      expect(() => {
        logSecurityEvent(
          SecurityEventType.DATA_ACCESS,
          SecuritySeverity.LOW,
          { undefinedValue: undefined, nullValue: null }
        )
      }).not.toThrow()

      jest.advanceTimersByTime(6000)

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should handle malformed data gracefully', () => {
      expect(() => {
        const circularObj: any = {}
        circularObj.self = circularObj

        logSecurityEvent(
          SecurityEventType.DATA_ACCESS,
          SecuritySeverity.LOW,
          { circularRef: circularObj }
        )
      }).not.toThrow()
    })

    it('should maintain system stability during errors', () => {
      // Mock console.log to throw an error
      consoleSpy.mockImplementationOnce(() => {
        throw new Error('Logging system failure')
      })

      expect(() => {
        logSecurityEvent(
          SecurityEventType.LOGIN_SUCCESS,
          SecuritySeverity.LOW,
          { email: 'test@example.com' }
        )

        jest.advanceTimersByTime(6000)
      }).not.toThrow()

      // System should recover and continue working
      consoleSpy.mockRestore()
      const newSpy = jest.spyOn(console, 'log').mockImplementation()

      logSecurityEvent(
        SecurityEventType.LOGIN_SUCCESS,
        SecuritySeverity.LOW,
        { email: 'test2@example.com' }
      )

      jest.advanceTimersByTime(6000)

      expect(newSpy).toHaveBeenCalled()
    })
  })

  describe('Integration with Analytics and Error Monitoring', () => {
    it('should integrate with analytics system', () => {
      logSecurityEvent(
        SecurityEventType.PRIVILEGE_ESCALATION,
        SecuritySeverity.HIGH,
        { userId: 'user-123', newRole: 'admin' }
      )

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'security_event',
        expect.objectContaining({
          type: SecurityEventType.PRIVILEGE_ESCALATION,
          severity: SecuritySeverity.HIGH
        })
      )
    })

    it('should integrate with error monitoring for high/critical events', () => {
      logSecurityEvent(
        SecurityEventType.SQL_INJECTION_ATTEMPT,
        SecuritySeverity.CRITICAL,
        { payload: "'; DROP TABLE users; --" }
      )

      jest.advanceTimersByTime(6000)

      expect(mockErrorMonitoring.captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'security',
          severity: SecuritySeverity.CRITICAL
        })
      )
    })

    it('should not send low severity events to error monitoring', () => {
      logSecurityEvent(
        SecurityEventType.LOGIN_SUCCESS,
        SecuritySeverity.LOW,
        { email: 'test@example.com' }
      )

      jest.advanceTimersByTime(6000)

      expect(mockErrorMonitoring.captureError).not.toHaveBeenCalled()
    })
  })

  describe('Real-world Security Scenarios', () => {
    it('should handle account takeover attempt scenario', () => {
      const targetEmail = 'victim@example.com'
      const attackerIp = '192.168.1.666'

      // Multiple failed login attempts
      for (let i = 0; i < 7; i++) {
        trackLogin(targetEmail, false, attackerIp, {
          attemptNumber: i + 1,
          userAgent: 'AttackerBot/1.0'
        })
      }

      // Password change from different IP after brute force
      logSecurityEvent(
        SecurityEventType.PASSWORD_CHANGE,
        SecuritySeverity.HIGH,
        {
          email: targetEmail,
          newIpAddress: attackerIp,
          previousIpAddress: '192.168.1.100'
        }
      )

      jest.advanceTimersByTime(6000)

      // Should detect brute force
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('security.brute_force'),
        expect.anything()
      )

      // Should log password change
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('auth.password.change'),
        expect.anything()
      )
    })

    it('should handle insider threat scenario', () => {
      const insiderUserId = 'insider-456'

      // Unusual data access patterns
      const sensitiveResources = [
        'salary_data',
        'customer_pii',
        'financial_reports',
        'strategic_plans'
      ]

      sensitiveResources.forEach((resource, index) => {
        trackDataAccess(
          insiderUserId,
          'sensitive_document',
          `doc-${resource}`,
          'export',
          true
        )
      })

      // Access during off hours
      logSecurityEvent(
        SecurityEventType.DATA_ACCESS,
        SecuritySeverity.MEDIUM,
        {
          userId: insiderUserId,
          accessTime: '03:00:00',
          normalWorkHours: '09:00-17:00',
          dataVolume: 'large'
        }
      )

      jest.advanceTimersByTime(6000)

      // Should track all sensitive data access
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('data.sensitive.access'),
        expect.anything()
      )

      // Should track off-hours access
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY EVENT]'),
        expect.stringContaining('data.access'),
        expect.objectContaining({
          accessTime: '03:00:00'
        })
      )
    })

    it('should handle compliance audit scenario', async () => {
      // Simulate various activities that need audit trail
      const activities = [
        {
          eventType: 'gdpr_request',
          action: 'data_export',
          outcome: 'success' as const,
          details: { requestType: 'right_to_portability', userId: 'user-123' }
        },
        {
          eventType: 'data_retention',
          action: 'auto_delete',
          outcome: 'success' as const,
          details: { retentionPeriod: '7_years', recordsDeleted: 150 }
        },
        {
          eventType: 'access_control',
          action: 'role_modification',
          outcome: 'success' as const,
          details: { userId: 'user-456', oldRole: 'viewer', newRole: 'editor' }
        }
      ]

      activities.forEach(activity => {
        logAuditEvent(
          activity.eventType,
          activity.action,
          activity.outcome,
          activity.details
        )
      })

      // Generate compliance report
      const report = await securityAudit.generateComplianceReport(
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        ['gdpr']
      )

      jest.advanceTimersByTime(6000)

      // Should have audit trail for all activities
      activities.forEach(activity => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[AUDIT]'),
          expect.stringContaining(`${activity.eventType}.${activity.action}`),
          expect.anything()
        )
      })

      // Should generate valid compliance report
      expect(report.standards).toContain('gdpr')
      expect(report.attestation).toHaveProperty('signature')
    })
  })
})

describe('Security Audit Convenience Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should provide easy-to-use convenience functions', () => {
    trackLogin('user@example.com', true, '127.0.0.1')
    trackDataAccess('user-123', 'document', 'doc-456', 'read')
    trackPermissionCheck('user-123', 'resource', 'read', true)

    jest.advanceTimersByTime(6000)

    expect(mockAnalytics.track).toHaveBeenCalledTimes(4) // 3 events + audit event
  })

  it('should maintain consistent API across convenience functions', () => {
    expect(() => {
      trackLogin('', true, '')
      trackDataAccess('', '', '', 'read')
      trackPermissionCheck('', '', '', false)
    }).not.toThrow()
  })
})