import theme from '../../../theme'

/**
 * Component Library - Available elements for the builder
 * Each component has metadata and plan restrictions
 */
export const COMPONENT_LIBRARY = [
  // FREE ELEMENTS - Core file collection
  {
    id: 'heading',
    label: 'Heading',
    icon: 'HEAD',
    description: 'Big title text',
    plan: 'free'
  },
  {
    id: 'text',
    label: 'Text',
    icon: 'TEXT',
    description: 'Instructions or descriptions',
    plan: 'free'
  },
  {
    id: 'file-upload',
    label: 'File Upload',
    icon: 'FILE',
    description: 'Drag & drop zone',
    plan: 'free'
  },
  {
    id: 'text-input',
    label: 'Text Field',
    icon: 'INPUT',
    description: 'Get their name or email',
    plan: 'free'
  },
  {
    id: 'button',
    label: 'Button',
    icon: 'BTN',
    description: 'Submit button',
    plan: 'free'
  },
  // PRO ELEMENTS - Advanced file collection
  {
    id: 'multi-file',
    label: 'Multi-File',
    icon: 'MF',
    description: 'Upload multiple files',
    plan: 'pro'
  },
  {
    id: 'image-gallery',
    label: 'Image Upload',
    icon: 'GAL',
    description: 'Image-only uploader',
    plan: 'pro'
  },
  {
    id: 'divider',
    label: 'Divider',
    icon: 'DIV',
    description: 'Horizontal line',
    plan: 'pro'
  },
  {
    id: 'spacer',
    label: 'Spacer',
    icon: 'SPACE',
    description: 'Empty space',
    plan: 'pro'
  },
  {
    id: 'two-column',
    label: 'Two Columns',
    icon: '2COL',
    description: 'Side-by-side layout',
    plan: 'pro'
  }
]

/**
 * Default properties for each component type
 */
export const DEFAULT_PROPERTIES = {
  'text': {
    content: 'Enter your text here',
    fontSize: '16px',
    color: theme.colors.text.secondary,
    fontWeight: '400',
    textAlign: 'left'
  },
  'heading': {
    content: 'Heading Text',
    fontSize: '32px',
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center'
  },
  'text-input': {
    label: 'Input Field',
    placeholder: 'Enter text',
    required: false
  },
  'textarea': {
    label: 'Text Area',
    placeholder: 'Enter your text here...',
    rows: 4,
    required: false
  },
  'file-upload': {
    label: 'Upload your files',
    accept: '*',
    multiple: true
  },
  'button': {
    label: 'Submit',
    backgroundColor: theme.colors.white,
    color: theme.colors.black
  },
  'rich-text': {
    label: 'Rich Text',
    placeholder: 'Enter formatted text...',
    required: false
  },
  'multi-file': {
    label: 'Upload multiple files',
    maxFiles: 10,
    accept: '*'
  },
  'image-gallery': {
    label: 'Image Gallery',
    gridSize: '2x3'
  },
  'date-picker': {
    label: 'Select Date',
    required: false
  },
  'time-picker': {
    label: 'Select Time',
    required: false
  },
  'color-picker': {
    label: 'Choose Color',
    defaultColor: theme.colors.accent
  },
  'range-slider': {
    label: 'Select Value',
    min: 0,
    max: 100,
    step: 1
  },
  'star-rating': {
    label: 'Rate',
    maxStars: 5
  },
  'signature': {
    label: 'Signature',
    required: false
  },
  'divider': {
    thickness: '1px',
    color: theme.colors.text.tertiary
  },
  'spacer': {
    height: '40px'
  },
  'select': {
    label: 'Select Option',
    options: 'Option 1,Option 2,Option 3',
    required: false
  },
  'checkbox': {
    label: 'I agree to the terms',
    required: false
  },
  'image': {
    src: '',
    alt: 'Image placeholder',
    objectFit: 'cover'
  },
  'two-column': {
    gap: '20px'
  },
  'three-column': {
    gap: '20px'
  }
}

/**
 * Default sizes for each element type
 */
export const DEFAULT_SIZES = {
  'text': { width: 600, height: 40 },
  'heading': { width: 600, height: 50 },
  'text-input': { width: 400, height: 48 },
  'textarea': { width: 600, height: 120 },
  'file-upload': { width: 600, height: 120 },
  'button': { width: 200, height: 48 },
  'rich-text': { width: 600, height: 150 },
  'multi-file': { width: 600, height: 150 },
  'image-gallery': { width: 600, height: 300 },
  'date-picker': { width: 300, height: 48 },
  'time-picker': { width: 200, height: 48 },
  'color-picker': { width: 150, height: 48 },
  'range-slider': { width: 400, height: 48 },
  'star-rating': { width: 200, height: 48 },
  'signature': { width: 500, height: 150 },
  'divider': { width: 600, height: 2 },
  'spacer': { width: 100, height: 40 },
  'select': { width: 400, height: 48 },
  'checkbox': { width: 400, height: 24 },
  'image': { width: 300, height: 200 },
  'two-column': { width: 800, height: 200 },
  'three-column': { width: 900, height: 200 }
}
