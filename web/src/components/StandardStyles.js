import theme from '../theme'

/**
 * Standardized component styles for consistent UI across all pages
 * Use these exact styles to ensure everything looks identical
 */
export const standardStyles = {
  // Page Headers (Main titles)
  pageHeader: {
    fontSize: '32px',
    fontWeight: theme.weight.semibold,
    color: theme.colors.text.primary,
    letterSpacing: '-0.03em',
    marginBottom: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },

  // Page Descriptions (Subheaders)
  pageDescription: {
    fontSize: '15px',
    color: theme.colors.text.tertiary,
    lineHeight: '1.6',
    margin: 0
  },

  // Primary Action Buttons
  primaryButton: {
    padding: '12px 24px',
    background: theme.colors.white,
    color: theme.colors.black,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: theme.weight.semibold,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit'
  },

  // Secondary Buttons
  secondaryButton: {
    padding: '12px 24px',
    background: 'transparent',
    color: theme.colors.text.secondary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: theme.weight.medium,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit'
  },

  // Filter Buttons
  filterButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: theme.weight.medium,
    cursor: 'pointer',
    transition: 'all 200ms',
    fontFamily: 'inherit'
  },

  // Search Inputs
  searchInput: {
    padding: '10px 16px',
    background: theme.colors.bg.hover,
    border: `1px solid ${theme.colors.border.light}`,
    borderRadius: '8px',
    color: theme.colors.text.primary,
    fontSize: '14px',
    width: '300px',
    fontFamily: 'inherit'
  },

  // Stats Card Labels
  statsLabel: {
    fontSize: '11px',
    color: theme.colors.text.tertiary,
    marginBottom: '8px',
    fontWeight: theme.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  // Stats Numbers
  statsNumber: {
    fontSize: '32px',
    fontWeight: theme.weight.bold,
    color: theme.colors.text.primary,
    lineHeight: '1',
    marginBottom: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em'
  },

  // Stats Description
  statsDescription: {
    fontSize: '14px',
    color: theme.colors.text.secondary,
    fontWeight: theme.weight.medium
  },

  // Section Headers (h2)
  sectionHeader: {
    fontSize: '24px',
    fontWeight: theme.weight.semibold,
    color: theme.colors.text.primary,
    margin: 0,
    letterSpacing: '-0.02em',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },

  // Card Titles
  cardTitle: {
    fontSize: '16px',
    fontWeight: theme.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: '4px'
  },

  // Form Labels
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: theme.weight.medium,
    color: theme.colors.text.primary,
    marginBottom: '8px'
  },

  // Form Inputs
  formInput: {
    width: '100%',
    padding: '12px',
    background: theme.colors.bg.secondary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: '8px',
    color: theme.colors.text.primary,
    fontSize: '14px',
    fontFamily: 'inherit'
  }
}

// Helper function to get filter button style with active state
export const getFilterButtonStyle = (isActive) => ({
  ...standardStyles.filterButton,
  background: isActive ? theme.colors.white : 'rgba(255, 255, 255, 0.08)',
  color: isActive ? theme.colors.black : theme.colors.text.secondary
})

// Helper function to get primary button hover state
export const getPrimaryButtonHover = () => ({
  background: '#a3a3a3',
  transform: 'translateY(-1px)'
})

// Helper function to get secondary button hover state
export const getSecondaryButtonHover = () => ({
  background: theme.colors.bg.hover,
  borderColor: theme.colors.border.medium
})