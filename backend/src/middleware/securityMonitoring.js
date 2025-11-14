/**
 * Advanced Security Monitoring and Intrusion Detection
 * Stripe-level threat detection and response
 */

const winston = require('winston');
const expressWinston = require('express-winston');
const crypto = require('crypto');
const NodeCache = require('node-cache');

// Create security-specific logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
  ),
  defaultMeta: { service: 'sway-security' },
  transports: [
    new winston.transports.File({ filename: 'logs/security-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/security-combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// In-memory caches for tracking
const threatCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL
const rateLimitCache = new NodeCache({ stdTTL: 900 }); // 15 minute TTL
const sessionCache = new NodeCache({ stdTTL: 1800 }); // 30 minute TTL

// Threat scoring system
const threatPatterns = {
  // SQL injection patterns (High threat)
  sql: {
    patterns: [
      /union.*select/i,
      /'.*or.*'.*=/i,
      /drop.*table/i,
      /insert.*into/i,
      /delete.*from/i,
      /update.*set/i,
      /'.*or.*1=1/i,
      /exec.*xp_cmdshell/i,
      /information_schema/i
    ],
    score: 100,
    action: 'block'
  },

  // XSS patterns (High threat)
  xss: {
    patterns: [
      /<script.*>.*<\/script>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i,
      /<iframe.*>/i,
      /document\.cookie/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ],
    score: 90,
    action: 'block'
  },

  // Command injection (Critical threat)
  command: {
    patterns: [
      // Skip overly aggressive patterns in development
      ...(process.env.NODE_ENV === 'production' ? [
        /;.*\|\|/,  // More specific command chaining patterns
        /`.*`/,     // Command substitution with backticks
        /\$\(.*\)/, // Command substitution with $()
      ] : []),
      /\.\.\//,
      /\/etc\/passwd/i,
      /\/bin\/sh/i,
      /cmd\.exe/i,
      /powershell/i,
      /nc\s+-/i,
      /wget\s+/i,
      /curl\s+.*>/i
    ],
    score: process.env.NODE_ENV === 'production' ? 120 : 200, // Higher threshold in dev
    action: 'block'
  },

  // Path traversal (High threat)
  traversal: {
    patterns: [
      /\.\.[\/\\]/,
      /%2e%2e/i,
      /\.\.%2f/i,
      /\.\.%5c/i,
      /%252e%252e/i
    ],
    score: 85,
    action: 'block'
  },

  // Suspicious user agents (Medium threat)
  botUserAgent: {
    patterns: [
      /sqlmap/i,
      /nikto/i,
      /burpsuite/i,
      /nessus/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /w3af/i,
      /acunetix/i,
      /appscan/i
    ],
    score: 60,
    action: 'monitor'
  },

  // Rapid requests (Medium threat)
  rapidRequests: {
    threshold: 100, // requests per minute
    score: 50,
    action: 'throttle'
  },

  // Suspicious headers (Low-Medium threat)
  suspiciousHeaders: {
    patterns: [
      /x-forwarded-for.*,.*,/i, // Multiple proxy hops
      /x-real-ip.*[^0-9.]/i, // Non-IP in real IP header
    ],
    score: 30,
    action: 'monitor'
  }
};

// GeoIP threat assessment (simplified)
const dangerousCountries = new Set(['CN', 'RU', 'KP', 'IR']);
const geoThreatScore = {
  high: ['CN', 'RU', 'KP', 'IR'],
  medium: ['PK', 'NG', 'BD'],
  low: [] // All others default to low
};

// Advanced threat detection middleware
const threatDetection = (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    const url = req.originalUrl || req.url;
    const method = req.method;
    const timestamp = new Date();

    // Create request fingerprint
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${clientIP}:${userAgent}:${method}:${url}`)
      .digest('hex')
      .substring(0, 16);

    let totalThreatScore = 0;
    let detectedThreats = [];
    let recommendedAction = 'allow';

    // Analyze all request components
    const analysisTargets = {
      url: url,
      userAgent: userAgent,
      referer: referer,
      body: JSON.stringify(req.body || {}),
      query: JSON.stringify(req.query || {}),
      headers: JSON.stringify(req.headers || {})
    };

    // Check each threat pattern
    Object.entries(threatPatterns).forEach(([threatType, config]) => {
      if (config.patterns) {
        config.patterns.forEach(pattern => {
          Object.entries(analysisTargets).forEach(([target, content]) => {
            if (pattern.test(content)) {
              totalThreatScore += config.score;
              detectedThreats.push({
                type: threatType,
                target: target,
                pattern: pattern.source,
                score: config.score,
                content: content.substring(0, 100) // First 100 chars
              });

              if (config.action === 'block') {
                recommendedAction = 'block';
              } else if (config.action === 'throttle' && recommendedAction !== 'block') {
                recommendedAction = 'throttle';
              }
            }
          });
        });
      }
    });

    // Check rate limiting
    const minuteKey = `rate_${clientIP}_${Math.floor(Date.now() / 60000)}`;
    const currentCount = rateLimitCache.get(minuteKey) || 0;
    rateLimitCache.set(minuteKey, currentCount + 1, 60);

    if (currentCount > threatPatterns.rapidRequests.threshold) {
      totalThreatScore += threatPatterns.rapidRequests.score;
      detectedThreats.push({
        type: 'rapidRequests',
        target: 'rateLimit',
        score: threatPatterns.rapidRequests.score,
        content: `${currentCount} requests in current minute`
      });
      if (recommendedAction !== 'block') {
        recommendedAction = 'throttle';
      }
    }

    // Attach threat information to request
    req.threatInfo = {
      fingerprint,
      totalScore: totalThreatScore,
      threats: detectedThreats,
      action: recommendedAction,
      timestamp
    };

    // Log high-threat requests
    if (totalThreatScore > 50) {
      securityLogger.warn('🚨 HIGH THREAT REQUEST DETECTED', {
        ip: clientIP,
        fingerprint,
        userAgent,
        url,
        method,
        threatScore: totalThreatScore,
        threats: detectedThreats,
        recommendedAction,
        timestamp
      });
    }

    // Store threat info for pattern analysis
    const threatKey = `threat_${fingerprint}`;
    const existingThreat = threatCache.get(threatKey) || { count: 0, firstSeen: timestamp };
    existingThreat.count += 1;
    existingThreat.lastSeen = timestamp;
    existingThreat.totalScore = Math.max(existingThreat.totalScore || 0, totalThreatScore);
    threatCache.set(threatKey, existingThreat);

    // Execute threat response
    const blockingThreshold = process.env.NODE_ENV === 'production' ? 100 : 500; // Much higher in dev
    if (recommendedAction === 'block' || totalThreatScore > blockingThreshold) {
      securityLogger.error('🛑 REQUEST BLOCKED - High threat score', {
        ip: clientIP,
        fingerprint,
        threatScore: totalThreatScore,
        threats: detectedThreats
      });

      return res.status(403).json({
        error: 'Request blocked for security reasons',
        code: 'SECURITY_THREAT_DETECTED'
      });
    }

    if (recommendedAction === 'throttle') {
      // Add delay for suspicious requests
      setTimeout(() => next(), 1000);
      return;
    }

    next();
  } catch (error) {
    securityLogger.error('Error in threat detection middleware', error);
    next(); // Continue on error to avoid breaking legitimate requests
  }
};

// Session anomaly detection
const sessionAnomalyDetection = (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next();
    }

    const userId = req.user.id;
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent') || '';
    const sessionKey = `session_${userId}`;

    const currentSession = sessionCache.get(sessionKey) || {
      ips: new Set(),
      userAgents: new Set(),
      firstSeen: new Date(),
      requestCount: 0,
      suspiciousActivity: []
    };

    // Track session information
    currentSession.ips.add(clientIP);
    currentSession.userAgents.add(userAgent);
    currentSession.requestCount += 1;
    currentSession.lastActivity = new Date();

    // Detect anomalies
    const anomalies = [];

    // Multiple IPs for same session
    if (currentSession.ips.size > 3) {
      anomalies.push({
        type: 'multiple_ips',
        severity: 'medium',
        details: `Session accessed from ${currentSession.ips.size} different IPs`
      });
    }

    // Multiple user agents
    if (currentSession.userAgents.size > 2) {
      anomalies.push({
        type: 'multiple_user_agents',
        severity: 'low',
        details: `Session used ${currentSession.userAgents.size} different user agents`
      });
    }

    // High request frequency
    const sessionDuration = (new Date() - currentSession.firstSeen) / 1000; // seconds
    const requestsPerSecond = currentSession.requestCount / sessionDuration;
    if (requestsPerSecond > 10) {
      anomalies.push({
        type: 'high_frequency',
        severity: 'high',
        details: `${requestsPerSecond.toFixed(2)} requests per second`
      });
    }

    // Add anomalies to current session
    currentSession.suspiciousActivity.push(...anomalies);

    // Update cache
    sessionCache.set(sessionKey, currentSession);

    // Log significant anomalies
    if (anomalies.length > 0) {
      securityLogger.warn('🔍 SESSION ANOMALY DETECTED', {
        userId,
        sessionKey,
        anomalies,
        sessionStats: {
          ips: Array.from(currentSession.ips),
          userAgents: Array.from(currentSession.userAgents),
          requestCount: currentSession.requestCount,
          duration: sessionDuration
        }
      });
    }

    // Take action on high-severity anomalies
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      // Could implement session termination here
      securityLogger.error('🚨 HIGH SEVERITY SESSION ANOMALY', {
        userId,
        anomalies: highSeverityAnomalies
      });
    }

    next();
  } catch (error) {
    securityLogger.error('Error in session anomaly detection', error);
    next();
  }
};

// Request logging middleware with security context
const securityRequestLogger = expressWinston.logger({
  winstonInstance: securityLogger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  expressFormat: false,
  colorize: false,
  skip: (req, res) => {
    // In production, only log if there are threats or errors
    if (process.env.NODE_ENV === 'production') {
      const hasThreats = req.threatInfo && req.threatInfo.totalScore > 0;
      const isError = res.statusCode >= 400;
      return !hasThreats && !isError;
    }
    return false; // Log everything in development
  },
  requestFilter: (req, propName) => {
    // Exclude sensitive data from logs
    if (propName === 'headers') {
      const filteredHeaders = { ...req.headers };
      delete filteredHeaders.authorization;
      delete filteredHeaders.cookie;
      return filteredHeaders;
    }
    return req[propName];
  },
  dynamicMeta: (req, res) => {
    return {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      threatInfo: req.threatInfo,
      userId: req.user ? req.user.id : null
    };
  }
});

// Security metrics collection
const collectSecurityMetrics = () => {
  const metrics = {
    timestamp: new Date(),
    threatCacheSize: threatCache.keys().length,
    rateLimitCacheSize: rateLimitCache.keys().length,
    sessionCacheSize: sessionCache.keys().length,
    highThreatRequests: 0,
    blockedRequests: 0,
    activeThreats: []
  };

  // Analyze threat cache for active threats
  threatCache.keys().forEach(key => {
    const threat = threatCache.get(key);
    if (threat && threat.totalScore > 70) {
      metrics.highThreatRequests += threat.count;
      metrics.activeThreats.push({
        fingerprint: key,
        score: threat.totalScore,
        count: threat.count,
        firstSeen: threat.firstSeen,
        lastSeen: threat.lastSeen
      });
    }
  });

  // Only log metrics in development or if there are actual threats
  if (process.env.NODE_ENV !== 'production' || metrics.activeThreats.length > 0 || metrics.blockedRequests > 0) {
    securityLogger.info('📊 Security Metrics', metrics);
  }
  return metrics;
};

// Cleanup old cache entries periodically
const cleanupCaches = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Clean old threat data
  threatCache.keys().forEach(key => {
    const threat = threatCache.get(key);
    if (threat && (now - new Date(threat.lastSeen).getTime()) > oneHour) {
      threatCache.del(key);
    }
  });

  securityLogger.info('🧹 Security cache cleanup completed');
};

// Start periodic tasks - reduced frequency in production
const metricsInterval = process.env.NODE_ENV === 'production' ? 30 * 60 * 1000 : 5 * 60 * 1000; // 30 min in prod, 5 min in dev
setInterval(collectSecurityMetrics, metricsInterval);
setInterval(cleanupCaches, 60 * 60 * 1000); // Every hour

module.exports = {
  threatDetection,
  sessionAnomalyDetection,
  securityRequestLogger,
  securityLogger,
  collectSecurityMetrics,
  cleanupCaches,
  threatCache,
  rateLimitCache,
  sessionCache
};