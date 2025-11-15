const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')

// Configure multer for file upload handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10
  },
  fileFilter: (req, file, cb) => {
    // Allow text files, markdown, JSON, YAML
    const allowedTypes = ['.txt', '.md', '.json', '.yaml', '.yml']
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only .txt, .md, .json, .yaml, .yml files are allowed.'))
    }
  }
})

// Helper function to log activity
const logActivity = async (userId, action, resourceType, resourceId, metadata = {}) => {
  try {
    await pool.query(
      `INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, resourceType, resourceId, JSON.stringify(metadata)]
    )
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

// GET /api/prompts - Get user's prompts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    // Get prompts from the prompts table (simplified structure)
    const query = `
      SELECT
        p.id,
        p.title,
        p.description,
        p.prompt_type,
        p.category,
        p.status,
        p.content,
        p.versions,
        p.performance_metrics,
        p.created_at,
        p.updated_at,
        u.name as created_by_name
      FROM prompts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT 50
    `

    const result = await pool.query(query, [userId])

    // Transform the data to match frontend expectations
    const prompts = result.rows.map(prompt => ({
      ...prompt,
      performance_metrics: typeof prompt.performance_metrics === 'string'
        ? JSON.parse(prompt.performance_metrics || '{}')
        : prompt.performance_metrics || {}
    }))

    res.json({
      success: true,
      prompts
    })

  } catch (error) {
    console.error('Get prompts error:', error)

    // If prompts table doesn't exist, create it
    if (error.code === '42P01') {
      try {
        await createPromptsTable()
        // Return empty array for now
        res.json({
          success: true,
          prompts: []
        })
      } catch (createError) {
        console.error('Failed to create prompts table:', createError)
        res.status(500).json({
          error: 'Failed to fetch prompts',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
      }
    } else {
      res.status(500).json({
        error: 'Failed to fetch prompts',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
})

// POST /api/prompts - Create new prompt
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const {
      title,
      description,
      prompt_type = 'conversational',
      category = 'general',
      content = '',
      visibility = 'private'
    } = req.body

    // Input validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt title is required' })
    }

    if (!['conversational', 'instructional', 'creative', 'analytical', 'code_generation'].includes(prompt_type)) {
      return res.status(400).json({ error: 'Invalid prompt type' })
    }

    if (!['general', 'writing', 'coding', 'analysis', 'support', 'marketing'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' })
    }

    // Create prompt with initial performance metrics
    const insertQuery = `
      INSERT INTO prompts (
        user_id, title, description, prompt_type, category,
        content, status, visibility, versions, performance_metrics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const initialMetrics = {
      usage_count: 0,
      success_rate: 0,
      avg_response_time: 0
    }

    const queryParams = [
      userId,
      title.trim(),
      description?.trim() || '',
      prompt_type,
      category,
      content?.trim() || '',
      'draft',
      visibility,
      1, // Initial version
      JSON.stringify(initialMetrics)
    ]

    const result = await pool.query(insertQuery, queryParams)
    const prompt = result.rows[0]

    // Log activity
    await logActivity(userId, 'prompt_created', 'prompt', prompt.id, {
      title,
      prompt_type,
      category
    })

    // Transform response
    const responsePrompt = {
      ...prompt,
      performance_metrics: initialMetrics
    }

    res.json({
      success: true,
      prompt: responsePrompt,
      message: 'Prompt created successfully'
    })

  } catch (error) {
    console.error('Create prompt error:', error)

    // If prompts table doesn't exist, create it and retry
    if (error.code === '42P01') {
      try {
        await createPromptsTable()
        // Retry the operation
        return router.handle(req, res)
      } catch (createError) {
        console.error('Failed to create prompts table:', createError)
      }
    }

    res.status(500).json({
      error: 'Failed to create prompt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// POST /api/prompts/import-template - Import prompt templates
router.post('/import-template', authenticateToken, upload.array('template', 10), async (req, res) => {
  try {
    const userId = req.userId
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const importedPrompts = []

    for (const file of files) {
      try {
        let templateData
        const ext = path.extname(file.originalname).toLowerCase()
        const content = file.buffer.toString('utf-8')

        // Parse based on file type
        if (ext === '.json') {
          templateData = JSON.parse(content)
        } else if (ext === '.yaml' || ext === '.yml') {
          // Simple YAML parsing for basic templates
          const yaml = require('js-yaml')
          templateData = yaml.load(content)
        } else {
          // For .txt and .md files, create a simple template structure
          templateData = {
            title: path.basename(file.originalname, ext).replace(/[-_]/g, ' '),
            description: `Imported from ${file.originalname}`,
            content: content,
            prompt_type: 'conversational',
            category: 'general'
          }
        }

        // Validate template structure
        if (!templateData.title) {
          templateData.title = `Template from ${file.originalname}`
        }

        // Create prompt from template
        const insertQuery = `
          INSERT INTO prompts (
            user_id, title, description, prompt_type, category,
            content, status, visibility, versions, performance_metrics
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `

        const initialMetrics = {
          usage_count: 0,
          success_rate: 0,
          avg_response_time: 0
        }

        const queryParams = [
          userId,
          templateData.title.substring(0, 255), // Ensure title length limit
          templateData.description || `Imported from ${file.originalname}`,
          templateData.prompt_type || 'conversational',
          templateData.category || 'general',
          templateData.content || content,
          'draft',
          'private',
          1,
          JSON.stringify(initialMetrics)
        ]

        const result = await pool.query(insertQuery, queryParams)
        const prompt = result.rows[0]

        importedPrompts.push({
          ...prompt,
          performance_metrics: initialMetrics,
          source_file: file.originalname
        })

        // Log activity
        await logActivity(userId, 'prompt_imported', 'prompt', prompt.id, {
          source_file: file.originalname,
          file_type: ext
        })

      } catch (parseError) {
        console.error(`Failed to parse template file ${file.originalname}:`, parseError)
        // Continue with other files
      }
    }

    if (importedPrompts.length === 0) {
      return res.status(400).json({ error: 'No valid templates could be imported' })
    }

    res.json({
      success: true,
      imported_count: importedPrompts.length,
      prompts: importedPrompts,
      message: `Successfully imported ${importedPrompts.length} prompt template(s)`
    })

  } catch (error) {
    console.error('Import template error:', error)

    // If prompts table doesn't exist, create it
    if (error.code === '42P01') {
      try {
        await createPromptsTable()
        return res.status(400).json({
          error: 'Database initialized. Please try importing again.'
        })
      } catch (createError) {
        console.error('Failed to create prompts table:', createError)
      }
    }

    res.status(500).json({
      error: 'Failed to import templates',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// PUT /api/prompts/:id - Update prompt
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const promptId = req.params.id
    const {
      title,
      description,
      prompt_type,
      category,
      content,
      status
    } = req.body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID format' })
    }

    // Verify ownership
    const ownershipQuery = 'SELECT * FROM prompts WHERE id = $1 AND user_id = $2'
    const ownershipResult = await pool.query(ownershipQuery, [promptId, userId])

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found or access denied' })
    }

    // Build update query dynamically
    let updateQuery = 'UPDATE prompts SET updated_at = NOW()'
    const queryParams = []
    let paramIndex = 1
    const changedFields = []

    if (title !== undefined) {
      updateQuery += `, title = $${paramIndex}`
      queryParams.push(title.trim())
      changedFields.push('title')
      paramIndex++
    }

    if (description !== undefined) {
      updateQuery += `, description = $${paramIndex}`
      queryParams.push(description?.trim() || '')
      changedFields.push('description')
      paramIndex++
    }

    if (prompt_type !== undefined) {
      updateQuery += `, prompt_type = $${paramIndex}`
      queryParams.push(prompt_type)
      changedFields.push('prompt_type')
      paramIndex++
    }

    if (category !== undefined) {
      updateQuery += `, category = $${paramIndex}`
      queryParams.push(category)
      changedFields.push('category')
      paramIndex++
    }

    if (content !== undefined) {
      updateQuery += `, content = $${paramIndex}`
      queryParams.push(content?.trim() || '')
      changedFields.push('content')
      paramIndex++
    }

    if (status !== undefined) {
      updateQuery += `, status = $${paramIndex}`
      queryParams.push(status)
      changedFields.push('status')
      paramIndex++
    }

    if (queryParams.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updateQuery += ` WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`
    queryParams.push(promptId, userId)

    const result = await pool.query(updateQuery, queryParams)
    const updatedPrompt = result.rows[0]

    // Log activity
    await logActivity(userId, 'prompt_updated', 'prompt', promptId, {
      changed_fields: changedFields
    })

    // Transform response
    const responsePrompt = {
      ...updatedPrompt,
      performance_metrics: typeof updatedPrompt.performance_metrics === 'string'
        ? JSON.parse(updatedPrompt.performance_metrics || '{}')
        : updatedPrompt.performance_metrics || {}
    }

    res.json({
      success: true,
      prompt: responsePrompt,
      message: 'Prompt updated successfully'
    })

  } catch (error) {
    console.error('Update prompt error:', error)
    res.status(500).json({
      error: 'Failed to update prompt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// DELETE /api/prompts/:id - Delete prompt
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const promptId = req.params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID format' })
    }

    // Verify ownership and delete
    const deleteQuery = 'DELETE FROM prompts WHERE id = $1 AND user_id = $2 RETURNING title'
    const result = await pool.query(deleteQuery, [promptId, userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found or access denied' })
    }

    const deletedPrompt = result.rows[0]

    // Log activity
    await logActivity(userId, 'prompt_deleted', 'prompt', promptId, {
      title: deletedPrompt.title
    })

    res.json({
      success: true,
      message: 'Prompt deleted successfully'
    })

  } catch (error) {
    console.error('Delete prompt error:', error)
    res.status(500).json({
      error: 'Failed to delete prompt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// POST /api/prompts/:id/versions - Create new version
router.post('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const promptId = req.params.id
    const { content, version_note } = req.body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID format' })
    }

    // Input validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Version content is required' })
    }

    // Verify ownership
    const ownershipQuery = 'SELECT * FROM prompts WHERE id = $1 AND user_id = $2'
    const ownershipResult = await pool.query(ownershipQuery, [promptId, userId])

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found or access denied' })
    }

    const prompt = ownershipResult.rows[0]

    // Get next version number
    const versionQuery = 'SELECT MAX(version_number) as max_version FROM prompt_versions WHERE prompt_id = $1'
    const versionResult = await pool.query(versionQuery, [promptId])
    const nextVersion = (versionResult.rows[0].max_version || 0) + 1

    // Create new version
    const insertVersionQuery = `
      INSERT INTO prompt_versions (prompt_id, version_number, content, version_note, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const versionParams = [promptId, nextVersion, content.trim(), version_note || `Version ${nextVersion}`, userId]
    const newVersionResult = await pool.query(insertVersionQuery, versionParams)
    const newVersion = newVersionResult.rows[0]

    // Update prompt's current content and version count
    const updatePromptQuery = `
      UPDATE prompts
      SET content = $1, versions = $2, updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `
    const updateResult = await pool.query(updatePromptQuery, [content.trim(), nextVersion, promptId, userId])
    const updatedPrompt = updateResult.rows[0]

    // Log activity
    await logActivity(userId, 'prompt_version_created', 'prompt', promptId, {
      version_number: nextVersion,
      version_note: version_note || `Version ${nextVersion}`
    })

    res.json({
      success: true,
      version: newVersion,
      prompt: updatedPrompt,
      message: `Version ${nextVersion} created successfully`
    })

  } catch (error) {
    console.error('Create version error:', error)
    res.status(500).json({
      error: 'Failed to create version',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/prompts/:id/versions - Get version history
router.get('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const promptId = req.params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID format' })
    }

    // Verify ownership
    const ownershipQuery = 'SELECT * FROM prompts WHERE id = $1 AND user_id = $2'
    const ownershipResult = await pool.query(ownershipQuery, [promptId, userId])

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found or access denied' })
    }

    // Get version history
    const versionsQuery = `
      SELECT
        pv.*,
        u.name as created_by_name
      FROM prompt_versions pv
      LEFT JOIN users u ON pv.created_by = u.id
      WHERE pv.prompt_id = $1
      ORDER BY pv.version_number DESC
    `
    const versionsResult = await pool.query(versionsQuery, [promptId])

    res.json({
      success: true,
      versions: versionsResult.rows
    })

  } catch (error) {
    console.error('Get versions error:', error)
    res.status(500).json({
      error: 'Failed to fetch versions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/prompts/:id/versions/:version - Get specific version
router.get('/:id/versions/:version', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const promptId = req.params.id
    const versionNumber = parseInt(req.params.version)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID format' })
    }

    if (isNaN(versionNumber) || versionNumber < 1) {
      return res.status(400).json({ error: 'Invalid version number' })
    }

    // Verify ownership
    const ownershipQuery = 'SELECT * FROM prompts WHERE id = $1 AND user_id = $2'
    const ownershipResult = await pool.query(ownershipQuery, [promptId, userId])

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found or access denied' })
    }

    // Get specific version
    const versionQuery = `
      SELECT
        pv.*,
        u.name as created_by_name
      FROM prompt_versions pv
      LEFT JOIN users u ON pv.created_by = u.id
      WHERE pv.prompt_id = $1 AND pv.version_number = $2
    `
    const versionResult = await pool.query(versionQuery, [promptId, versionNumber])

    if (versionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' })
    }

    res.json({
      success: true,
      version: versionResult.rows[0]
    })

  } catch (error) {
    console.error('Get version error:', error)
    res.status(500).json({
      error: 'Failed to fetch version',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// PUT /api/prompts/:id/metrics - Update performance metrics
router.put('/:id/metrics', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const promptId = req.params.id
    const { usage_count, success_rate, avg_response_time } = req.body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(promptId)) {
      return res.status(400).json({ error: 'Invalid prompt ID format' })
    }

    // Verify ownership
    const ownershipQuery = 'SELECT performance_metrics FROM prompts WHERE id = $1 AND user_id = $2'
    const ownershipResult = await pool.query(ownershipQuery, [promptId, userId])

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found or access denied' })
    }

    // Get current metrics
    let currentMetrics = {}
    try {
      currentMetrics = typeof ownershipResult.rows[0].performance_metrics === 'string'
        ? JSON.parse(ownershipResult.rows[0].performance_metrics || '{}')
        : ownershipResult.rows[0].performance_metrics || {}
    } catch (parseError) {
      currentMetrics = {}
    }

    // Update metrics
    const updatedMetrics = {
      ...currentMetrics,
      ...(usage_count !== undefined && { usage_count }),
      ...(success_rate !== undefined && { success_rate }),
      ...(avg_response_time !== undefined && { avg_response_time }),
      last_updated: new Date().toISOString()
    }

    // Save updated metrics
    const updateQuery = `
      UPDATE prompts
      SET performance_metrics = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `
    const result = await pool.query(updateQuery, [JSON.stringify(updatedMetrics), promptId, userId])
    const updatedPrompt = result.rows[0]

    // Log activity
    await logActivity(userId, 'prompt_metrics_updated', 'prompt', promptId, updatedMetrics)

    // Transform response
    const responsePrompt = {
      ...updatedPrompt,
      performance_metrics: updatedMetrics
    }

    res.json({
      success: true,
      prompt: responsePrompt,
      message: 'Performance metrics updated successfully'
    })

  } catch (error) {
    console.error('Update metrics error:', error)
    res.status(500).json({
      error: 'Failed to update metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/prompts/categories - Get prompt categories with counts
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const categoriesQuery = `
      SELECT
        category,
        COUNT(*) as count,
        AVG(CAST(performance_metrics->>'usage_count' AS INTEGER)) as avg_usage
      FROM prompts
      WHERE user_id = $1 AND category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC, category ASC
    `

    const result = await pool.query(categoriesQuery, [userId])

    // Add default categories that might not have prompts yet
    const defaultCategories = ['general', 'writing', 'coding', 'analysis', 'support', 'marketing']
    const existingCategories = result.rows.map(row => row.category)

    const allCategories = [
      ...result.rows,
      ...defaultCategories
        .filter(cat => !existingCategories.includes(cat))
        .map(cat => ({ category: cat, count: 0, avg_usage: 0 }))
    ]

    res.json({
      success: true,
      categories: allCategories
    })

  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      error: 'Failed to fetch categories',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/prompts/search - Advanced prompt search
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const {
      q, // search query
      category,
      prompt_type,
      status,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query

    let queryConditions = ['p.user_id = $1']
    let queryParams = [userId]
    let paramIndex = 2

    // Build dynamic WHERE clause
    if (q && q.trim()) {
      queryConditions.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex})`)
      queryParams.push(`%${q.trim()}%`)
      paramIndex++
    }

    if (category && category !== 'all') {
      queryConditions.push(`p.category = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    if (prompt_type && prompt_type !== 'all') {
      queryConditions.push(`p.prompt_type = $${paramIndex}`)
      queryParams.push(prompt_type)
      paramIndex++
    }

    if (status && status !== 'all') {
      queryConditions.push(`p.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'versions']
    const allowedSortOrders = ['ASC', 'DESC']

    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at'
    const sortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC'

    // Main search query
    const searchQuery = `
      SELECT
        p.id,
        p.title,
        p.description,
        p.prompt_type,
        p.category,
        p.status,
        p.content,
        p.versions,
        p.performance_metrics,
        p.created_at,
        p.updated_at,
        u.name as created_by_name,
        -- Calculate relevance score for text search
        ${q && q.trim() ? `
        CASE
          WHEN p.title ILIKE $${queryParams.findIndex(param => param.includes('%' + q.trim() + '%')) + 1} THEN 3
          WHEN p.description ILIKE $${queryParams.findIndex(param => param.includes('%' + q.trim() + '%')) + 1} THEN 2
          WHEN p.content ILIKE $${queryParams.findIndex(param => param.includes('%' + q.trim() + '%')) + 1} THEN 1
          ELSE 0
        END as relevance_score
        ` : '0 as relevance_score'}
      FROM prompts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ${queryConditions.join(' AND ')}
      ORDER BY
        ${q && q.trim() ? 'relevance_score DESC,' : ''}
        p.${sortField} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(parseInt(limit), parseInt(offset))

    const result = await pool.query(searchQuery, queryParams)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM prompts p
      WHERE ${queryConditions.join(' AND ')}
    `
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 2))

    // Transform the data
    const prompts = result.rows.map(prompt => ({
      ...prompt,
      performance_metrics: typeof prompt.performance_metrics === 'string'
        ? JSON.parse(prompt.performance_metrics || '{}')
        : prompt.performance_metrics || {}
    }))

    res.json({
      success: true,
      prompts,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].total)
      },
      search_params: { q, category, prompt_type, status, sort_by: sortField, sort_order: sortOrder }
    })

  } catch (error) {
    console.error('Search prompts error:', error)
    res.status(500).json({
      error: 'Failed to search prompts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/prompts/stats - Get user prompt statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const statsQuery = `
      SELECT
        COUNT(*) as total_prompts,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_prompts,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_prompts,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_prompts,
        AVG(versions) as avg_versions,
        SUM(CAST(performance_metrics->>'usage_count' AS INTEGER)) as total_usage,
        AVG(CAST(performance_metrics->>'success_rate' AS FLOAT)) as avg_success_rate,
        COUNT(DISTINCT category) as unique_categories,
        COUNT(DISTINCT prompt_type) as unique_types
      FROM prompts
      WHERE user_id = $1
    `

    const result = await pool.query(statsQuery, [userId])
    const stats = result.rows[0]

    // Get recent activity
    const recentQuery = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as prompts_created
      FROM prompts
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `
    const recentResult = await pool.query(recentQuery, [userId])

    // Get top performing prompts
    const topQuery = `
      SELECT
        id, title,
        CAST(performance_metrics->>'usage_count' AS INTEGER) as usage_count,
        CAST(performance_metrics->>'success_rate' AS FLOAT) as success_rate
      FROM prompts
      WHERE user_id = $1
        AND performance_metrics->>'usage_count' IS NOT NULL
      ORDER BY CAST(performance_metrics->>'usage_count' AS INTEGER) DESC
      LIMIT 5
    `
    const topResult = await pool.query(topQuery, [userId])

    res.json({
      success: true,
      stats: {
        ...stats,
        total_usage: parseInt(stats.total_usage) || 0,
        avg_success_rate: parseFloat(stats.avg_success_rate) || 0,
        avg_versions: parseFloat(stats.avg_versions) || 1,
        unique_categories: parseInt(stats.unique_categories) || 0,
        unique_types: parseInt(stats.unique_types) || 0
      },
      recent_activity: recentResult.rows,
      top_prompts: topResult.rows
    })

  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Function to create prompts table if it doesn't exist
const createPromptsTable = async () => {
  const createTableSQL = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create prompts table for simplified prompt management
    CREATE TABLE IF NOT EXISTS prompts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      prompt_type VARCHAR(50) DEFAULT 'conversational' CHECK (prompt_type IN ('conversational', 'instructional', 'creative', 'analytical', 'code_generation')),
      category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'writing', 'coding', 'analysis', 'support', 'marketing')),
      content TEXT,
      status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
      visibility VARCHAR(50) DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
      versions INTEGER DEFAULT 1,
      performance_metrics JSONB DEFAULT '{"usage_count": 0, "success_rate": 0, "avg_response_time": 0}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
    CREATE INDEX IF NOT EXISTS idx_prompts_type ON prompts(prompt_type);
    CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
    CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);
    CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);

    -- Create prompt versions table for version control
    CREATE TABLE IF NOT EXISTS prompt_versions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      version_note TEXT,
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(prompt_id, version_number)
    );

    -- Create indexes for prompt versions
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_at ON prompt_versions(created_at DESC);
  `

  await pool.query(createTableSQL)
  console.log('✓ Prompts tables created successfully')
}

module.exports = router