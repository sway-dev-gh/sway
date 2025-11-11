const theme = {
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px'
  },
  colors: {
    bg: {
      page: '#000000',           // Pure black
      card: '#000000',           // Pure black
      cardHover: '#0a0a0a',      // Hover state
      hover: '#0a0a0a',
      sidebar: '#000000',
      secondary: '#000000',
      tertiary: '#0a0a0a'
    },
    text: {
      primary: '#FFFFFF',        // Primary text
      secondary: '#9B9A97',      // Notion's secondary (brownish gray)
      tertiary: '#6C6C6C',       // Muted text
      muted: '#4A4A4A'          // Very muted
    },
    border: {
      light: '#2F2F2F',          // Subtle borders
      medium: '#373737',         // Default borders
      dark: '#4A4A4A'           // Emphasized borders
    },
    white: '#ffffff',
    black: '#000000',
    accent: '#ffffff',
    success: '#ffffff',
    warning: '#ffffff',
    error: '#EB5757'            // Notion's red
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 2px 4px rgba(0,0,0,0.3)',
    lg: '0 4px 8px rgba(0,0,0,0.3)',
    xl: '0 8px 16px rgba(0,0,0,0.3)',
    '2xl': '0 16px 32px rgba(0,0,0,0.3)'
  },
  spacing: {
    1: '2px',
    2: '4px',
    3: '6px',
    4: '8px',
    5: '12px',
    6: '16px',
    7: '20px',
    8: '24px',
    10: '32px',
    12: '40px',
    16: '64px',
    20: '80px',
    24: '96px'
  },
  layout: {
    pageContainer: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '40px 24px',
      paddingBottom: '100px'
    },
    pageWithSidebar: {
      minHeight: '100vh',
      paddingTop: '50px'
    },
    sectionGap: '32px',
    cardPadding: '16px',
    formFieldGap: '16px'
  },
  alerts: {
    error: {
      padding: '8px 12px',
      background: 'rgba(235, 87, 87, 0.06)',
      border: '1px solid rgba(235, 87, 87, 0.2)',
      borderRadius: '4px',
      color: '#EB5757',
      fontSize: '14px',
      lineHeight: '1.5',
      marginBottom: '12px',
      fontWeight: '400'
    },
    success: {
      padding: '8px 12px',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
      color: '#ffffff',
      fontSize: '14px',
      lineHeight: '1.5',
      marginBottom: '12px',
      fontWeight: '400'
    },
    info: {
      padding: '8px 12px',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '4px',
      color: '#9B9A97',
      fontSize: '14px',
      lineHeight: '1.5',
      marginBottom: '12px',
      fontWeight: '400'
    }
  },
  fontSize: {
    xs: '12px',
    sm: '14px',          // Base size in Notion
    base: '14px',        // Changed from 16px
    md: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '32px',
    '5xl': '40px',
    '6xl': '48px'
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
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'
  },
  radius: {
    none: '0px',
    sm: '3px',           // Notion's small radius
    md: '4px',           // Notion's default radius
    lg: '6px',
    xl: '8px',
    '2xl': '12px',
    '3xl': '16px',
    full: '9999px'
  },
  transition: {
    none: 'none',
    fast: '0.1s ease',
    normal: '0.15s ease',
    slow: '0.2s ease'
  },
  inputs: {
    text: {
      base: {
        width: '100%',
        height: '36px',        // Smaller, Notion-like
        padding: '0 12px',
        background: '#191919',
        border: '1px solid #373737',
        borderRadius: '4px',
        color: '#ffffff',
        fontSize: '14px',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        boxSizing: 'border-box'
      },
      focus: {
        borderColor: '#4A4A4A',
        background: '#1E1E1E'
      },
      error: {
        borderColor: '#EB5757',
        background: '#191919'
      }
    },
    textarea: {
      base: {
        width: '100%',
        padding: '8px 12px',
        background: '#191919',
        border: '1px solid #373737',
        borderRadius: '4px',
        color: '#ffffff',
        fontSize: '14px',
        fontFamily: 'inherit',
        outline: 'none',
        resize: 'vertical',
        minHeight: '80px',
        lineHeight: '1.5',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        boxSizing: 'border-box'
      },
      focus: {
        borderColor: '#4A4A4A',
        background: '#1E1E1E'
      },
      error: {
        borderColor: '#EB5757',
        background: '#191919'
      }
    },
    label: {
      display: 'block',
      fontSize: '14px',
      color: '#9B9A97',
      marginBottom: '6px',
      fontWeight: '500',
      letterSpacing: '0'
    },
    helper: {
      fontSize: '13px',
      color: '#6C6C6C',
      marginTop: '4px',
      lineHeight: '1.4'
    },
    errorText: {
      fontSize: '13px',
      color: '#EB5757',
      marginTop: '4px',
      lineHeight: '1.4'
    }
  },
  buttons: {
    primary: {
      base: {
        height: '32px',          // Smaller, Notion-like
        padding: '0 12px',
        background: '#ffffff',
        color: '#000000',
        border: 'none',
        borderRadius: '4px',
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
        background: '#E5E5E5'
      },
      disabled: {
        opacity: 0.4,
        cursor: 'not-allowed'
      }
    },
    secondary: {
      base: {
        height: '32px',
        padding: '0 12px',
        background: 'transparent',
        color: '#9B9A97',
        border: '1px solid #373737',
        borderRadius: '4px',
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
        background: '#252525',
        borderColor: '#4A4A4A',
        color: '#ffffff'
      },
      disabled: {
        opacity: 0.4,
        cursor: 'not-allowed'
      }
    },
    danger: {
      base: {
        height: '32px',
        padding: '0 12px',
        background: 'rgba(235, 87, 87, 0.1)',
        color: '#EB5757',
        border: '1px solid rgba(235, 87, 87, 0.3)',
        borderRadius: '4px',
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
        background: '#EB5757',
        color: '#ffffff',
        borderColor: '#EB5757'
      },
      disabled: {
        opacity: 0.4,
        cursor: 'not-allowed'
      }
    },
    ghost: {
      base: {
        height: '32px',
        padding: '0 12px',
        background: 'transparent',
        color: '#9B9A97',
        border: 'none',
        borderRadius: '4px',
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
        background: '#252525',
        color: '#ffffff'
      },
      disabled: {
        opacity: 0.4,
        cursor: 'not-allowed'
      }
    }
  }
}

export default theme
