const path = require('path')

/**
 * Prompting Agent System Configuration
 * Centralized configuration management for all prompting-related settings
 */

class PromptingConfig {
  constructor() {
    this.config = {
      // Core prompting system settings
      enabled: process.env.PROMPTING_ENABLED === 'true',
      defaultModel: process.env.PROMPTING_DEFAULT_MODEL || 'gpt-4',
      maxPromptLength: parseInt(process.env.PROMPTING_MAX_PROMPT_LENGTH) || 4000,
      autoApproveSimple: process.env.PROMPTING_AUTO_APPROVE_SIMPLE === 'true',
      requireAgentReview: process.env.PROMPTING_REQUIRE_AGENT_REVIEW !== 'false',
      defaultTimeout: parseInt(process.env.PROMPTING_DEFAULT_TIMEOUT) || 30000,
      maxConcurrentRequests: parseInt(process.env.PROMPTING_MAX_CONCURRENT_REQUESTS) || 10,

      // AI Model Configuration
      ai: {
        provider: process.env.AI_PROVIDER || 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
        timeout: parseInt(process.env.AI_REQUEST_TIMEOUT) || 60000,
        retries: parseInt(process.env.AI_MAX_RETRIES) || 3,
        retryDelay: parseInt(process.env.AI_RETRY_DELAY) || 1000
      },

      // Agent Configuration
      agents: {
        responseTimeout: parseInt(process.env.AGENT_RESPONSE_TIMEOUT) || 60000,
        maxWorkspaces: parseInt(process.env.AGENT_MAX_WORKSPACES) || 5,
        defaultExpertise: (process.env.AGENT_DEFAULT_EXPERTISE || 'general,code_review').split(','),
        autoAssignment: process.env.AGENT_AUTO_ASSIGNMENT !== 'false',
        loadBalancing: process.env.AGENT_LOAD_BALANCING || 'round_robin', // round_robin, least_loaded, expertise_match
        healthCheckInterval: parseInt(process.env.AGENT_HEALTH_CHECK_INTERVAL) || 300000 // 5 minutes
      },

      // Workflow Configuration
      workflow: {
        stages: ['pending', 'agent_review', 'optimized', 'approved', 'executed', 'completed', 'rejected'],
        timeouts: {
          pending: parseInt(process.env.WORKFLOW_PENDING_TIMEOUT) || 3600000, // 1 hour
          agent_review: parseInt(process.env.WORKFLOW_REVIEW_TIMEOUT) || 1800000, // 30 minutes
          optimized: parseInt(process.env.WORKFLOW_OPTIMIZED_TIMEOUT) || 900000, // 15 minutes
          approved: parseInt(process.env.WORKFLOW_APPROVED_TIMEOUT) || 300000, // 5 minutes
          executed: parseInt(process.env.WORKFLOW_EXECUTED_TIMEOUT) || 60000 // 1 minute
        },
        notifications: {
          enabled: process.env.WORKFLOW_NOTIFICATIONS_ENABLED !== 'false',
          channels: ['email', 'websocket', 'slack'].filter(channel =>
            process.env[`WORKFLOW_NOTIFICATIONS_${channel.toUpperCase()}`] !== 'false'
          ),
          urgentOnly: process.env.WORKFLOW_NOTIFICATIONS_URGENT_ONLY === 'true'
        }
      },

      // Security and Permissions
      security: {
        encryptPrompts: process.env.ENCRYPT_PROMPTS === 'true',
        auditLogging: process.env.AUDIT_LOGGING !== 'false',
        maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
        requireMfa: process.env.REQUIRE_MFA === 'true',
        ipWhitelist: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
        rateLimiting: {
          enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 900000, // 15 minutes
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
          perUser: parseInt(process.env.RATE_LIMIT_PER_USER) || 10,
          perAgent: parseInt(process.env.RATE_LIMIT_PER_AGENT) || 50
        }
      },

      // Database Configuration
      database: {
        connectionString: process.env.DATABASE_URL,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME || 'sway_dev',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true',
        poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
        poolMax: parseInt(process.env.DB_POOL_MAX) || 20,
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000
      },

      // Logging and Monitoring
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        enableConsole: process.env.LOG_CONSOLE !== 'false',
        enableFile: process.env.LOG_FILE === 'true',
        filePath: process.env.LOG_FILE_PATH || path.join(__dirname, '../../logs'),
        maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10MB',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        enableDatabase: process.env.LOG_DATABASE === 'true'
      },

      // External Services
      services: {
        email: {
          enabled: process.env.EMAIL_ENABLED === 'true',
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          user: process.env.SMTP_USER,
          password: process.env.SMTP_PASS,
          from: process.env.SMTP_FROM || 'noreply@swayfiles.com'
        },
        slack: {
          enabled: process.env.SLACK_ENABLED === 'true',
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#prompting-alerts',
          username: process.env.SLACK_USERNAME || 'Prompting Agent',
          iconEmoji: process.env.SLACK_ICON_EMOJI || ':robot_face:'
        },
        analytics: {
          enabled: process.env.ANALYTICS_ENABLED === 'true',
          apiKey: process.env.ANALYTICS_API_KEY,
          endpoint: process.env.ANALYTICS_ENDPOINT,
          batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE) || 100,
          flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL) || 10000 // 10 seconds
        }
      },

      // Development and Testing
      development: {
        debug: process.env.DEBUG === 'true',
        mockAI: process.env.MOCK_AI === 'true',
        mockAgents: process.env.MOCK_AGENTS === 'true',
        seedData: process.env.SEED_DATA === 'true',
        hotReload: process.env.HOT_RELOAD === 'true',
        testMode: process.env.NODE_ENV === 'test'
      }
    }

    // Validate critical configuration
    this.validate()
  }

  validate() {
    const errors = []

    // Check required environment variables
    if (!this.config.database.connectionString &&
        (!this.config.database.host || !this.config.database.user)) {
      errors.push('Database configuration is incomplete. Provide DATABASE_URL or individual DB_* variables.')
    }

    if (this.config.enabled && !this.config.ai.apiKey) {
      errors.push('OPENAI_API_KEY is required when prompting is enabled.')
    }

    if (this.config.maxPromptLength < 100 || this.config.maxPromptLength > 32000) {
      errors.push('PROMPTING_MAX_PROMPT_LENGTH must be between 100 and 32000.')
    }

    if (this.config.agents.maxWorkspaces < 1 || this.config.agents.maxWorkspaces > 100) {
      errors.push('AGENT_MAX_WORKSPACES must be between 1 and 100.')
    }

    if (this.config.security.rateLimiting.maxRequests < 1) {
      errors.push('RATE_LIMIT_MAX_REQUESTS must be at least 1.')
    }

    // Validate AI model configuration
    const supportedModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o']
    if (!supportedModels.includes(this.config.ai.model)) {
      console.warn(`Warning: Unsupported AI model '${this.config.ai.model}'. Supported models: ${supportedModels.join(', ')}`)
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
    }
  }

  get(path) {
    return path.split('.').reduce((config, key) => config?.[key], this.config)
  }

  set(path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    const target = keys.reduce((config, key) => {
      if (!config[key]) config[key] = {}
      return config[key]
    }, this.config)
    target[lastKey] = value
  }

  isEnabled() {
    return this.config.enabled
  }

  isDevelopment() {
    return process.env.NODE_ENV === 'development' || this.config.development.debug
  }

  isProduction() {
    return process.env.NODE_ENV === 'production'
  }

  isTest() {
    return process.env.NODE_ENV === 'test' || this.config.development.testMode
  }

  getAIConfig() {
    return this.config.ai
  }

  getAgentConfig() {
    return this.config.agents
  }

  getWorkflowConfig() {
    return this.config.workflow
  }

  getSecurityConfig() {
    return this.config.security
  }

  getDatabaseConfig() {
    return this.config.database
  }

  getLoggingConfig() {
    return this.config.logging
  }

  // Dynamic configuration updates (for runtime changes)
  updateConfig(updates) {
    Object.keys(updates).forEach(key => {
      if (this.config.hasOwnProperty(key)) {
        this.config[key] = { ...this.config[key], ...updates[key] }
      }
    })

    // Re-validate after updates
    this.validate()
  }

  // Export configuration for debugging
  export() {
    // Clone config but hide sensitive data
    const exported = JSON.parse(JSON.stringify(this.config))

    // Mask sensitive fields
    if (exported.ai.apiKey) exported.ai.apiKey = '*'.repeat(8)
    if (exported.database.password) exported.database.password = '*'.repeat(8)
    if (exported.services.email.password) exported.services.email.password = '*'.repeat(8)

    return exported
  }
}

// Create singleton instance
const promptingConfig = new PromptingConfig()

// Export both the class and instance
module.exports = {
  PromptingConfig,
  config: promptingConfig
}