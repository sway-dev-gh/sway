const theme = {
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px'
  },
  colors: {
    bg: {
      page: '#000000',
      card: '#000000',
      cardHover: '#0a0a0a',
      hover: '#0a0a0a',
      sidebar: '#000000',
      secondary: '#000000',
      tertiary: '#0a0a0a'
    },
    text: {
      primary: '#ffffff',
      secondary: '#8a8a8a',
      tertiary: '#4a4a4a',
      muted: '#2a2a2a'
    },
    border: {
      light: '#1a1a1a',
      medium: '#1a1a1a',
      dark: '#2a2a2a'
    },
    white: '#ffffff',
    black: '#000000',
    accent: '#ffffff',
    success: '#ffffff',
    warning: '#ffffff',
    error: '#ff3b30'
  },
  shadows: {
    none: 'none',
    sm: 'none',
    md: 'none',
    lg: 'none',
    xl: 'none',
    '2xl': 'none'
  },
  spacing: {
    1: '2px',
    2: '4px',
    3: '8px',
    4: '12px',
    5: '16px',
    6: '24px',
    7: '32px',
    8: '40px',
    10: '48px',
    12: '64px',
    16: '96px',
    20: '128px',
    24: '160px'
  },
  layout: {
    // Standard page container
    pageContainer: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '48px 32px',
      paddingBottom: '120px'
    },
    // Standard page with sidebar
    pageWithSidebar: {
      minHeight: '100vh',
      paddingTop: '54px'
    },
    // Standard section spacing
    sectionGap: '48px',
    // Standard card padding
    cardPadding: '24px',
    // Standard form field gap
    formFieldGap: '24px'
  },
  alerts: {
    error: {
      padding: '12px 16px',
      background: 'rgba(255, 68, 68, 0.05)',
      border: '1px solid rgba(255, 68, 68, 0.2)',
      borderRadius: '8px',
      color: '#ff4444',
      fontSize: '13px',
      lineHeight: '1.5',
      marginBottom: '24px',
      fontWeight: '400'
    },
    success: {
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '13px',
      lineHeight: '1.5',
      marginBottom: '24px',
      fontWeight: '400'
    },
    info: {
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '8px',
      color: '#a3a3a3',
      fontSize: '13px',
      lineHeight: '1.5',
      marginBottom: '24px',
      fontWeight: '400'
    }
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
    '5xl': '64px',
    '6xl': '72px'
  },
  weight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  },
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
  },
  radius: {
    none: '0px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px'
  },
  transition: {
    none: 'none',
    fast: '0.1s ease',
    normal: '0.15s ease',
    slow: '0.2s ease'
  },
  inputs: {
    // Standard text input
    text: {
      base: {
        width: '100%',
        height: '44px',
        padding: '0 16px',
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '8px',
        color: '#ffffff',
        fontSize: '15px',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxSizing: 'border-box'
      },
      focus: {
        borderColor: '#262626',
        background: '#0a0a0a',
        boxShadow: '0 0 0 3px rgba(38, 38, 38, 0.1)'
      },
      error: {
        borderColor: '#ff4444',
        background: '#0a0a0a'
      }
    },
    // Textarea
    textarea: {
      base: {
        width: '100%',
        padding: '12px 16px',
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: '8px',
        color: '#ffffff',
        fontSize: '15px',
        fontFamily: 'inherit',
        outline: 'none',
        resize: 'vertical',
        minHeight: '120px',
        lineHeight: '1.5',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxSizing: 'border-box'
      },
      focus: {
        borderColor: '#262626',
        background: '#0a0a0a',
        boxShadow: '0 0 0 3px rgba(38, 38, 38, 0.1)'
      },
      error: {
        borderColor: '#ff4444',
        background: '#0a0a0a'
      }
    },
    // Label
    label: {
      display: 'block',
      fontSize: '12px',
      color: '#a3a3a3',
      marginBottom: '8px',
      fontWeight: '500',
      letterSpacing: '0.01em'
    },
    // Helper text
    helper: {
      fontSize: '12px',
      color: '#737373',
      marginTop: '6px',
      lineHeight: '1.4'
    },
    // Error text
    errorText: {
      fontSize: '12px',
      color: '#ff4444',
      marginTop: '6px',
      lineHeight: '1.4'
    }
  },
  buttons: {
    // Primary button - white background, black text
    primary: {
      base: {
        height: '44px',
        padding: '0 24px',
        background: '#ffffff',
        color: '#000000',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      hover: {
        background: '#e5e5e5'
      },
      disabled: {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    },
    // Secondary button - transparent with border
    secondary: {
      base: {
        height: '44px',
        padding: '0 24px',
        background: 'transparent',
        color: '#ffffff',
        border: '1px solid #262626',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      hover: {
        background: 'rgba(255, 255, 255, 0.05)',
        borderColor: '#404040'
      },
      disabled: {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    },
    // Danger button - red theme
    danger: {
      base: {
        height: '44px',
        padding: '0 24px',
        background: 'rgba(255, 68, 68, 0.1)',
        color: '#ff4444',
        border: '1px solid rgba(255, 68, 68, 0.3)',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      hover: {
        background: '#ff4444',
        color: '#ffffff',
        borderColor: '#ff4444'
      },
      disabled: {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    },
    // Ghost button - minimal, text only
    ghost: {
      base: {
        height: '44px',
        padding: '0 24px',
        background: 'transparent',
        color: '#8a8a8a',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      hover: {
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#ffffff'
      },
      disabled: {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    }
  }
}

export default theme
