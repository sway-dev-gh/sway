const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sway Knowledge Assistant system prompt
const SWAY_KNOWLEDGE_PROMPT = `You are Sway's Knowledge Assistant - a helpful guide for users learning about Sway's file workflow platform.

Your role is to:
- Answer questions about how to use Sway features
- Provide best practices for file collection workflows
- Explain security and privacy features
- Help users understand pricing and plans
- Give tips for organizing file requests
- Clarify any Sway-related concepts

Your tone should be: professional yet friendly, concise, clear, and helpful.
Keep responses brief (2-3 paragraphs max). Use clean, simple language.

You should NOT:
- Generate actual workflow content (emails, schedules, etc.)
- Access or analyze user's specific data
- Provide technical support for bugs
- Make changes to user accounts

Focus on being an educational knowledge resource about Sway itself.`;

/**
 * Summarize uploaded files and detect missing documents
 */
async function summarizeFiles(files, requestContext = '') {
  try {
    const fileList = files.map(f => `- ${f.name || f.filename} (${f.type || 'unknown type'})`).join('\n');

    const prompt = `You are Sway's AI assistant. Sway is a modern file workflow platform.

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
    const prompt = `You are Sway's AI assistant for a file workflow platform.

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

    const prompt = `You are Sway's AI assistant for file workflow management.

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

    const prompt = `You are Sway's AI assistant for file workflow analytics.

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
 * Knowledge Assistant chat - for answering questions about Sway
 * This is a knowledge tool, not a workflow automation tool
 */
async function chat(message, context = {}) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SWAY_KNOWLEDGE_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 400,
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
