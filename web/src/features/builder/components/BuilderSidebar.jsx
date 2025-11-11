import theme from '../../../theme'
import { TEMPLATES, COMPONENT_LIBRARY } from '../constants'

/**
 * BuilderSidebar - Left sidebar with templates and components
 *
 * @param {Object} props
 * @param {string} props.activeTab - Current active tab ('templates' or 'elements')
 * @param {Function} props.onTabChange - Tab change handler
 * @param {Function} props.onTemplateClick - Template click handler
 * @param {Function} props.onComponentDragStart - Component drag start handler
 * @param {string} props.userPlan - User's plan level
 * @param {Function} props.onUpgradeClick - Upgrade modal trigger
 */
function BuilderSidebar({
  activeTab,
  onTabChange,
  onTemplateClick,
  onComponentDragStart,
  userPlan,
  onUpgradeClick
}) {
  return (
    <div style={{
      width: '280px',
      borderRight: `1px solid ${theme.colors.border.dark}`,
      background: theme.colors.bg.hover,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.colors.border.dark}` }}>
        <button
          onClick={() => onTabChange('templates')}
          style={{
            flex: 1,
            padding: '14px',
            background: activeTab === 'templates' ? theme.colors.bg.hover : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'templates' ? `2px solid ${theme.colors.white}` : '2px solid transparent',
            color: activeTab === 'templates' ? theme.colors.white : theme.colors.text.secondary,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.weight.semibold,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Templates
        </button>
        <button
          onClick={() => onTabChange('elements')}
          style={{
            flex: 1,
            padding: '14px',
            background: activeTab === 'elements' ? theme.colors.bg.hover : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'elements' ? `2px solid ${theme.colors.white}` : '2px solid transparent',
            color: activeTab === 'elements' ? theme.colors.white : theme.colors.text.secondary,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.weight.semibold,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Elements
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeTab === 'templates' && (
          <>
            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.text.secondary,
              marginBottom: '12px',
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Free Templates
            </div>
            {TEMPLATES.filter(t => t.plan === 'free').map(template => (
              <div
                key={template.id}
                onClick={() => onTemplateClick(template)}
                style={{
                  padding: '14px',
                  marginBottom: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: theme.weight.semibold, color: theme.colors.text.primary, marginBottom: '4px' }}>
                  {template.name}
                </div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.secondary }}>
                  {template.description}
                </div>
              </div>
            ))}

            <div style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.text.secondary,
              margin: '20px 0 12px',
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Pro Templates
            </div>
            {TEMPLATES.filter(t => t.plan === 'pro').map(template => {
              const isLocked = userPlan !== 'pro' && userPlan !== 'enterprise'
              return (
                <div
                  key={template.id}
                  onClick={() => isLocked ? onUpgradeClick() : onTemplateClick(template)}
                  style={{
                    padding: '14px',
                    marginBottom: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.sm,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ fontSize: theme.fontSize.sm, fontWeight: theme.weight.semibold, color: theme.colors.text.primary }}>
                      {template.name}
                    </div>
                    {isLocked && (
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        fontWeight: theme.weight.bold,
                        color: theme.colors.text.secondary,
                        background: theme.colors.border.dark,
                        padding: '2px 6px',
                        borderRadius: theme.radius.sm,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}>
                        PRO
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.secondary }}>
                    {template.description}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {activeTab === 'elements' && (
          <>
            {COMPONENT_LIBRARY.map(component => {
              const isPro = component.plan === 'pro'
              const isLocked = isPro && userPlan !== 'pro' && userPlan !== 'enterprise'

              return (
                <div
                  key={component.id}
                  draggable={!isLocked}
                  onDragStart={() => !isLocked && onComponentDragStart(component)}
                  onClick={() => isLocked && onUpgradeClick()}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.sm,
                    cursor: isLocked ? 'not-allowed' : 'grab',
                    userSelect: 'none',
                    opacity: isLocked ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      fontSize: theme.fontSize.lg,
                      fontWeight: theme.weight.bold,
                      color: theme.colors.text.primary,
                      minWidth: '32px',
                      textAlign: 'center',
                      background: theme.colors.border.dark,
                      borderRadius: theme.radius.sm,
                      padding: '6px',
                      lineHeight: '1'
                    }}>
                      {component.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '2px'
                      }}>
                        <div style={{ fontSize: theme.fontSize.sm, fontWeight: theme.weight.medium, color: theme.colors.text.primary }}>
                          {component.label}
                        </div>
                        {isPro && (
                          <div style={{
                            fontSize: theme.fontSize.xs,
                            fontWeight: theme.weight.bold,
                            color: isLocked ? theme.colors.text.secondary : theme.colors.white,
                            background: isLocked ? theme.colors.border.dark : 'rgba(255, 255, 255, 0.1)',
                            padding: '2px 6px',
                            borderRadius: theme.radius.sm,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                          }}>
                            PRO
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.secondary }}>
                        {component.description}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export default BuilderSidebar
