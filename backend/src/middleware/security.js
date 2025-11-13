/**
 * Comprehensive Security Middleware
 * Stripe-level security headers and protections
 */

const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const slowDown = require('express-slow-down');

// CORS configuration for production and development
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl requests, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      // Development
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',

      // Production
      'https://swayfiles.com',
      'https://www.swayfiles.com',
      'https://api.swayfiles.com'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With'
  ],
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200 // Support legacy browsers
};

// Content Security Policy configuration
const cspDirectives = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
  fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
  imgSrc: ["'self'", "data:", "blob:", "*.gravatar.com", "*.amazonaws.com"],
  scriptSrc: ["'self'", "'strict-dynamic'"],
  connectSrc: [
    "'self'",
    "*.swayfiles.com",
    "api.swayfiles.com",
    "wss:", "ws:"
  ],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'", "blob:"],
  formAction: ["'self'"],
  baseUri: ["'self'"]
};

// Helmet configuration for comprehensive security headers
const helmetOptions = {
  contentSecurityPolicy: {
    directives: cspDirectives,
    reportOnly: false
  },
  crossOriginEmbedderPolicy: false, // Disable for file uploads
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
  },
  permittedCrossDomainPolicies: false,
  dnsPrefetchControl: {
    allow: false
  }
};

// Rate limiting for general API abuse
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  validate: { delayMs: false } // Disable delayMs warning
});

// Request size limiting
const requestSizeLimit = (req, res, next) => {
  // Set different limits based on endpoint
  if (req.path.includes('/upload')) {
    req.sizeLimit = '100mb'; // Large limit for file uploads
  } else if (req.path.includes('/projects')) {
    req.sizeLimit = '10mb';  // Medium limit for project data
  } else {
    req.sizeLimit = '1mb';   // Default limit for other endpoints
  }
  next();
};

// IP whitelist for admin endpoints (optional)
const ipWhitelist = (req, res, next) => {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const adminEndpoints = ['/api/admin', '/api/analytics'];
  const isAdminEndpoint = adminEndpoints.some(endpoint => req.path.startsWith(endpoint));

  if (isAdminEndpoint) {
    const allowedIPs = (process.env.ADMIN_IPS || '').split(',').filter(Boolean);
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({ error: 'Access denied from this IP address' });
    }
  }

  next();
};

// Security event logging middleware
const securityLogger = (req, res, next) => {
  // Log suspicious activity
  const suspiciousPatterns = [
    /\.\./,                    // Directory traversal
    /union.*select/i,          // SQL injection attempt
    /<script/i,               // XSS attempt
    /eval\(/i,                // Code injection
    /javascript:/i,           // Protocol smuggling
    /vbscript:/i,            // VBScript injection
    /onload\s*=/i,           // Event handler injection
  ];

  const userAgent = req.get('User-Agent') || '';
  const referer = req.get('Referer') || '';
  const requestData = JSON.stringify(req.body || {});
  const url = req.originalUrl || req.url;

  const isSuspicious = suspiciousPatterns.some(pattern =>
    pattern.test(url) ||
    pattern.test(userAgent) ||
    pattern.test(referer) ||
    pattern.test(requestData)
  );

  if (isSuspicious) {
    console.warn('🚨 SECURITY ALERT: Suspicious request detected', {
      ip: req.ip,
      userAgent,
      url,
      referer,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Main security middleware function
const applySecurity = (app) => {
  // Trust proxy (for proper IP detection behind reverse proxy)
  app.set('trust proxy', 1);

  // Basic security headers
  app.use(helmet(helmetOptions));

  // CORS protection
  app.use(cors(corsOptions));

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // Data sanitization against NoSQL injection
  app.use(mongoSanitize({
    replaceWith: '_'
  }));

  // Request size limiting
  app.use(requestSizeLimit);

  // Rate limiting with progressive delays
  app.use('/api', speedLimiter);

  // IP whitelist for sensitive endpoints
  app.use(ipWhitelist);

  // Security event logging
  app.use(securityLogger);

  // Hide powered by Express
  app.disable('x-powered-by');

  console.log('🛡️  Security middleware applied successfully');
};

module.exports = {
  applySecurity,
  corsOptions,
  helmetOptions,
  speedLimiter,
  requestSizeLimit,
  ipWhitelist,
  securityLogger
};