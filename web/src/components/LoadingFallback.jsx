import theme from '../theme'

export function PageLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.colors.bg.page,
      paddingTop: '54px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${theme.colors.border.medium}`,
          borderTopColor: theme.colors.white,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{
          fontSize: '14px',
          color: theme.colors.text.secondary,
          fontWeight: '500'
        }}>
          Loading...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.bg.page,
      color: theme.colors.text.primary,
      paddingTop: '54px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px 32px'
      }}>
        {/* Header Skeleton */}
        <div style={{
          marginBottom: '64px',
          maxWidth: '680px',
          margin: '0 auto 64px',
          textAlign: 'center'
        }}>
          <div style={{
            height: '56px',
            width: '400px',
            margin: '0 auto 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: theme.radius.md,
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <div style={{
            height: '24px',
            width: '500px',
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: theme.radius.md,
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.1s'
          }} />
        </div>

        {/* Cards Skeleton */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          maxWidth: '840px',
          margin: '0 auto'
        }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              padding: '40px',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{
                height: '12px',
                width: '80px',
                marginBottom: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: theme.radius.sm,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }} />
              <div style={{
                height: '24px',
                width: '150px',
                marginBottom: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: theme.radius.sm,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1 + 0.1}s`
              }} />
              <div style={{
                height: '15px',
                width: '200px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: theme.radius.sm,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1 + 0.2}s`
              }} />
            </div>
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.bg.page,
      paddingTop: '54px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px 32px'
      }}>
        {/* Header */}
        <div style={{
          height: '40px',
          width: '250px',
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: theme.radius.md,
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />

        {/* Table rows */}
        <div style={{
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          background: theme.colors.bg.card
        }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${theme.colors.border.light}`,
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{
                height: '16px',
                flex: '1',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: theme.radius.sm,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }} />
              <div style={{
                height: '16px',
                width: '100px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: theme.radius.sm,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1 + 0.1}s`
              }} />
              <div style={{
                height: '16px',
                width: '80px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: theme.radius.sm,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1 + 0.2}s`
              }} />
            </div>
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.bg.page,
      paddingTop: '54px'
    }}>
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '48px 32px'
      }}>
        {/* Form header */}
        <div style={{
          height: '36px',
          width: '200px',
          marginBottom: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: theme.radius.md,
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
        <div style={{
          height: '20px',
          width: '350px',
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: theme.radius.md,
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: '0.1s'
        }} />

        {/* Form fields */}
        <div style={{
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: theme.radius.lg,
          padding: '32px',
          background: theme.colors.bg.card
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ marginBottom: '24px' }}>
              <div style={{
                height: '14px',
                width: '100px',
                marginBottom: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: theme.radius.sm,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }} />
              <div style={{
                height: '44px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: theme.radius.md,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1 + 0.1}s`
              }} />
            </div>
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  )
}

export default PageLoadingFallback
