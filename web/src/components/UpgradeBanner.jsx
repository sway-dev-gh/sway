import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';

const SHOW_INTERVAL = 5 * 60 * 1000; // 5 minutes
const AUTO_DISMISS_TIME = 10 * 1000; // 10 seconds

export default function UpgradeBanner({ user, plan, onClose }) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  // Support both user object (Management) and plan string (Requests)
  const userPlan = plan || user?.plan?.toLowerCase() || 'free';

  // Only show for free users
  if (userPlan !== 'free') return null;

  useEffect(() => {
    // Check if we should show the banner
    const lastShown = localStorage.getItem('upgradeBannerLastShown');
    const now = Date.now();

    if (!lastShown || now - parseInt(lastShown) > SHOW_INTERVAL) {
      // Show the banner
      setIsVisible(true);
      localStorage.setItem('upgradeBannerLastShown', now.toString());

      // Auto-dismiss after 10 seconds
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
      }, AUTO_DISMISS_TIME);

      return () => clearTimeout(dismissTimer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      maxWidth: '380px',
      background: theme.colors.white,
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${theme.colors.black}`,
      zIndex: 999,
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

      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          color: theme.colors.text.secondary,
          fontSize: '20px',
          cursor: 'pointer',
          padding: '4px 8px'
        }}
      >
        Close
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: theme.colors.black,
            marginBottom: '4px'
          }}>
            Unlock AI-Powered Workflows
          </div>
          <div style={{
            fontSize: '13px',
            color: theme.colors.text.secondary,
            fontWeight: '500'
          }}>
            Upgrade to Pro for $15/month
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
              color: theme.colors.text.primary,
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <span style={{ color: theme.colors.black, fontSize: '16px' }}>•</span>
            {feature}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/plan')}
        style={{
          width: '100%',
          padding: '14px 24px',
          background: theme.colors.black,
          color: theme.colors.white,
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  );
}
