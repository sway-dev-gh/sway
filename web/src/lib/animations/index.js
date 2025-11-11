/**
 * Animation System - Centralized exports
 *
 * Import animations from this single file:
 * import { fadeIn, modalVariants, smooth } from '@/lib/animations'
 */

// Export all variants
export {
  fadeIn,
  slideUp,
  slideDown,
  scaleIn,
  modalVariants,
  backdropVariants,
  staggerChildren,
  staggerItem,
  pageTransition,
  hoverScale,
  tapScale,
  slideInRight,
  slideInLeft,
  toastVariants,
  expandVariants,
  rotateVariants,
  cardHoverVariants,
  glowVariants,
  shakeVariants,
  pulseVariants,
  presets
} from './variants'

// Export all spring configurations
export {
  smooth,
  snappy,
  bouncy,
  gentle,
  stiff,
  wobbly,
  springs,
  easings,
  durations,
  createTransition,
  getMotionPreference,
  safeTransition
} from './springs'
