# Animation System

Professional, performant animations powered by Framer Motion. All animations are optimized for 60fps performance and respect user motion preferences.

## Quick Start

```jsx
import { motion } from 'framer-motion'
import { fadeIn, modalVariants, smooth } from '@/lib/animations'

// Simple fade in
<motion.div {...fadeIn}>
  Content
</motion.div>

// Modal with backdrop
<AnimatePresence>
  {isOpen && (
    <motion.div variants={backdropVariants}>
      <motion.div variants={modalVariants}>
        Modal content
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

## Animation Variants

### Basic Animations

- **fadeIn** - Smooth opacity fade
- **slideUp** - Slide from bottom with fade
- **slideDown** - Slide from top with fade (ideal for toasts)
- **scaleIn** - Scale up with fade

### Modal Animations

- **modalVariants** - Modal dialog animation (fade + scale + slight y movement)
- **backdropVariants** - Backdrop overlay fade

### List Animations

- **staggerChildren** - Container for staggered child animations
- **staggerItem** - Individual item in staggered list

### Page Transitions

- **pageTransition** - Smooth page route changes

### Interactive Elements

- **hoverScale** - Subtle scale on hover (1.02x)
- **tapScale** - Press feedback (0.98x)
- **cardHoverVariants** - Card lift effect with hover state

### Special Effects

- **toastVariants** - Toast notification slide-in from bottom
- **expandVariants** - Height-based expand/collapse
- **rotateVariants** - 180° rotation for toggles
- **glowVariants** - Box shadow glow effect
- **shakeVariants** - Error shake animation
- **pulseVariants** - Loading pulse effect

## Spring Configurations

Springs provide natural, physics-based motion.

### Basic Springs

```jsx
import { smooth, snappy, bouncy } from '@/lib/animations'

<motion.div
  animate={{ x: 100 }}
  transition={smooth}
/>
```

- **smooth** - Professional, subtle (most common)
- **snappy** - Instant feedback
- **bouncy** - Playful, energetic
- **gentle** - Slow, elegant
- **stiff** - Immediate, minimal bounce
- **wobbly** - Exaggerated bounce (use sparingly)

### Context-Specific Springs

```jsx
import { springs } from '@/lib/animations'

// For drag interactions
<motion.div drag transition={springs.drag} />

// For modals
<motion.div variants={modalVariants} transition={springs.modal} />

// For buttons
<motion.button whileHover={{ scale: 1.05 }} transition={springs.tap} />
```

Available: `drag`, `modal`, `tap`, `hover`, `page`, `toast`, `dropdown`

## Usage Examples

### Toast Notifications

```jsx
import { AnimatePresence, motion } from 'framer-motion'
import { toastVariants, staggerChildren } from '@/lib/animations'

function ToastContainer({ toasts }) {
  return (
    <motion.div variants={staggerChildren}>
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
```

### Modal Dialog

```jsx
import { AnimatePresence, motion } from 'framer-motion'
import { modalVariants, backdropVariants } from '@/lib/animations'

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Dashboard Cards (Stagger)

```jsx
import { motion } from 'framer-motion'
import { staggerChildren, staggerItem } from '@/lib/animations'

function Dashboard({ cards }) {
  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
    >
      {cards.map(card => (
        <motion.div
          key={card.id}
          variants={staggerItem}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {card.content}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### Draggable Elements

```jsx
import { motion } from 'framer-motion'
import { springs } from '@/lib/animations'

function DraggableElement({ element, isDragging }) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      whileHover={{ scale: 1.005 }}
      animate={isDragging ? { scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' } : {}}
      transition={springs.drag}
      layout
    >
      {element.content}
    </motion.div>
  )
}
```

### Interactive Buttons

```jsx
import { motion } from 'framer-motion'

function Button({ children, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.button>
  )
}
```

### Page Transitions

```jsx
import { motion, AnimatePresence } from 'framer-motion'
import { pageTransition } from '@/lib/animations'
import { useLocation } from 'react-router-dom'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        {...pageTransition}
      >
        {/* Route content */}
      </motion.div>
    </AnimatePresence>
  )
}
```

## Performance Guidelines

### 60fps Animations

All animations are optimized for 60fps by:
- Keeping durations under 300ms
- Using GPU-accelerated properties (transform, opacity)
- Avoiding layout-triggering properties when possible
- Using `layout` prop for layout animations

### Accessibility

All animations automatically respect `prefers-reduced-motion`:

```jsx
import { getMotionPreference, safeTransition } from '@/lib/animations'

// Check user preference
const shouldAnimate = getMotionPreference()

// Safe transition that respects preference
<motion.div
  animate={{ x: 100 }}
  transition={safeTransition(smooth)}
/>
```

### Best Practices

1. **Use presets** - Start with `presets.toast`, `presets.modal`, etc.
2. **Keep it subtle** - Less is more for professional UX
3. **Respect motion preferences** - Always use `safeTransition` for custom animations
4. **Use layout animations** - Add `layout` prop for smooth position changes
5. **Optimize list animations** - Use `AnimatePresence` with `mode="popLayout"`
6. **Test performance** - Ensure 60fps on target devices

## Component Integration

### Already Integrated

✅ Toast notifications - Slide in with stagger
✅ ToastContainer - Staggered children
✅ ConfirmModal - Fade + scale
✅ CreateRequestModal - Fade + scale with backdrop
✅ Dashboard cards - Stagger fade in with hover effects
✅ BuilderCanvas elements - Smooth drag with hover states

### Future Enhancements

Consider adding animations to:
- Page route transitions
- Dropdown menus
- Sidebar navigation
- Form validation errors
- Loading states
- Empty states
- Success confirmations

## Easing Curves

For tween-based animations (non-spring):

```jsx
import { easings, durations } from '@/lib/animations'

<motion.div
  animate={{ opacity: 1 }}
  transition={{
    duration: durations.normal,
    ease: easings.easeOut
  }}
/>
```

Available easings:
- `easeOut` - Most common, smooth
- `easeInOut` - Symmetrical
- `sharpOut` - Quick start, slow end
- `gentle` - Subtle
- `anticipate` - Slight back before forward
- `overshoot` - Slight bounce at end

## Troubleshooting

### Animation not working
- Ensure `AnimatePresence` wraps conditional content
- Check that `key` prop is unique and stable
- Verify Framer Motion is imported correctly

### Janky animations
- Use transform/opacity instead of width/height/top/left
- Add `layout` prop for layout changes
- Check if multiple animations are conflicting

### Motion preference not respected
- Use `safeTransition` helper
- Framer Motion respects this automatically for variant-based animations

## Dependencies

- **framer-motion**: ^12.23.24

## Documentation

For more advanced usage, see [Framer Motion docs](https://www.framer.com/motion/).
