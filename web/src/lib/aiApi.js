const API_URL = import.meta.env.VITE_API_URL || 'https://api.swayfiles.com';

/**
 * Get AI summary of uploaded files and missing documents
 */
export async function summarizeFiles(requestId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/ai/summarize-files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ requestId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to summarize files');
  }

  return response.json();
}

/**
 * Generate follow-up email for a request
 */
export async function generateFollowUp(requestId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/ai/generate-follow-up`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ requestId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate follow-up');
  }

  return response.json();
}

/**
 * Get scheduling suggestions
 */
export async function getSchedulingSuggestions() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/ai/scheduling-suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get scheduling suggestions');
  }

  return response.json();
}

/**
 * Get workflow insights
 */
export async function getWorkflowInsights() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/ai/workflow-insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get workflow insights');
  }

  return response.json();
}

/**
 * Chat with AI assistant
 */
export async function chatWithAI(message, context = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message, context }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to chat with AI');
  }

  return response.json();
}
