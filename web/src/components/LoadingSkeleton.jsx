import theme from '../theme'

export function CardSkeleton() {
  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${theme.colors.border.light}`,
      borderRadius: theme.radius.lg
    }}>
      <div style={{
        height: '20px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        marginBottom: '12px',
        width: '60%'
      }} />
      <div style={{
        height: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        width: '40%'
      }} />
    </div>
  )
}

export function TableSkeleton({ rows = 3 }) {
  return (
    <>
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: `1px solid ${theme.colors.border.light}`,
          display: 'flex',
          gap: '16px'
        }}>
          <div style={{ height: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', flex: 1 }} />
          <div style={{ height: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', width: '100px' }} />
        </div>
      ))}
    </>
  )
}
