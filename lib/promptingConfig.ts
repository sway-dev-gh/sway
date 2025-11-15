/**
 * Frontend Configuration for Prompting Agent System
 * Client-side configuration management and constants
 */

export interface PromptingConfig {
  // Core Settings
  enabled: boolean
  maxPromptLength: number
  autoRefreshInterval: number
  realTimeEnabled: boolean

  // UI Configuration
  ui: {
    defaultTab: string
    itemsPerPage: number
    autoSave: boolean
    confirmDeletions: boolean
    showAdvancedOptions: boolean
    darkMode: boolean
    animations: boolean
    compactMode: boolean
  }

  // Prompt Configuration
  prompts: {
    maxLength: number
    minLength: number
    autoOptimization: boolean
    defaultType: string
    defaultPriority: string
    allowedTypes: string[]
    allowedPriorities: string[]
    suggestOptimizations: boolean
  }

  // Agent Configuration
  agents: {
    showOnlineStatus: boolean
    allowDirectAssignment: boolean
    showExpertiseIcons: boolean
    autoAssignmentEnabled: boolean
    loadBalancingVisible: boolean
  }

  // Permissions Configuration
  permissions: {
    roleBasedUI: boolean
    hideRestrictedFeatures: boolean
    showPermissionHints: boolean
    allowSelfPermissionView: boolean
  }

  // Notifications Configuration
  notifications: {
    enabled: boolean
    showToasts: boolean
    playSound: boolean
    emailNotifications: boolean
    browserNotifications: boolean
    urgentOnly: boolean
    types: {
      promptSubmitted: boolean
      promptApproved: boolean
      promptRejected: boolean
      agentAssigned: boolean
      promptCompleted: boolean
      permissionChanged: boolean
    }
  }

  // Activity Log Configuration
  activity: {
    autoRefresh: boolean
    refreshInterval: number
    maxItems: number
    showFilters: boolean
    defaultTimeRange: string
    groupByDate: boolean
    showMetadata: boolean
  }

  // API Configuration
  api: {
    baseUrl: string
    timeout: number
    retries: number
    rateLimitWarning: boolean
  }

  // Development Configuration
  development: {
    debug: boolean
    mockData: boolean
    showDebugInfo: boolean
    logLevel: string
  }
}

// Default configuration
const defaultConfig: PromptingConfig = {
  enabled: true,
  maxPromptLength: 4000,
  autoRefreshInterval: 30000, // 30 seconds
  realTimeEnabled: true,

  ui: {
    defaultTab: 'overview',
    itemsPerPage: 10,
    autoSave: true,
    confirmDeletions: true,
    showAdvancedOptions: false,
    darkMode: false,
    animations: true,
    compactMode: false
  },

  prompts: {
    maxLength: 4000,
    minLength: 10,
    autoOptimization: true,
    defaultType: 'general',
    defaultPriority: 'medium',
    allowedTypes: [
      'general',
      'code_review',
      'documentation',
      'bug_fix',
      'optimization',
      'testing',
      'architecture',
      'security'
    ],
    allowedPriorities: ['low', 'medium', 'high', 'urgent'],
    suggestOptimizations: true
  },

  agents: {
    showOnlineStatus: true,
    allowDirectAssignment: true,
    showExpertiseIcons: true,
    autoAssignmentEnabled: true,
    loadBalancingVisible: false
  },

  permissions: {
    roleBasedUI: true,
    hideRestrictedFeatures: true,
    showPermissionHints: true,
    allowSelfPermissionView: true
  },

  notifications: {
    enabled: true,
    showToasts: true,
    playSound: false,
    emailNotifications: false,
    browserNotifications: false,
    urgentOnly: false,
    types: {
      promptSubmitted: true,
      promptApproved: true,
      promptRejected: true,
      agentAssigned: true,
      promptCompleted: true,
      permissionChanged: true
    }
  },

  activity: {
    autoRefresh: true,
    refreshInterval: 30000,
    maxItems: 50,
    showFilters: true,
    defaultTimeRange: 'day',
    groupByDate: true,
    showMetadata: true
  },

  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
    retries: 3,
    rateLimitWarning: true
  },

  development: {
    debug: process.env.NODE_ENV === 'development',
    mockData: process.env.NEXT_PUBLIC_MOCK_DATA === 'true',
    showDebugInfo: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  }
}

// Configuration management class
class PromptingConfigManager {
  private config: PromptingConfig
  private listeners: ((config: PromptingConfig) => void)[] = []

  constructor(initialConfig?: Partial<PromptingConfig>) {
    this.config = { ...defaultConfig, ...initialConfig }
    this.loadFromStorage()
  }

  // Load configuration from localStorage
  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('promptingConfig')
        if (stored) {
          const storedConfig = JSON.parse(stored)
          this.config = { ...this.config, ...storedConfig }
        }
      } catch (error) {
        console.warn('Failed to load prompting config from storage:', error)
      }
    }
  }

  // Save configuration to localStorage
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('promptingConfig', JSON.stringify(this.config))
      } catch (error) {
        console.warn('Failed to save prompting config to storage:', error)
      }
    }
  }

  // Get full configuration
  getConfig(): PromptingConfig {
    return { ...this.config }
  }

  // Get specific configuration value
  get<K extends keyof PromptingConfig>(key: K): PromptingConfig[K] {
    return this.config[key]
  }

  // Set configuration value
  set<K extends keyof PromptingConfig>(key: K, value: PromptingConfig[K]): void {
    this.config[key] = value
    this.saveToStorage()
    this.notifyListeners()
  }

  // Update multiple configuration values
  update(updates: Partial<PromptingConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveToStorage()
    this.notifyListeners()
  }

  // Reset to defaults
  reset(): void {
    this.config = { ...defaultConfig }
    this.saveToStorage()
    this.notifyListeners()
  }

  // Subscribe to configuration changes
  subscribe(listener: (config: PromptingConfig) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners of configuration changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config))
  }

  // Validate configuration
  validate(): string[] {
    const errors: string[] = []

    if (this.config.maxPromptLength < 10 || this.config.maxPromptLength > 50000) {
      errors.push('Max prompt length must be between 10 and 50000 characters')
    }

    if (this.config.autoRefreshInterval < 5000) {
      errors.push('Auto refresh interval must be at least 5 seconds')
    }

    if (!this.config.prompts.allowedTypes.includes(this.config.prompts.defaultType)) {
      errors.push('Default prompt type must be in allowed types list')
    }

    if (!this.config.prompts.allowedPriorities.includes(this.config.prompts.defaultPriority)) {
      errors.push('Default priority must be in allowed priorities list')
    }

    return errors
  }

  // Export configuration for debugging
  export(): string {
    return JSON.stringify(this.config, null, 2)
  }

  // Import configuration from JSON
  import(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson)
      this.update(importedConfig)
    } catch (error) {
      throw new Error('Invalid configuration JSON')
    }
  }
}

// Create singleton instance
const promptingConfigManager = new PromptingConfigManager()

// Export utilities
export { defaultConfig, promptingConfigManager }

// Helper hooks and utilities for React components
export const usePromptingConfig = () => {
  return promptingConfigManager
}

export const getPromptingConfig = () => {
  return promptingConfigManager.getConfig()
}

// Constants for common values
export const PROMPT_TYPES = [
  { value: 'general', label: 'General', icon: '', description: 'General purpose prompts' },
  { value: 'code_review', label: 'Code Review', icon: '', description: 'Code review and analysis' },
  { value: 'documentation', label: 'Documentation', icon: '', description: 'Documentation generation' },
  { value: 'bug_fix', label: 'Bug Fix', icon: '', description: 'Bug fixing assistance' },
  { value: 'optimization', label: 'Optimization', icon: '', description: 'Performance optimization' },
  { value: 'testing', label: 'Testing', icon: '', description: 'Test generation and validation' },
  { value: 'architecture', label: 'Architecture', icon: '', description: 'System architecture design' },
  { value: 'security', label: 'Security', icon: '', description: 'Security analysis and fixes' }
]

export const PROMPT_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-green-400', description: 'Can wait, no urgency' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400', description: 'Standard priority' },
  { value: 'high', label: 'High', color: 'text-orange-400', description: 'Important, needs attention' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400', description: 'Critical, immediate attention' }
]

export const PROMPT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-400', icon: '' },
  { value: 'agent_review', label: 'Under Review', color: 'text-blue-400', icon: '' },
  { value: 'optimized', label: 'Optimized', color: 'text-purple-400', icon: '' },
  { value: 'approved', label: 'Approved', color: 'text-green-400', icon: '' },
  { value: 'executed', label: 'Executed', color: 'text-cyan-400', icon: '' },
  { value: 'completed', label: 'Completed', color: 'text-terminal-text', icon: '' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-400', icon: '' }
]

export const AGENT_STATUSES = [
  { value: 'active', label: 'Active', color: 'text-green-400', icon: '' },
  { value: 'busy', label: 'Busy', color: 'text-yellow-400', icon: '' },
  { value: 'inactive', label: 'Inactive', color: 'text-red-400', icon: '' }
]

export const PERMISSION_ROLES = [
  { value: 'viewer', label: 'Viewer', description: 'View dashboard and logs' },
  { value: 'reviewer', label: 'Reviewer', description: 'Review and edit prompts' },
  { value: 'approver', label: 'Approver', description: 'Approve and reject prompts' },
  { value: 'agent', label: 'Agent', description: 'Full agent capabilities' },
  { value: 'admin', label: 'Administrator', description: 'Full system access' }
]