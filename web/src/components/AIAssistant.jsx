import { useState } from 'react';
import { chatWithAI, getWorkflowInsights, getSchedulingSuggestions } from '../lib/aiApi';

const theme = {
  colors: {
    text: {
      primary: '#FFFFFF',
      secondary: '#A3A3A3',
    },
    bg: {
      primary: '#000000',
      secondary: '#0F0F0F',
      tertiary: '#1A1A1A',
    },
    border: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
    },
  },
};

export default function AIAssistant({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Sway AI assistant. I can help you with:\n\n• Workflow insights and analytics\n• Scheduling suggestions\n• General questions about your requests\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatWithAI(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
      console.error('AI chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: action }]);

    try {
      let response;
      if (action === 'Get workflow insights') {
        const data = await getWorkflowInsights();
        const insights = data.insights
          .map((i, idx) => `${idx + 1}. **${i.title}** (${i.impact} impact)\n   ${i.description}`)
          .join('\n\n');
        response = { message: `Here are your workflow insights:\n\n${insights}` };
      } else if (action === 'Get scheduling suggestions') {
        const data = await getSchedulingSuggestions();
        const suggestions = data.suggestions
          .map((s, idx) => `${idx + 1}. **${s.title}** (${s.priority} priority)\n   ${s.description}\n   Suggested: ${s.suggestedDate}`)
          .join('\n\n');
        response = { message: `Here are some scheduling suggestions:\n\n${suggestions}` };
      }

      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
      console.error('AI action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
        }}
      />

      {/* AI Assistant Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '600px',
          height: '80vh',
          maxHeight: '700px',
          background: theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: `1px solid ${theme.colors.border.light}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.text.primary }}>
              AI Assistant
            </h2>
            <p style={{ fontSize: '13px', color: theme.colors.text.secondary, marginTop: '4px' }}>
              Powered by Sway
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.text.secondary,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              <div
                style={{
                  background: msg.role === 'user' ? '#FFFFFF' : theme.colors.bg.tertiary,
                  color: msg.role === 'user' ? '#000000' : theme.colors.text.primary,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  border: msg.role === 'assistant' ? `1px solid ${theme.colors.border.light}` : 'none',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div
                style={{
                  background: theme.colors.bg.tertiary,
                  color: theme.colors.text.secondary,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  border: `1px solid ${theme.colors.border.light}`,
                }}
              >
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div
            style={{
              padding: '0 24px 16px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => handleQuickAction('Get workflow insights')}
              disabled={isLoading}
              style={{
                background: theme.colors.bg.tertiary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Get workflow insights
            </button>
            <button
              onClick={() => handleQuickAction('Get scheduling suggestions')}
              disabled={isLoading}
              style={{
                background: theme.colors.bg.tertiary,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Get scheduling suggestions
            </button>
          </div>
        )}

        {/* Input */}
        <div
          style={{
            padding: '24px',
            borderTop: `1px solid ${theme.colors.border.light}`,
            display: 'flex',
            gap: '12px',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: theme.colors.bg.tertiary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '8px',
              padding: '12px 16px',
              color: theme.colors.text.primary,
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              background: '#FFFFFF',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: input.trim() && !isLoading ? 1 : 0.5,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
