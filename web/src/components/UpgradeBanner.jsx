import { useNavigate } from 'react-router-dom';
import theme from '../theme';

export default function UpgradeBanner({ user, onClose }) {
  const navigate = useNavigate();

  // Only show for free users
  const userPlan = user?.plan?.toLowerCase() || 'free';
  if (userPlan !== 'free') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      maxWidth: '400px',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
      border: `2px solid ${theme.colors.white}`,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      zIndex: 1000,
      animation: 'slideInFromBottom 0.4s ease'
    }}>
      <style>{`
        @keyframes slideInFromBottom {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: '#666',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          ×
        </button>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '28px' }}>✨</span>
        <div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#000',
            marginBottom: '4px'
          }}>
            Unlock AI-Powered Workflows
          </div>
          <div style={{
            fontSize: '13px',
            color: '#666',
            fontWeight: '500'
          }}>
            Upgrade to Pro for $12/month
          </div>
        </div>
      </div>

      <div style={{
        marginBottom: '20px'
      }}>
        {[
          'AI Assistant with GPT-4o',
          'Smart file summarization',
          'Auto follow-up emails',
          'Unlimited requests',
          'Advanced analytics'
        ].map((feature, idx) => (
          <div
            key={idx}
            style={{
              fontSize: '13px',
              color: '#333',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <span style={{ color: '#000', fontSize: '16px' }}>✓</span>
            {feature}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/plan')}
        style={{
          width: '100%',
          padding: '14px 24px',
          background: '#000',
          color: '#FFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  );
}
