/**
 * Spring Configurations for Framer Motion
 *
 * Different spring presets for various interaction types
 * Springs provide natural, physics-based motion
 */

// Smooth spring - professional, subtle
export const smooth = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8
}

// Snappy spring - instant feedback
export const snappy = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.5
}

// Bouncy spring - playful, energetic
export const bouncy = {
  type: 'spring',
  stiffness: 400,
  damping: 20,
  mass: 0.8
}

// Gentle spring - slow, elegant
export const gentle = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1
}

// Stiff spring - immediate, minimal bounce
export const stiff = {
  type: 'spring',
  stiffness: 600,
  damping: 40,
  mass: 0.5
}

// Wobbly spring - exaggerated bounce (use sparingly)
export const wobbly = {
  type: 'spring',
  stiffness: 300,
  damping: 15,
  mass: 1.2
}

/**
 * Interaction-specific spring presets
 */
export const springs = {
  // For drag interactions
  drag: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 0.8
  },

  // For modal animations
  modal: {
    type: 'spring',
    stiffness: 400,
    damping: 32,
    mass: 0.7
  },

  // For button presses
  tap: {
    type: 'spring',
    stiffness: 600,
    damping: 40,
    mass: 0.5
  },

  // For hover effects
  hover: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 0.6
  },

  // For page transitions
  page: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.8
  },

  // For toast notifications
  toast: {
    type: 'spring',
    stiffness: 400,
    damping: 28,
    mass: 0.7
  },

  // For dropdowns/popovers
  dropdown: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 0.6
  }
}

/**
 * Easing curves (alternative to springs)
 * Use for more controlled, less bouncy animations
 */
export const easings = {
  // Smooth ease out - most common
  easeOut: [0.22, 1, 0.36, 1],

  // Ease in out - symmetrical
  easeInOut: [0.45, 0, 0.55, 1],

  // Sharp ease out - quick start, slow end
  sharpOut: [0.4, 0, 0.2, 1],

  // Gentle ease - subtle
  gentle: [0.25, 0.46, 0.45, 0.94],

  // Anticipated - slight back before forward
  anticipate: [0.68, -0.55, 0.265, 1.55],

  // Overshoot - slight bounce at end
  overshoot: [0.34, 1.56, 0.64, 1]
}

/**
 * Duration presets (in seconds)
 */
export const durations = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  medium: 0.25,
  slow: 0.3,
  slower: 0.4
}

/**
 * Helper function to create a custom transition
 */
export const createTransition = (preset = 'smooth', duration = null) => {
  const springPreset = springs[preset] || smooth

  if (duration !== null) {
    // If duration is specified, use tween instead of spring
    return {
      type: 'tween',
      duration,
      ease: easings.easeOut
    }
  }

  return springPreset
}

/**
 * Responsive motion settings
 * Reduces motion for users who prefer reduced motion
 */
export const getMotionPreference = () => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  return !mediaQuery.matches
}

/**
 * Safe transition getter that respects motion preferences
 */
export const safeTransition = (transition) => {
  if (!getMotionPreference()) {
    // If user prefers reduced motion, use instant transitions
    return { duration: 0.01 }
  }
  return transition
}
