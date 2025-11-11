# Sway Application - Accessibility Features

## Overview

The Sway application has been enhanced with comprehensive accessibility features to ensure WCAG 2.1 AA compliance and provide an excellent experience for all users, including those using assistive technologies.

## Key Accessibility Features

### 1. Keyboard Navigation

#### Global Keyboard Shortcuts

All keyboard shortcuts support both Mac (Cmd) and Windows/Linux (Ctrl) platforms.

| Shortcut | Action | Context |
|----------|--------|---------|
| **Tab** | Navigate forward through interactive elements | Global |
| **Shift+Tab** | Navigate backward through interactive elements | Global |
| **Enter** | Activate focused element | Global |
| **Space** | Activate buttons/checkboxes | Global |
| **Escape** | Close modals/deselect elements | Global |

#### Builder-Specific Keyboard Shortcuts

When using the form builder, the following keyboard shortcuts are available:

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl/Cmd+Z** | Undo | Undo the last action |
| **Ctrl/Cmd+Y** or **Ctrl/Cmd+Shift+Z** | Redo | Redo the last undone action |
| **Ctrl/Cmd+C** | Copy | Copy selected element to clipboard |
| **Ctrl/Cmd+V** | Paste | Paste element from clipboard |
| **Delete** or **Backspace** | Delete | Delete selected element(s) |
| **Arrow Keys** | Nudge 1px | Move selected element by 1 pixel |
| **Shift+Arrow Keys** | Nudge 10px | Move selected element by 10 pixels |
| **Escape** | Deselect | Clear element selection |
| **Ctrl/Cmd+S** | Save | Save the current form |

### 2. Screen Reader Support

#### ARIA Attributes

All interactive components include proper ARIA attributes:

- **role attributes**: Properly identify component types (button, dialog, application, etc.)
- **aria-label**: Descriptive labels for icon-only buttons
- **aria-labelledby**: Associate labels with form fields
- **aria-describedby**: Provide additional context for complex elements
- **aria-live**: Announce dynamic content changes (toasts, status updates)
- **aria-pressed**: Indicate toggle button states
- **aria-modal**: Identify modal dialogs
- **aria-busy**: Indicate loading states

#### Live Regions

Dynamic content updates are announced to screen readers:

- **Toast notifications**: Use `aria-live="polite"` for info/success, `aria-live="assertive"` for errors
- **Status updates**: Form save status, loading states, etc.
- **Dynamic content**: New elements added to the canvas

### 3. Focus Management

#### Visible Focus Indicators

Custom focus indicators with high contrast:

- **2px solid white outline** with 2px offset
- **4px rgba(255, 255, 255, 0.2) box shadow** for glow effect
- **Visible on all interactive elements**: buttons, links, inputs, canvas elements

#### Focus Trapping

Modal dialogs and overlays trap focus:

- **Tab** navigation cycles through modal elements only
- **Shift+Tab** reverses tab order
- Focus automatically moves to first element on open
- Focus returns to trigger element on close
- **Escape** key closes modal

#### Skip to Main Content

A skip link is provided for keyboard users:

- Appears on first **Tab** press
- Allows bypassing navigation to jump directly to main content
- Improves efficiency for keyboard and screen reader users

### 4. Form Accessibility

#### Accessible Form Fields

- All form fields have associated labels
- Required fields indicated with `aria-required="true"`
- Error messages linked with `aria-describedby`
- Input validation with clear error messages
- Minimum 44x44px touch targets (WCAG 2.1 AA)

#### Form Validation

- **Real-time validation** with screen reader announcements
- **Error messages** clearly associated with fields
- **Success messages** announced on successful submission

### 5. Color and Contrast

#### High Contrast Ratios

All text meets WCAG AA standards:

- **Primary text** (white): 21:1 contrast ratio on black background
- **Secondary text** (light gray): 14:1 contrast ratio
- **Tertiary text** (medium gray): 7:1 contrast ratio

#### High Contrast Mode Support

The application adapts to system high contrast preferences:

- Thicker focus outlines (3px)
- Enhanced borders on interactive elements
- Increased spacing for clarity

### 6. Motion and Animation

#### Reduced Motion Support

Respects `prefers-reduced-motion` preference:

- Animations reduced to near-instant transitions
- Scroll behavior becomes instant
- Motion-triggered effects disabled

## Component-Specific Accessibility

### BuilderCanvas

- **Role**: `application`
- **Keyboard navigable**: Canvas is focusable with `tabIndex={0}`
- **Screen reader description**: Instructions for keyboard navigation
- **ARIA label**: "Form builder canvas"

### BuilderToolbar

- **Semantic HTML**: Uses `<header>` element
- **Role**: `banner` and `toolbar`
- **Grouped controls**: Zoom controls grouped with `role="group"`
- **Button labels**: All buttons have descriptive `aria-label` attributes
- **Keyboard shortcuts in labels**: e.g., "Undo (Ctrl+Z)"

### Toast Notifications

- **Role**: `alert`
- **Live region**: `aria-live="polite"` (or `"assertive"` for errors)
- **Atomic**: `aria-atomic="true"` ensures entire message is read

### ConfirmModal

- **Role**: `dialog`
- **Modal**: `aria-modal="true"`
- **Labeled**: `aria-labelledby` and `aria-describedby`
- **Focus trap**: Keyboard focus trapped within modal
- **Escape key**: Closes modal
- **Auto-focus**: First focusable element focused on open
- **Return focus**: Focus returned to trigger element on close

### Layout

- **Skip link**: Allows bypassing navigation
- **Main landmark**: `<main>` element with `id="main-content"`
- **Semantic structure**: Proper use of header, nav, main elements

## Utility Hooks

### useKeyboardShortcuts

Centralized keyboard shortcut management:

```javascript
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'

function MyComponent() {
  useKeyboardShortcuts({
    'mod+s': handleSave,
    'mod+z': handleUndo,
    'escape': handleClose
  })
}
```

Features:
- Platform detection (Mac vs Windows/Linux)
- 'mod' key maps to Cmd on Mac, Ctrl on Windows/Linux
- Prevents conflicts with browser shortcuts
- Disabled when typing in form fields
- Optional `getShortcutDisplay()` for UI display

### useFocusTrap

Modal focus management:

```javascript
import useFocusTrap from './hooks/useFocusTrap'

function Modal({ isOpen, onClose }) {
  const { containerRef } = useFocusTrap(isOpen)

  return (
    <div ref={containerRef}>
      {/* Modal content */}
    </div>
  )
}
```

Features:
- Traps focus within container
- Tab/Shift+Tab navigation wraps
- Auto-focuses first element
- Returns focus to previous element on unmount

### useBuilderKeyboardShortcuts

Builder-specific shortcuts:

```javascript
import useBuilderKeyboardShortcuts from './features/builder/hooks/useBuilderKeyboardShortcuts'

function BuilderPage() {
  useBuilderKeyboardShortcuts(handleSave)
  // All builder shortcuts are now active
}
```

## Accessibility Utilities

Located in `/src/utils/accessibility.js`:

### initAccessibility()
Initializes all accessibility features (called on app load)

### announceToScreenReader(message, priority)
Announces messages to screen readers using live regions

### trapFocus(container, onEscape)
Manually trap focus within a container

### prefersReducedMotion()
Check if user prefers reduced motion

### prefersHighContrast()
Check if user prefers high contrast

### getFocusableElements(container)
Get all focusable elements within a container

### focusFirstElement(container)
Move focus to first focusable element

## Testing Accessibility

### Manual Testing

1. **Keyboard Navigation**
   - Navigate entire app using only Tab/Shift+Tab
   - Verify all interactive elements are reachable
   - Ensure focus is visible on all elements
   - Test keyboard shortcuts in builder

2. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify all content is announced
   - Check form labels and error messages
   - Verify toast notifications are announced

3. **Focus Trap Testing**
   - Open modal and tab through elements
   - Verify focus doesn't escape modal
   - Verify Escape key closes modal
   - Verify focus returns to trigger element

4. **Skip Link Testing**
   - Press Tab on page load
   - Verify skip link appears
   - Activate skip link
   - Verify focus moves to main content

### Automated Testing

Use tools like:
- **axe DevTools**: Browser extension for automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Chrome DevTools accessibility audit

## Browser Support

Accessibility features supported in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Standards Compliance

This implementation follows:

- **WCAG 2.1 Level AA**: Web Content Accessibility Guidelines
- **ARIA 1.2**: Accessible Rich Internet Applications
- **Section 508**: US Federal accessibility standards
- **ADA**: Americans with Disabilities Act requirements

## Future Enhancements

Planned accessibility improvements:

- [ ] Voice control support
- [ ] Custom keyboard shortcut configuration
- [ ] High contrast theme toggle
- [ ] Font size adjustment controls
- [ ] Alternative input methods (switch control, eye tracking)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

## Support

For accessibility issues or questions, please contact:
- Email: support@sway.com
- Create an issue on GitHub
- Accessibility feedback form (coming soon)
