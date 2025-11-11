/**
 * Framer Motion Animation Variants
 *
 * Reusable animation variants for consistent, professional animations
 * All animations are under 300ms for snappy UX
 * Respects prefers-reduced-motion automatically via Framer Motion
 */

// Fade in animation - smooth opacity transition
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
}

// Slide up animation - content slides from bottom
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
}

// Slide down animation - content slides from top (for toasts)
export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
}

// Scale in animation - elements scale on mount
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
}

// Modal animation - fade + scale for dialogs
export const modalVariants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 10 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
}

// Modal backdrop animation
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
}

// Stagger children animation - for lists and grids
export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
}

// Child item for stagger animations
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
}

// Page transition - for route changes
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
}

// Hover scale for interactive elements
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] }
}

// Tap/press animation for buttons
export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1, ease: [0.22, 1, 0.36, 1] }
}

// Slide in from right (for sidebars/panels)
export const slideInRight = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
}

// Slide in from left
export const slideInLeft = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
}

// Toast notification animation (slide from bottom-right)
export const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
}

// Expand animation for collapsible content
export const expandVariants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
}

// Rotate animation for icons/indicators
export const rotateVariants = {
  initial: { rotate: 0 },
  animate: { rotate: 180 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
}

// Card hover animation - subtle lift
export const cardHoverVariants = {
  rest: { y: 0, boxShadow: 'none' },
  hover: {
    y: -2,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
  }
}

// Glow effect for buttons (via boxShadow)
export const glowVariants = {
  rest: { boxShadow: '0 0 0 0 rgba(255, 255, 255, 0)' },
  hover: {
    boxShadow: '0 0 20px 2px rgba(255, 255, 255, 0.15)',
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
  }
}

// Shake animation for errors
export const shakeVariants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
}

// Pulse animation for loading states
export const pulseVariants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.6, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

/**
 * Preset animation combinations for common use cases
 */
export const presets = {
  // For toast notifications
  toast: {
    ...toastVariants,
    layout: true // Enable layout animations
  },

  // For modals/dialogs
  modal: {
    ...modalVariants,
    layout: true
  },

  // For backdrop overlays
  backdrop: {
    ...backdropVariants
  },

  // For cards in a grid
  card: {
    ...staggerItem,
    whileHover: hoverScale,
    whileTap: tapScale
  },

  // For buttons
  button: {
    whileHover: hoverScale,
    whileTap: tapScale
  },

  // For page content
  page: {
    ...pageTransition
  }
}
