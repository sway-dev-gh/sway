// Terminal-aesthetic animation configurations
// All animations are subtle and maintain the black & white aesthetic

export const terminalAnimations = {
  // Breathing effects for active elements
  breath: {
    animate: {
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.02, 1]
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Subtle pulse for activity indicators
  pulse: {
    animate: {
      opacity: [0.4, 1, 0.4]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Quick pulse for notifications
  quickPulse: {
    animate: {
      opacity: [0.2, 1, 0.2],
      scale: [1, 1.05, 1]
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Fade in animations for content
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Slide animations for panels
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.4, ease: "easeInOut" }
  },

  // Expansion animations for collapsible content
  expand: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
    transition: {
      duration: 0.3,
      ease: "easeInOut",
      height: { duration: 0.4 }
    }
  },

  // Subtle scale for interactive elements
  scale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.15, ease: "easeInOut" }
  },

  // Minimal scale for buttons
  buttonScale: {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
    transition: { duration: 0.1, ease: "easeInOut" }
  },

  // Tab switching animation
  tab: {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
    transition: { duration: 0.2, ease: "easeInOut" }
  },

  // Loading spinner for terminal aesthetic
  spinner: {
    animate: {
      rotate: [0, 180, 360]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }
  },

  // Typing indicator animation
  typing: {
    animate: {
      opacity: [0, 1, 0]
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Progress bar animation
  progress: {
    initial: { width: 0 },
    animate: (progress: number) => ({
      width: `${progress}%`
    }),
    transition: { duration: 0.5, ease: "easeOut" }
  },

  // Stagger children animation
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },

  // List item animation
  listItem: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
    transition: { duration: 0.2, ease: "easeOut" }
  },

  // Notification toast animation
  toast: {
    initial: { opacity: 0, y: -20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Modal/overlay animation
  modal: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: "easeInOut" }
  },

  // Modal content animation
  modalContent: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Chart/graph animation
  chart: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 1.5, ease: "easeInOut" }
  },

  // Counter animation
  counter: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1] },
    transition: { duration: 0.3, ease: "easeInOut" }
  },

  // Glow effect for active states
  glow: {
    animate: {
      boxShadow: [
        '0 0 0 rgba(255,255,255,0)',
        '0 0 10px rgba(255,255,255,0.1)',
        '0 0 0 rgba(255,255,255,0)'
      ]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Border animation for focus states
  border: {
    animate: {
      borderColor: ['#333333', '#ffffff', '#333333']
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Gradient text animation (subtle)
  gradientText: {
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "linear"
    }
  }
}

// Animation variants for different states
export const stateVariants = {
  idle: {
    opacity: 0.6,
    scale: 1
  },
  active: {
    opacity: 1,
    scale: 1.01
  },
  loading: {
    opacity: 0.8,
    rotate: 360
  },
  error: {
    opacity: 1,
    x: [-2, 2, -2, 2, 0]
  },
  success: {
    opacity: 1,
    scale: [1, 1.05, 1]
  }
}

// Transition presets for consistency
export const transitions = {
  fast: { duration: 0.15, ease: "easeOut" },
  medium: { duration: 0.3, ease: "easeInOut" },
  slow: { duration: 0.5, ease: "easeInOut" },
  spring: { type: "spring", stiffness: 300, damping: 30 },
  gentleSpring: { type: "spring", stiffness: 200, damping: 25 }
}

// Animation combinations for complex interactions
export const complexAnimations = {
  // Collaborative cursor animation
  cursor: {
    animate: {
      x: [0, 5, -2, 3, 0],
      y: [0, -2, 4, -1, 0]
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Team presence indicator
  presence: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Activity wave animation
  wave: {
    animate: {
      transform: [
        'translateX(-100%)',
        'translateX(0%)',
        'translateX(100%)'
      ],
      opacity: [0, 0.3, 0]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Data flow animation
  flow: {
    animate: {
      strokeDasharray: [0, 20],
      strokeDashoffset: [20, 0]
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear"
    }
  }
}

// Helper functions for dynamic animations
export const createDynamicAnimation = (
  baseAnimation: any,
  intensity: number = 1,
  speed: number = 1
) => ({
  ...baseAnimation,
  animate: Object.entries(baseAnimation.animate).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map(v => typeof v === 'number' ? v * intensity : v)
    } else if (typeof value === 'number') {
      acc[key] = value * intensity
    } else {
      acc[key] = value
    }
    return acc
  }, {} as any),
  transition: {
    ...baseAnimation.transition,
    duration: (baseAnimation.transition.duration || 1) / speed
  }
})

export const createStaggeredAnimation = (
  children: any[],
  baseDelay: number = 0.1
) => ({
  animate: {
    transition: {
      staggerChildren: baseDelay,
      delayChildren: baseDelay
    }
  }
})

// Terminal-specific animation utilities
export const terminalUtils = {
  // Create a typing effect for text
  typing: (text: string, speed: number = 50) => ({
    initial: { width: 0 },
    animate: { width: '100%' },
    transition: {
      duration: (text.length * speed) / 1000,
      ease: "linear"
    }
  }),

  // Create a blinking cursor
  cursor: {
    animate: { opacity: [1, 0, 1] },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Matrix-style cascade effect (very subtle for terminal)
  cascade: (delay: number = 0) => ({
    initial: { opacity: 0, y: -10 },
    animate: { opacity: [0, 1, 0.8], y: 0 },
    transition: {
      delay,
      duration: 0.5,
      ease: "easeOut"
    }
  })
}

export default terminalAnimations