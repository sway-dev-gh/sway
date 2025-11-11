import { useState, useEffect } from 'react';
import { chatWithAI } from '../lib/aiApi';
import { useNavigate } from 'react-router-dom';

const theme = {
  colors: {
    text: {
      primary: '#FFFFFF',
      secondary: '#a3a3a3',
    },
    bg: {
      primary: '#000000',
      secondary: '#000000',
      tertiary: '#000000',
    },
    border: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
    },
  },
};

export default function AIAssistant({ isOpen, onClose, userPlan }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Sway knowledge assistant. Ask me anything about:\n\n• How to use Sway features\n• File workflow best practices\n• Tips for organizing requests\n• Security and privacy questions\n• Any other Sway-related questions\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [questionsLimit] = useState(30);

  useEffect(() => {
    if (isOpen) {
      // Get usage from localStorage
      const storedUsage = localStorage.getItem('aiQuestionsUsed');
      const storedMonth = localStorage.getItem('aiQuestionsMonth');
      const currentMonth = new Date().getMonth();

      if (storedMonth && parseInt(storedMonth) !== currentMonth) {
        // Reset if new month
        localStorage.setItem('aiQuestionsUsed', '0');
        localStorage.setItem('aiQuestionsMonth', currentMonth.toString());
        setQuestionsUsed(0);
      } else if (storedUsage) {
        setQuestionsUsed(parseInt(storedUsage));
      }
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check if Pro user
    if (userPlan !== 'pro') {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'AI Assistant is a Pro feature. Upgrade to Pro to ask unlimited questions about Sway.' },
      ]);
      return;
    }

    // Check question limit
    if (questionsUsed >= questionsLimit) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `You've used all ${questionsLimit} questions for this month. Your limit will reset next month. Pro users get ${questionsLimit} questions per month.`
        },
      ]);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatWithAI(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);

      // Increment usage
      const newUsage = questionsUsed + 1;
      setQuestionsUsed(newUsage);
      localStorage.setItem('aiQuestionsUsed', newUsage.toString());
      localStorage.setItem('aiQuestionsMonth', new Date().getMonth().toString());
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

  if (!isOpen) return null;

  const questionsRemaining = questionsLimit - questionsUsed;

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
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${theme.colors.border.light}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: theme.colors.text.primary, marginBottom: '4px' }}>
              AI Knowledge Assistant
            </h2>
            {userPlan === 'pro' ? (
              <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: 0 }}>
                {questionsRemaining} of {questionsLimit} questions remaining this month
              </p>
            ) : (
              <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: 0 }}>
                Pro only - 30 questions/month
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.text.secondary,
              fontSize: '14px',
              cursor: 'pointer',
              padding: '4px 8px',
              fontWeight: 500,
            }}
          >
            Close
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
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
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
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  border: `1px solid ${theme.colors.border.light}`,
                }}
              >
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Prompt for Free Users */}
        {userPlan !== 'pro' && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: `1px solid ${theme.colors.border.light}`,
              background: theme.colors.bg.tertiary,
            }}
          >
            <p style={{ fontSize: '13px', color: theme.colors.text.secondary, marginBottom: '12px' }}>
              AI Knowledge Assistant is a Pro feature
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/plan');
              }}
              style={{
                width: '100%',
                background: '#FFFFFF',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Input */}
        {userPlan === 'pro' && (
          <div
            style={{
              padding: '20px 24px',
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
              placeholder="Ask a question..."
              disabled={isLoading || questionsUsed >= questionsLimit}
              style={{
                flex: 1,
                background: theme.colors.bg.tertiary,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: '6px',
                padding: '10px 14px',
                color: theme.colors.text.primary,
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || questionsUsed >= questionsLimit}
              style={{
                background: '#FFFFFF',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: (input.trim() && !isLoading && questionsUsed < questionsLimit) ? 'pointer' : 'not-allowed',
                opacity: (input.trim() && !isLoading && questionsUsed < questionsLimit) ? 1 : 0.5,
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </>
  );
}
