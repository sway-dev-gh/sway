const axios = require('axios')
const { config } = require('../config/promptingConfig')

/**
 * Prompting AI Service for handling OpenAI API interactions for the Prompting Agent System
 * Separate from the existing aiService.js which handles Sway's file workflow features
 */

class PromptingAIService {
  constructor() {
    this.config = config.getAIConfig()
    this.apiClient = this.createAPIClient()
    this.requestQueue = new Map() // Track concurrent requests
    this.rateLimitInfo = {
      remaining: 1000,
      reset: Date.now() + 3600000, // 1 hour
      lastReset: Date.now()
    }
  }

  createAPIClient() {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required for prompting features')
    }

    const baseURL = this.config.provider === 'openai'
      ? 'https://api.openai.com/v1'
      : null

    if (!baseURL) {
      throw new Error(`Unsupported AI provider: ${this.config.provider}`)
    }

    return axios.create({
      baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SwayFiles-PromptingAgent/1.0'
      }
    })
  }

  /**
   * Execute a prompt through the AI service
   * @param {Object} promptData - The prompt data to execute
   * @returns {Object} - Execution result with response and metadata
   */
  async executePrompt(promptData) {
    const startTime = Date.now()

    try {
      // Validate prompt data
      this.validatePromptData(promptData)

      // Check rate limits
      await this.checkRateLimits()

      // Check concurrent request limits
      await this.manageConcurrency(promptData.id)

      // Prepare the AI request
      const aiRequest = this.prepareAIRequest(promptData)

      // Execute with retry logic
      const aiResponse = await this.executeWithRetry(aiRequest, promptData.id)

      // Process and validate response
      const executionResult = this.processAIResponse(aiResponse, promptData, startTime)

      // Log successful execution
      await this.logExecution(promptData, executionResult, 'success')

      return executionResult

    } catch (error) {
      // Log failed execution
      const failureResult = {
        success: false,
        error: error.message,
        errorCode: error.code || 'AI_EXECUTION_ERROR',
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }

      await this.logExecution(promptData, failureResult, 'failure')
      throw error
    } finally {
      // Clean up concurrent request tracking
      this.requestQueue.delete(promptData.id)
    }
  }

  validatePromptData(promptData) {
    if (!promptData) {
      throw new Error('Prompt data is required')
    }

    if (!promptData.id) {
      throw new Error('Prompt ID is required')
    }

    if (!promptData.optimized_prompt && !promptData.original_prompt) {
      throw new Error('Prompt text is required (optimized_prompt or original_prompt)')
    }

    const promptText = promptData.optimized_prompt || promptData.original_prompt
    const maxLength = config.get('maxPromptLength') || 4000

    if (promptText.length > maxLength) {
      throw new Error(`Prompt exceeds maximum length of ${maxLength} characters`)
    }

    if (promptText.trim().length < 5) {
      throw new Error('Prompt is too short (minimum 5 characters)')
    }
  }

  async checkRateLimits() {
    const now = Date.now()

    // Reset rate limit counter if needed
    if (now >= this.rateLimitInfo.reset) {
      this.rateLimitInfo.remaining = 1000
      this.rateLimitInfo.reset = now + 3600000 // Reset in 1 hour
      this.rateLimitInfo.lastReset = now
    }

    if (this.rateLimitInfo.remaining <= 0) {
      const resetIn = Math.ceil((this.rateLimitInfo.reset - now) / 1000)
      throw new Error(`Rate limit exceeded. Reset in ${resetIn} seconds`)
    }

    this.rateLimitInfo.remaining--
  }

  async manageConcurrency(promptId) {
    const maxConcurrent = config.get('maxConcurrentRequests') || 10

    if (this.requestQueue.size >= maxConcurrent) {
      throw new Error(`Maximum concurrent requests (${maxConcurrent}) exceeded`)
    }

    this.requestQueue.set(promptId, {
      startTime: Date.now(),
      status: 'executing'
    })
  }

  prepareAIRequest(promptData) {
    const promptText = promptData.optimized_prompt || promptData.original_prompt
    const systemMessage = this.buildSystemMessage(promptData)

    const request = {
      model: this.config.model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: promptText }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      presence_penalty: 0.0,
      frequency_penalty: 0.0,
      user: promptData.user_id
    }

    // Add additional context if available
    if (promptData.context_metadata) {
      try {
        const metadata = typeof promptData.context_metadata === 'string'
          ? JSON.parse(promptData.context_metadata)
          : promptData.context_metadata

        if (metadata.files || metadata.codeContext) {
          request.messages.unshift({
            role: 'system',
            content: `Additional context: ${JSON.stringify(metadata)}`
          })
        }
      } catch (error) {
        console.warn('Failed to parse context metadata:', error)
      }
    }

    return request
  }

  buildSystemMessage(promptData) {
    const promptType = promptData.prompt_type || 'general'
    const priority = promptData.priority || 'medium'

    let systemMessage = 'You are an AI assistant helping with software development and code analysis. '

    switch (promptType) {
      case 'code_review':
        systemMessage += 'Focus on code quality, best practices, security issues, performance optimizations, and maintainability. Provide specific, actionable feedback with examples.'
        break
      case 'documentation':
        systemMessage += 'Generate clear, comprehensive documentation. Include examples, usage instructions, and important notes. Structure content logically.'
        break
      case 'bug_fix':
        systemMessage += 'Analyze the issue carefully and provide specific solutions. Include explanations of why the bug occurs and how the fix resolves it.'
        break
      case 'optimization':
        systemMessage += 'Focus on performance improvements, efficiency gains, and resource optimization. Suggest measurable improvements with benchmarks when possible.'
        break
      case 'testing':
        systemMessage += 'Generate comprehensive test cases, including edge cases, error conditions, and integration scenarios. Provide test data examples.'
        break
      case 'architecture':
        systemMessage += 'Provide architectural guidance focusing on scalability, maintainability, and best practices. Consider system design patterns and trade-offs.'
        break
      case 'security':
        systemMessage += 'Analyze security implications, identify vulnerabilities, and suggest secure coding practices. Be thorough and specific about threats and mitigations.'
        break
      default:
        systemMessage += 'Provide helpful, accurate, and practical assistance. Be specific and actionable in your responses.'
    }

    if (priority === 'urgent' || priority === 'high') {
      systemMessage += ' This is a high-priority request requiring immediate attention and detailed analysis.'
    }

    systemMessage += ' Always provide clear, well-structured responses with practical examples when applicable. Format code using appropriate syntax highlighting.'

    return systemMessage
  }

  async executeWithRetry(aiRequest, promptId) {
    let lastError = null
    let attempt = 1
    const maxRetries = this.config.retries || 3

    while (attempt <= maxRetries) {
      try {
        console.log(`[PromptingAI] Attempt ${attempt}/${maxRetries} for prompt ${promptId}`)

        const response = await this.apiClient.post('/chat/completions', aiRequest)

        this.updateRateLimitInfo(response.headers)
        console.log(`[PromptingAI] Successfully executed prompt ${promptId}`)

        return response.data
      } catch (error) {
        lastError = error
        console.error(`[PromptingAI] Attempt ${attempt} failed for prompt ${promptId}:`, error.message)

        if (this.shouldNotRetry(error)) {
          throw error
        }

        if (attempt < maxRetries) {
          const delay = Math.min((this.config.retryDelay || 1000) * Math.pow(2, attempt - 1), 30000)
          console.log(`[PromptingAI] Retrying in ${delay}ms...`)
          await this.sleep(delay)
        }

        attempt++
      }
    }

    throw new Error(`AI request failed after ${maxRetries} attempts: ${lastError.message}`)
  }

  shouldNotRetry(error) {
    const noRetryStatuses = [400, 401, 403, 413, 422]
    return error.response && noRetryStatuses.includes(error.response.status)
  }

  updateRateLimitInfo(headers) {
    if (headers['x-ratelimit-remaining']) {
      this.rateLimitInfo.remaining = parseInt(headers['x-ratelimit-remaining'])
    }
    if (headers['x-ratelimit-reset']) {
      this.rateLimitInfo.reset = parseInt(headers['x-ratelimit-reset']) * 1000
    }
  }

  processAIResponse(aiResponse, promptData, startTime) {
    if (!aiResponse.choices || aiResponse.choices.length === 0) {
      throw new Error('No response choices returned from AI service')
    }

    const choice = aiResponse.choices[0]
    if (!choice.message || !choice.message.content) {
      throw new Error('Invalid response format from AI service')
    }

    const executionTime = Date.now() - startTime
    const tokensUsed = aiResponse.usage ? aiResponse.usage.total_tokens : 0

    return {
      success: true,
      response: choice.message.content.trim(),
      model: aiResponse.model,
      tokensUsed,
      executionTime,
      finishReason: choice.finish_reason,
      rateLimitRemaining: this.rateLimitInfo.remaining,
      timestamp: new Date().toISOString(),
      metadata: {
        promptType: promptData.prompt_type,
        priority: promptData.priority,
        userId: promptData.user_id,
        promptId: promptData.id
      }
    }
  }

  async logExecution(promptData, result, status) {
    try {
      const pool = require('../db/pool')

      const logQuery = `
        INSERT INTO prompting_logs (
          workspace_id, prompt_id, user_id, action, description,
          workflow_context, activity_pattern, metadata
        ) VALUES ($1::UUID, $2::UUID, $3::UUID, $4, $5, $6, $7, $8)
      `

      const logValues = [
        promptData.workspace_id,
        promptData.id,
        promptData.user_id,
        status === 'success' ? 'ai_executed' : 'ai_execution_failed',
        status === 'success'
          ? `AI successfully executed prompt (${result.tokensUsed} tokens, ${result.executionTime}ms)`
          : `AI execution failed: ${result.error}`,
        'ai_execution',
        'automated_workflow',
        JSON.stringify({
          status,
          model: result.model || this.config.model,
          tokensUsed: result.tokensUsed || 0,
          executionTime: result.executionTime || 0,
          error: status === 'failure' ? result.error : null,
          promptType: promptData.prompt_type,
          priority: promptData.priority
        })
      ]

      await pool.query(logQuery, logValues)
    } catch (error) {
      console.error('[PromptingAI] Failed to log execution:', error)
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getStatus() {
    return {
      provider: this.config.provider,
      model: this.config.model,
      activeRequests: this.requestQueue.size,
      maxConcurrent: config.get('maxConcurrentRequests') || 10,
      rateLimitRemaining: this.rateLimitInfo.remaining,
      rateLimitReset: new Date(this.rateLimitInfo.reset).toISOString(),
      lastActivity: this.rateLimitInfo.lastReset ? new Date(this.rateLimitInfo.lastReset).toISOString() : null,
      isConfigured: !!this.config.apiKey
    }
  }

  async testConnection() {
    try {
      const testRequest = {
        model: this.config.model,
        messages: [{ role: 'user', content: 'Test connection. Respond with "Connection successful".' }],
        max_tokens: 20,
        temperature: 0
      }

      const response = await this.apiClient.post('/chat/completions', testRequest)

      return {
        success: true,
        model: response.data.model,
        responseTime: Date.now(),
        tokensUsed: response.data.usage?.total_tokens || 0,
        response: response.data.choices[0]?.message?.content || 'No response'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data || null
      }
    }
  }
}

// Create singleton instance
let promptingAIService = null

function getPromptingAIService() {
  if (!promptingAIService) {
    try {
      promptingAIService = new PromptingAIService()
    } catch (error) {
      console.warn('[PromptingAI] Failed to initialize service:', error.message)
      // Return a mock service if configuration is missing
      return {
        executePrompt: async () => {
          throw new Error('Prompting AI service not configured. Please set OPENAI_API_KEY.')
        },
        getStatus: () => ({
          provider: 'openai',
          model: 'not-configured',
          isConfigured: false,
          error: 'Missing API key'
        }),
        testConnection: async () => ({
          success: false,
          error: 'Service not configured'
        })
      }
    }
  }
  return promptingAIService
}

// Export both class and singleton
module.exports = {
  PromptingAIService,
  getPromptingAIService
}