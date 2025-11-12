const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');
const pool = require('../db/pool');

const router = express.Router();

/**
 * POST /api/ai/summarize-files
 * Summarize uploaded files and detect missing documents
 */
router.post('/summarize-files', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    // Get request details and files
    const requestResult = await pool.query(
      'SELECT * FROM file_requests WHERE id = $1 AND user_id = $2',
      [requestId, req.user.userId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // Get uploaded files for this request
    const filesResult = await pool.query(
      'SELECT * FROM uploads WHERE request_id = $1',
      [requestId]
    );

    const files = filesResult.rows;

    if (files.length === 0) {
      return res.status(400).json({ error: 'No files found for this request' });
    }

    // Generate AI summary
    const summary = await aiService.summarizeFiles(
      files,
      request.description || request.title
    );

    res.json(summary);
  } catch (error) {
    console.error('Summarize files error:', error);
    res.status(500).json({ error: 'Failed to summarize files' });
  }
});

/**
 * POST /api/ai/generate-follow-up
 * Generate follow-up email suggestion
 */
router.post('/generate-follow-up', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    // Get request details
    const requestResult = await pool.query(
      'SELECT * FROM file_requests WHERE id = $1 AND user_id = $2',
      [requestId, req.user.userId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // Get uploaded files count
    const filesResult = await pool.query(
      'SELECT * FROM uploads WHERE request_id = $1',
      [requestId]
    );

    // Generate follow-up email
    const followUp = await aiService.generateFollowUp(request, filesResult.rows);

    res.json(followUp);
  } catch (error) {
    console.error('Generate follow-up error:', error);
    res.status(500).json({ error: 'Failed to generate follow-up' });
  }
});

/**
 * POST /api/ai/scheduling-suggestions
 * Generate smart scheduling suggestions
 */
router.post('/scheduling-suggestions', authenticateToken, async (req, res) => {
  try {
    // Get user's upcoming scheduled requests
    const scheduledResult = await pool.query(
      `SELECT * FROM scheduled_requests
       WHERE user_id = $1
       AND scheduled_date >= NOW()
       ORDER BY scheduled_date ASC
       LIMIT 10`,
      [req.user.userId]
    );

    // Get recent request activity
    const activityResult = await pool.query(
      `SELECT * FROM file_requests
       WHERE user_id = $1
       ORDER BY id DESC
       LIMIT 10`,
      [req.user.userId]
    );

    const workflowData = {
      upcomingRequests: scheduledResult.rows,
      recentActivity: activityResult.rows,
    };

    // Generate suggestions
    const suggestions = await aiService.generateSchedulingSuggestions(workflowData);

    res.json(suggestions);
  } catch (error) {
    console.error('Scheduling suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate scheduling suggestions' });
  }
});

/**
 * POST /api/ai/workflow-insights
 * Generate workflow insights based on analytics
 */
router.post('/workflow-insights', authenticateToken, async (req, res) => {
  try {
    // Get user analytics
    const totalRequestsResult = await pool.query(
      'SELECT COUNT(*) as count FROM file_requests WHERE user_id = $1',
      [req.user.userId]
    );

    const completedRequestsResult = await pool.query(
      `SELECT COUNT(*) as count FROM file_requests
       WHERE user_id = $1 AND status = 'completed'`,
      [req.user.userId]
    );

    const avgResponseResult = await pool.query(
      `SELECT 24 as avg_hours
       FROM file_requests
       WHERE user_id = $1 AND status = 'completed'
       LIMIT 1`,
      [req.user.userId]
    );

    const analytics = {
      totalRequests: parseInt(totalRequestsResult.rows[0].count),
      completedRequests: parseInt(completedRequestsResult.rows[0].count),
      avgResponseTime: parseFloat(avgResponseResult.rows[0].avg_hours || 0).toFixed(1),
      mostUsedTemplates: [], // TODO: Track templates in DB
    };

    // Generate insights
    const insights = await aiService.generateWorkflowInsights(analytics);

    res.json(insights);
  } catch (error) {
    console.error('Workflow insights error:', error);
    res.status(500).json({ error: 'Failed to generate workflow insights' });
  }
});

/**
 * POST /api/ai/chat
 * General AI chat endpoint
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await aiService.chat(message, context || {});

    res.json(response);
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

module.exports = router;
