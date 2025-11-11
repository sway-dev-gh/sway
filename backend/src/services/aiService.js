const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sway brand voice system prompt
const SWAY_VOICE = `You are Sway's AI assistant. Sway is a modern, minimal file workflow platform.
Your tone should be: professional yet friendly, concise, actionable, and empowering.
Keep responses brief and practical. Use clean, simple language that matches Sway's timeless design aesthetic.`;

/**
 * Summarize uploaded files and detect missing documents
 */
async function summarizeFiles(files, requestContext = '') {
  try {
    const fileList = files.map(f => `- ${f.name || f.filename} (${f.type || 'unknown type'})`).join('\n');

    const prompt = `${SWAY_VOICE}

Context: ${requestContext || 'A file request workflow'}

Files received:
${fileList}

Task:
1. Provide a brief summary of what was received
2. Identify any potentially missing documents based on the context
3. Keep it under 3 sentences

Format as JSON:
{
  "summary": "Brief summary here",
  "missingDocs": ["doc1", "doc2"] or []
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 300,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI summarization error:', error);
    throw new Error('Failed to summarize files');
  }
}

/**
 * Generate follow-up email suggestions
 */
async function generateFollowUp(requestDetails, filesReceived) {
  try {
    const prompt = `${SWAY_VOICE}

Request: ${requestDetails.title || 'File request'}
${requestDetails.description ? `Description: ${requestDetails.description}` : ''}
Files received: ${filesReceived.length} file(s)

Task: Generate a brief, professional follow-up email to thank the client and confirm receipt.
Keep it under 100 words. Be warm but professional.

Format as JSON:
{
  "subject": "Email subject line",
  "body": "Email body text"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 400,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI follow-up generation error:', error);
    throw new Error('Failed to generate follow-up');
  }
}

/**
 * Generate calendar/scheduling suggestions
 */
async function generateSchedulingSuggestions(workflowData) {
  try {
    const { upcomingRequests = [], recentActivity = [] } = workflowData;

    const prompt = `${SWAY_VOICE}

Upcoming requests: ${upcomingRequests.length}
Recent activity: ${recentActivity.length} events

Task: Based on this workflow data, suggest 2-3 smart scheduling actions or calendar events.
Examples: schedule follow-up, set reminder for missing files, create review deadline.

Format as JSON:
{
  "suggestions": [
    {
      "title": "Event title",
      "description": "Brief description",
      "suggestedDate": "relative time like '2 days' or 'next week'",
      "priority": "high/medium/low"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI scheduling suggestions error:', error);
    throw new Error('Failed to generate scheduling suggestions');
  }
}

/**
 * Generate workflow insights based on user activity
 */
async function generateWorkflowInsights(analytics) {
  try {
    const {
      totalRequests = 0,
      completedRequests = 0,
      avgResponseTime = 0,
      mostUsedTemplates = [],
    } = analytics;

    const prompt = `${SWAY_VOICE}

Workflow analytics:
- Total requests: ${totalRequests}
- Completed: ${completedRequests}
- Average response time: ${avgResponseTime} hours
- Most used templates: ${mostUsedTemplates.join(', ') || 'None'}

Task: Provide 2-3 actionable insights to improve workflow efficiency.
Focus on specific, practical recommendations.

Format as JSON:
{
  "insights": [
    {
      "title": "Insight title",
      "description": "Brief recommendation",
      "impact": "high/medium/low"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 600,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI workflow insights error:', error);
    throw new Error('Failed to generate workflow insights');
  }
}

/**
 * General AI chat for asking questions about workflows
 */
async function chat(message, context = {}) {
  try {
    const contextStr = Object.keys(context).length > 0
      ? `\n\nContext: ${JSON.stringify(context)}`
      : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SWAY_VOICE },
        { role: 'user', content: message + contextStr }
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    return {
      message: response.choices[0].message.content
    };
  } catch (error) {
    console.error('AI chat error:', error);
    throw new Error('Failed to process chat message');
  }
}

module.exports = {
  summarizeFiles,
  generateFollowUp,
  generateSchedulingSuggestions,
  generateWorkflowInsights,
  chat,
};
