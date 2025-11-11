import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import { canCreateForm } from '../utils/planUtils'
import api from '../api/axios'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

// TEMPLATES - Pre-configured form layouts
const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with an empty canvas',
    plan: 'free',
    preview: 'Empty canvas - build exactly what you need',
    elements: []
  },
  {
    id: 'simple',
    name: 'Simple File Request',
    description: 'Basic heading + file upload + button',
    plan: 'free',
    preview: 'Perfect for basic file collection',
    elements: [
      {
        id: 'template-heading-1',
        type: 'heading',
        x: 100,
        y: 100,
        width: 800,
        height: 60,
        properties: {
          content: 'Upload Your Files',
          fontSize: '36px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'template-upload-1',
        type: 'file-upload',
        x: 100,
        y: 200,
        width: 800,
        height: 120,
        properties: {
          label: 'Drop your files here',
          accept: '*',
          multiple: true
        }
      },
      {
        id: 'template-button-1',
        type: 'button',
        x: 450,
        y: 360,
        width: 200,
        height: 48,
        properties: {
          label: 'Submit',
          backgroundColor: theme.colors.white,
          color: theme.colors.black
        }
      }
    ]
  },
  {
    id: 'contact',
    name: 'Contact + Upload',
    description: 'Name + email + message + file upload',
    plan: 'free',
    preview: 'Contact form with file upload capability',
    elements: [
      {
        id: 'template-heading-2',
        type: 'heading',
        x: 100,
        y: 30,
        width: 800,
        height: 40,
        properties: {
          content: 'Get In Touch',
          fontSize: '28px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'template-input-1',
        type: 'text-input',
        x: 100,
        y: 90,
        width: 800,
        height: 45,
        properties: {
          label: 'Full Name',
          placeholder: 'Enter your name'
        }
      },
      {
        id: 'template-input-2',
        type: 'text-input',
        x: 100,
        y: 155,
        width: 800,
        height: 45,
        properties: {
          label: 'Email',
          placeholder: 'your@email.com'
        }
      },
      {
        id: 'template-textarea-1',
        type: 'textarea',
        x: 100,
        y: 220,
        width: 800,
        height: 90,
        properties: {
          label: 'Message',
          placeholder: 'Your message here...'
        }
      },
      {
        id: 'template-upload-2',
        type: 'file-upload',
        x: 100,
        y: 330,
        width: 800,
        height: 80,
        properties: {
          label: 'Attach Files',
          accept: '*',
          multiple: true
        }
      },
      {
        id: 'template-button-2',
        type: 'button',
        x: 400,
        y: 430,
        width: 200,
        height: 45,
        properties: {
          label: 'Send Message',
          backgroundColor: theme.colors.white,
          color: theme.colors.black
        }
      }
    ]
  },
  // PRO TEMPLATES
  {
    id: 'agency',
    name: 'Agency Onboarding',
    description: 'Multi-section onboarding form',
    plan: 'pro',
    preview: 'Complete agency client onboarding with brand assets',
    elements: [
      {
        id: 'pro-image-1',
        type: 'image',
        x: 450,
        y: 20,
        width: 200,
        height: 60,
        properties: {
          src: '',
          alt: 'Company Logo'
        }
      },
      {
        id: 'pro-heading-1',
        type: 'heading',
        x: 100,
        y: 90,
        width: 800,
        height: 40,
        properties: {
          content: 'Client Onboarding',
          fontSize: '26px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'pro-divider-1',
        type: 'divider',
        x: 100,
        y: 140,
        width: 800,
        height: 2,
        properties: {}
      },
      {
        id: 'pro-text-1',
        type: 'text',
        x: 100,
        y: 152,
        width: 800,
        height: 24,
        properties: {
          content: 'Company Information',
          fontSize: '16px',
          color: theme.colors.text.primary,
          fontWeight: '600'
        }
      },
      {
        id: 'pro-input-1',
        type: 'text-input',
        x: 100,
        y: 186,
        width: 390,
        height: 40,
        properties: {
          label: 'Company Name',
          placeholder: 'Acme Inc.'
        }
      },
      {
        id: 'pro-input-2',
        type: 'text-input',
        x: 510,
        y: 186,
        width: 390,
        height: 40,
        properties: {
          label: 'Website',
          placeholder: 'www.example.com'
        }
      },
      {
        id: 'pro-select-1',
        type: 'select',
        x: 100,
        y: 242,
        width: 390,
        height: 40,
        properties: {
          label: 'Industry',
          options: 'Technology,Finance,Healthcare,Retail,Other'
        }
      },
      {
        id: 'pro-select-2',
        type: 'select',
        x: 510,
        y: 242,
        width: 390,
        height: 40,
        properties: {
          label: 'Project Budget',
          options: 'Under $10k,$10k-$50k,$50k-$100k,$100k+'
        }
      },
      {
        id: 'pro-divider-2',
        type: 'divider',
        x: 100,
        y: 292,
        width: 800,
        height: 2,
        properties: {}
      },
      {
        id: 'pro-text-2',
        type: 'text',
        x: 100,
        y: 304,
        width: 800,
        height: 24,
        properties: {
          content: 'Brand Assets',
          fontSize: '16px',
          color: theme.colors.text.primary,
          fontWeight: '600'
        }
      },
      {
        id: 'pro-multi-file-1',
        type: 'multi-file',
        x: 100,
        y: 338,
        width: 800,
        height: 100,
        properties: {
          label: 'Upload Brand Guide, Logos, and Assets',
          maxFiles: 10
        }
      },
      {
        id: 'pro-checkbox-1',
        type: 'checkbox',
        x: 100,
        y: 450,
        width: 800,
        height: 20,
        properties: {
          label: 'I agree to the terms and conditions'
        }
      },
      {
        id: 'pro-button-1',
        type: 'button',
        x: 450,
        y: 482,
        width: 200,
        height: 40,
        properties: {
          label: 'Submit',
          backgroundColor: theme.colors.white,
          color: theme.colors.black
        }
      }
    ]
  },
  {
    id: 'product',
    name: 'Product Submission Portal',
    description: 'E-commerce product submission with gallery',
    plan: 'pro',
    preview: 'Complete product submission with image gallery',
    elements: [
      {
        id: 'prod-heading-1',
        type: 'heading',
        x: 100,
        y: 20,
        width: 800,
        height: 40,
        properties: {
          content: 'Submit New Product',
          fontSize: '26px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'prod-input-1',
        type: 'text-input',
        x: 100,
        y: 75,
        width: 390,
        height: 40,
        properties: {
          label: 'Product Name',
          placeholder: 'Product title'
        }
      },
      {
        id: 'prod-input-2',
        type: 'text-input',
        x: 510,
        y: 75,
        width: 390,
        height: 40,
        properties: {
          label: 'SKU',
          placeholder: 'SKU-001'
        }
      },
      {
        id: 'prod-select-1',
        type: 'select',
        x: 100,
        y: 130,
        width: 250,
        height: 40,
        properties: {
          label: 'Category',
          options: 'Electronics,Clothing,Home,Sports,Books'
        }
      },
      {
        id: 'prod-input-3',
        type: 'text-input',
        x: 370,
        y: 130,
        width: 250,
        height: 40,
        properties: {
          label: 'Price',
          placeholder: '$99.99'
        }
      },
      {
        id: 'prod-rating-1',
        type: 'star-rating',
        x: 640,
        y: 130,
        width: 260,
        height: 40,
        properties: {
          label: 'Quality Rating'
        }
      },
      {
        id: 'prod-rich-text-1',
        type: 'rich-text',
        x: 100,
        y: 185,
        width: 800,
        height: 90,
        properties: {
          label: 'Product Description',
          placeholder: 'Detailed product description...'
        }
      },
      {
        id: 'prod-gallery-1',
        type: 'image-gallery',
        x: 100,
        y: 290,
        width: 800,
        height: 160,
        properties: {
          label: 'Product Images (up to 6)',
          gridSize: '2x3'
        }
      },
      {
        id: 'prod-button-1',
        type: 'button',
        x: 450,
        y: 465,
        width: 200,
        height: 40,
        properties: {
          label: 'Submit Product',
          backgroundColor: theme.colors.white,
          color: theme.colors.black
        }
      }
    ]
  },
  {
    id: 'event',
    name: 'Event Registration Pro',
    description: 'Complete event registration with photo ID',
    plan: 'pro',
    preview: 'Professional event registration form',
    elements: [
      {
        id: 'event-heading-1',
        type: 'heading',
        x: 100,
        y: 20,
        width: 800,
        height: 40,
        properties: {
          content: 'Event Registration',
          fontSize: '26px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'event-input-1',
        type: 'text-input',
        x: 100,
        y: 75,
        width: 390,
        height: 40,
        properties: {
          label: 'Full Name',
          placeholder: 'John Doe'
        }
      },
      {
        id: 'event-input-2',
        type: 'text-input',
        x: 510,
        y: 75,
        width: 390,
        height: 40,
        properties: {
          label: 'Email',
          placeholder: 'john@example.com'
        }
      },
      {
        id: 'event-input-3',
        type: 'text-input',
        x: 100,
        y: 130,
        width: 390,
        height: 40,
        properties: {
          label: 'Company',
          placeholder: 'Company name'
        }
      },
      {
        id: 'event-input-4',
        type: 'text-input',
        x: 510,
        y: 130,
        width: 390,
        height: 40,
        properties: {
          label: 'Job Title',
          placeholder: 'Position'
        }
      },
      {
        id: 'event-select-1',
        type: 'select',
        x: 100,
        y: 185,
        width: 390,
        height: 40,
        properties: {
          label: 'Ticket Type',
          options: 'VIP Pass,Standard,Press'
        }
      },
      {
        id: 'event-date-1',
        type: 'date-picker',
        x: 510,
        y: 185,
        width: 390,
        height: 40,
        properties: {
          label: 'Availability Date'
        }
      },
      {
        id: 'event-upload-1',
        type: 'file-upload',
        x: 100,
        y: 240,
        width: 800,
        height: 80,
        properties: {
          label: 'Upload Photo ID',
          accept: 'image/*',
          multiple: false
        }
      },
      {
        id: 'event-textarea-1',
        type: 'textarea',
        x: 100,
        y: 335,
        width: 800,
        height: 90,
        properties: {
          label: 'Special Requests',
          placeholder: 'Dietary restrictions, accessibility needs, etc.'
        }
      },
      {
        id: 'event-button-1',
        type: 'button',
        x: 450,
        y: 440,
        width: 200,
        height: 40,
        properties: {
          label: 'Register',
          backgroundColor: theme.colors.white,
          color: theme.colors.black
        }
      }
    ]
  },
  {
    id: 'creative',
    name: 'Creative Brief Generator',
    description: 'Agency workflow with mood board',
    plan: 'pro',
    preview: 'Complete creative brief with brand assets',
    elements: [
      {
        id: 'creative-heading-1',
        type: 'heading',
        x: 100,
        y: 20,
        width: 800,
        height: 40,
        properties: {
          content: 'Creative Brief',
          fontSize: '26px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'creative-input-1',
        type: 'text-input',
        x: 100,
        y: 75,
        width: 390,
        height: 40,
        properties: {
          label: 'Project Name',
          placeholder: 'Project title'
        }
      },
      {
        id: 'creative-input-2',
        type: 'text-input',
        x: 510,
        y: 75,
        width: 390,
        height: 40,
        properties: {
          label: 'Client Name',
          placeholder: 'Client'
        }
      },
      {
        id: 'creative-multi-file-1',
        type: 'multi-file',
        x: 100,
        y: 130,
        width: 800,
        height: 85,
        properties: {
          label: 'Brand Assets',
          maxFiles: 10
        }
      },
      {
        id: 'creative-gallery-1',
        type: 'image-gallery',
        x: 100,
        y: 230,
        width: 800,
        height: 180,
        properties: {
          label: 'Mood Board (4x4)',
          gridSize: '4x4'
        }
      },
      {
        id: 'creative-color-1',
        type: 'color-picker',
        x: 100,
        y: 425,
        width: 150,
        height: 40,
        properties: {
          label: 'Primary Color'
        }
      },
      {
        id: 'creative-color-2',
        type: 'color-picker',
        x: 270,
        y: 425,
        width: 150,
        height: 40,
        properties: {
          label: 'Secondary'
        }
      },
      {
        id: 'creative-color-3',
        type: 'color-picker',
        x: 440,
        y: 425,
        width: 150,
        height: 40,
        properties: {
          label: 'Accent'
        }
      },
      {
        id: 'creative-button-1',
        type: 'button',
        x: 450,
        y: 480,
        width: 200,
        height: 40,
        properties: {
          label: 'Submit Brief',
          backgroundColor: theme.colors.white,
          color: theme.colors.black
        }
      }
    ]
  },
  {
    id: 'job',
    name: 'Job Application Suite',
    description: 'Complete HR application portal',
    plan: 'pro',
    preview: 'Full job application with portfolio uploads',
    elements: [
      {
        id: 'job-heading-1',
        type: 'heading',
        x: 100,
        y: 20,
        width: 800,
        height: 40,
        properties: {
          content: 'Job Application',
          fontSize: '26px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'job-input-1',
        type: 'text-input',
        x: 100,
        y: 75,
        width: 390,
        height: 40,
        properties: {
          label: 'Full Name',
          placeholder: 'Your name'
        }
      },
      {
        id: 'job-input-2',
        type: 'text-input',
        x: 510,
        y: 75,
        width: 390,
        height: 40,
        properties: {
          label: 'Email',
          placeholder: 'your@email.com'
        }
      },
      {
        id: 'job-input-3',
        type: 'text-input',
        x: 100,
        y: 130,
        width: 390,
        height: 40,
        properties: {
          label: 'Phone',
          placeholder: '+1 (555) 000-0000'
        }
      },
      {
        id: 'job-input-4',
        type: 'text-input',
        x: 510,
        y: 130,
        width: 390,
        height: 40,
        properties: {
          label: 'Location',
          placeholder: 'City, State'
        }
      },
      {
        id: 'job-upload-1',
        type: 'file-upload',
        x: 100,
        y: 185,
        width: 390,
        height: 75,
        properties: {
          label: 'Resume (PDF)',
          accept: '.pdf',
          multiple: false
        }
      },
      {
        id: 'job-upload-2',
        type: 'file-upload',
        x: 510,
        y: 185,
        width: 390,
        height: 75,
        properties: {
          label: 'Cover Letter (PDF)',
          accept: '.pdf',
          multiple: false
        }
      },
      {
        id: 'job-input-5',
        type: 'text-input',
        x: 100,
        y: 275,
        width: 800,
        height: 40,
        properties: {
          label: 'Portfolio/Website',
          placeholder: 'https://yourportfolio.com'
        }
      },
      {
        id: 'job-multi-file-1',
        type: 'multi-file',
        x: 100,
        y: 330,
        width: 800,
        height: 85,
        properties: {
          label: 'Work Samples',
          maxFiles: 5
        }
      },
      {
        id: 'job-date-1',
        type: 'date-picker',
        x: 100,
        y: 430,
        width: 390,
        height: 40,
        properties: {
          label: 'Available Start Date'
        }
      },
      {
        id: 'job-input-6',
        type: 'text-input',
        x: 510,
        y: 430,
        width: 390,
        height: 40,
        properties: {
          label: 'Salary Expectations',
          placeholder: '$80,000 - $100,000'
        }
      },
      {
        id: 'job-button-1',
        type: 'button',
        x: 450,
        y: 485,
        width: 200,
        height: 40,
        properties: {
          label: 'Submit Application',
          backgroundColor: theme.colors.white,
          color: theme.colors.black
        }
      }
    ]
  }
]

// Component Library - File Collection Elements Only
const COMPONENT_LIBRARY = [
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

// Default properties for each component type
const DEFAULT_PROPERTIES = {
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

// Default sizes for each element type
const DEFAULT_SIZES = {
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

function Requests() {
  const navigate = useNavigate()
  const toast = useToast()
  const [canvasElements, setCanvasElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [selectedElements, setSelectedElements] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedComponent, setDraggedComponent] = useState(null)
  const [formTitle, setFormTitle] = useState('Untitled Request')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [activeTab, setActiveTab] = useState('templates')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [userPlan, setUserPlan] = useState('free')
  const [clipboard, setClipboard] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isDraggingElement, setIsDraggingElement] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState(null)
  const [lockedElements, setLockedElements] = useState([]) // Array of locked element IDs
  const [branding, setBranding] = useState({
    accentColor: '#ffffff',
    pageTitle: '',
    successMessage: 'Thank you! Your file has been uploaded successfully.',
    showPoweredBy: true,
    instructions: ''
  })
  const [settings, setSettings] = useState({
    allowedFileTypes: ['image', 'document', 'video', 'audio', 'archive'], // All types checked by default
    maxFileSize: 104857600, // 100MB in bytes
    maxFiles: 10,
    customFileTypes: ''
  })
  const [editingElementId, setEditingElementId] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      const adminOverride = localStorage.getItem('adminPlanOverride')
      const plan = (adminOverride || userData.plan || 'free').toLowerCase()
      setUserPlan(plan)
      console.log('[Builder] Plan detected:', plan, '| Admin Override:', adminOverride, '| User Plan:', userData.plan)
    } else {
      setUserPlan('free')
      console.log('[Builder] No user data found, defaulting to free')
    }
  }, [navigate])

  // Save to history
  const saveToHistory = (elements) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(elements)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }


  // Check if element is locked
  const isElementLocked = (elementId) => {
    return lockedElements.includes(elementId)
  }

  // Toggle element lock
  const toggleElementLock = (elementId) => {
    if (lockedElements.includes(elementId)) {
      setLockedElements(lockedElements.filter(id => id !== elementId))
    } else {
      setLockedElements([...lockedElements, elementId])
    }
  }

  // Z-index management - get element z-index
  const getElementZIndex = (elementId) => {
    const index = canvasElements.findIndex(el => el.id === elementId)
    return index
  }

  // Bring element forward (swap with next element)
  const bringForward = () => {
    if (!selectedElement) return
    const currentIndex = canvasElements.findIndex(el => el.id === selectedElement.id)
    if (currentIndex < canvasElements.length - 1) {
      const newElements = [...canvasElements]
      const temp = newElements[currentIndex]
      newElements[currentIndex] = newElements[currentIndex + 1]
      newElements[currentIndex + 1] = temp
      setCanvasElements(newElements)
      saveToHistory(newElements)
    }
  }

  // Send element backward (swap with previous element)
  const sendBackward = () => {
    if (!selectedElement) return
    const currentIndex = canvasElements.findIndex(el => el.id === selectedElement.id)
    if (currentIndex > 0) {
      const newElements = [...canvasElements]
      const temp = newElements[currentIndex]
      newElements[currentIndex] = newElements[currentIndex - 1]
      newElements[currentIndex - 1] = temp
      setCanvasElements(newElements)
      saveToHistory(newElements)
    }
  }

  // Bring element to front (move to end of array)
  const bringToFront = () => {
    if (!selectedElement) return
    const currentIndex = canvasElements.findIndex(el => el.id === selectedElement.id)
    if (currentIndex < canvasElements.length - 1) {
      const newElements = [...canvasElements]
      const element = newElements.splice(currentIndex, 1)[0]
      newElements.push(element)
      setCanvasElements(newElements)
      saveToHistory(newElements)
    }
  }

  // Send element to back (move to start of array)
  const sendToBack = () => {
    if (!selectedElement) return
    const currentIndex = canvasElements.findIndex(el => el.id === selectedElement.id)
    if (currentIndex > 0) {
      const newElements = [...canvasElements]
      const element = newElements.splice(currentIndex, 1)[0]
      newElements.unshift(element)
      setCanvasElements(newElements)
      saveToHistory(newElements)
      // Update selected element reference
      setSelectedElement(element)
    }
  }

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCanvasElements(JSON.parse(JSON.stringify(history[historyIndex - 1])))
      setSelectedElement(null)
    }
  }

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCanvasElements(JSON.parse(JSON.stringify(history[historyIndex + 1])))
      setSelectedElement(null)
    }
  }

  // Save form as draft
  const handleSave = async () => {
    // Validation
    if (!formTitle || formTitle.trim() === '') {
      toast.error('Please add a form title before saving')
      return
    }

    if (canvasElements.length === 0) {
      toast.error('Please add at least one element to your form before saving')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const formData = {
        title: formTitle,
        elements: canvasElements,
        status: 'draft',
        branding: branding,
        settings: settings
      }

      const response = await api.post('/api/requests', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Form saved as draft!')
      navigate('/tracking')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save form. Please try again.')
    }
  }

  // Publish form (make it live)
  const handlePublish = async () => {
    // Validation
    if (!formTitle || formTitle.trim() === '') {
      toast.error('Please add a form title before publishing')
      return
    }

    if (canvasElements.length === 0) {
      toast.error('Please add at least one element to your form before publishing')
      return
    }

    try {
      const token = localStorage.getItem('token')

      // Check current form count for plan validation
      const formsResponse = await api.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const currentFormCount = formsResponse.data.requests?.length || 0

      // Validate if user can create a new form
      const validation = canCreateForm(currentFormCount)
      if (!validation.allowed) {
        toast.error(validation.reason)
        navigate('/plan')
        return
      }

      const formData = {
        title: formTitle,
        elements: canvasElements,
        status: 'live',
        branding: branding,
        settings: settings
      }

      const response = await api.post('/api/requests', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const shortCode = response.data.shortCode

      // Ask user if they want to schedule this request
      const scheduleNow = window.confirm(`Form published successfully!\n\nWould you like to schedule when this request opens?\n\nClick OK to schedule, or Cancel to view your public link.`)

      if (scheduleNow) {
        // Navigate to Management page
        navigate('/management')
      } else {
        // Redirect to the public upload page
        window.location.href = `/r/${shortCode}`
      }
    } catch (error) {
      console.error('Publish error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to publish form. Please try again.'
      toast.error(errorMessage)
    }
  }

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Delete/Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        e.preventDefault()
        handleDeleteElement()
      }

      // Cmd/Ctrl + D - Duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedElement) {
        e.preventDefault()
        handleDuplicateElement()
      }

      // Cmd/Ctrl + C - Copy
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedElement) {
        e.preventDefault()
        setClipboard(JSON.parse(JSON.stringify(selectedElement)))
      }

      // Cmd/Ctrl + V - Paste
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && clipboard) {
        e.preventDefault()
        const newElement = {
          ...clipboard,
          id: generateId(),
          x: clipboard.x + 20,
          y: clipboard.y + 20
        }
        const newElements = [...canvasElements, newElement]
        setCanvasElements(newElements)
        saveToHistory(newElements)
        setSelectedElement(newElement)
      }

      // Cmd/Ctrl + Z - Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }

      // Cmd/Ctrl + A - Select All
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        setSelectedElements(canvasElements)
        setSelectedElement(null)
      }

      // Escape - Deselect All
      if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedElement(null)
        setSelectedElements([])
      }

      // Arrow keys - Nudge selected element(s) by 10px
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedElement || selectedElements.length > 0) {
          e.preventDefault()

          // Check if selected element is locked
          if (selectedElement && isElementLocked(selectedElement.id)) {
            return // Don't move locked elements
          }

          const moveAmount = 10 // Always move by 10px for grid snapping
          let deltaX = 0
          let deltaY = 0

          if (e.key === 'ArrowUp') deltaY = -moveAmount
          if (e.key === 'ArrowDown') deltaY = moveAmount
          if (e.key === 'ArrowLeft') deltaX = -moveAmount
          if (e.key === 'ArrowRight') deltaX = moveAmount

          const newElements = canvasElements.map(el => {
            // Move single selected element
            if (selectedElement && el.id === selectedElement.id) {
              const updated = { ...el, x: el.x + deltaX, y: el.y + deltaY }
              setSelectedElement(updated)
              return updated
            }
            // Move all selected elements in multi-select (skip locked ones)
            if (selectedElements.some(sel => sel.id === el.id) && !isElementLocked(el.id)) {
              return { ...el, x: el.x + deltaX, y: el.y + deltaY }
            }
            return el
          })

          // Update selectedElements array with new positions
          const updatedSelectedElements = selectedElements.map(sel => {
            const updated = newElements.find(el => el.id === sel.id)
            return updated || sel
          })
          setSelectedElements(updatedSelectedElements)

          setCanvasElements(newElements)
          saveToHistory(newElements)
        }
      }

      // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y - Redo
      if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
          ((e.metaKey || e.ctrlKey) && e.key === 'y')) {
        e.preventDefault()
        handleRedo()
      }

      // Escape - Deselect
      if (e.key === 'Escape') {
        setSelectedElement(null)
      }

      // Arrow keys - Nudge element
      if (e.key.startsWith('Arrow') && selectedElement) {
        e.preventDefault()
        const distance = e.shiftKey ? 1 : 10
        const direction = {
          ArrowUp: { x: 0, y: -distance },
          ArrowDown: { x: 0, y: distance },
          ArrowLeft: { x: -distance, y: 0 },
          ArrowRight: { x: distance, y: 0 }
        }[e.key]

        const newElements = canvasElements.map(el => {
          if (el.id === selectedElement.id) {
            const updated = {
              ...el,
              x: el.x + direction.x,
              y: el.y + direction.y
            }
            setSelectedElement(updated)
            return updated
          }
          return el
        })
        setCanvasElements(newElements)
        saveToHistory(newElements)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, selectedElements, canvasElements, clipboard, historyIndex, history])

  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const handleTemplateClick = (template) => {
    if (template.plan === 'pro' && userPlan === 'free') {
      setShowUpgradeModal(true)
      return
    }
    setSelectedTemplate(template)
    setShowTemplateModal(true)
  }

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      const elements = selectedTemplate.elements.map(el => ({
        ...el,
        id: generateId()
      }))
      setCanvasElements(elements)
      saveToHistory(elements)
      setShowTemplateModal(false)
      setSelectedTemplate(null)
    }
  }

  const handleDragStart = (component) => {
    if (component.plan === 'pro' && userPlan === 'free') {
      setShowUpgradeModal(true)
      return
    }

    // Check free plan limit (5 elements max)
    if (userPlan === 'free' && canvasElements.length >= 5) {
      setShowUpgradeModal(true)
      return
    }

    setDraggedComponent(component)
    setIsDragging(true)
  }

  const handleCanvasDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    if (!draggedComponent) return

    const canvasRect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - canvasRect.left
    const y = e.clientY - canvasRect.top

    const size = DEFAULT_SIZES[draggedComponent.id]
    const newElement = {
      id: generateId(),
      type: draggedComponent.id,
      x: x - (size.width / 2),
      y: y - (size.height / 2),
      width: size.width,
      height: size.height,
      properties: { ...DEFAULT_PROPERTIES[draggedComponent.id] }
    }

    const newElements = [...canvasElements, newElement]
    setCanvasElements(newElements)
    saveToHistory(newElements)
    setDraggedComponent(null)
  }

  const handleElementSelect = (element, e) => {
    e.stopPropagation()

    // Shift+click for multi-select
    if (e.shiftKey) {
      if (selectedElements.find(el => el.id === element.id)) {
        // Deselect if already selected
        setSelectedElements(selectedElements.filter(el => el.id !== element.id))
      } else {
        // Add to selection
        setSelectedElements([...selectedElements, element])
      }
    } else {
      // Normal click - single select
      setSelectedElement(element)
      setSelectedElements([])
    }
  }

  const handleDeleteElement = () => {
    if (selectedElement) {
      const newElements = canvasElements.filter(el => el.id !== selectedElement.id)
      setCanvasElements(newElements)
      saveToHistory(newElements)
      setSelectedElement(null)
    }
  }

  const handleDuplicateElement = () => {
    if (selectedElement) {
      // Check free plan limit
      if (userPlan === 'free' && canvasElements.length >= 5) {
        setShowUpgradeModal(true)
        return
      }

      const newElement = {
        ...JSON.parse(JSON.stringify(selectedElement)),
        id: generateId(),
        x: selectedElement.x + 20,
        y: selectedElement.y + 20
      }
      const newElements = [...canvasElements, newElement]
      setCanvasElements(newElements)
      saveToHistory(newElements)
      setSelectedElement(newElement)
    }
  }

  const handlePropertyChange = (propertyName, value) => {
    if (!selectedElement) return

    const newElements = canvasElements.map(el => {
      if (el.id === selectedElement.id) {
        const updatedElement = {
          ...el,
          properties: {
            ...el.properties,
            [propertyName]: value
          }
        }
        setSelectedElement(updatedElement)
        return updatedElement
      }
      return el
    })
    setCanvasElements(newElements)
  }

  const handleCanvasClick = () => {
    setSelectedElement(null)
  }

  // Element dragging
  const handleElementMouseDown = (element, e) => {
    if (e.button !== 0) return // Only left click
    e.stopPropagation()

    // Prevent dragging locked elements
    if (isElementLocked(element.id)) {
      setSelectedElement(element)
      return
    }

    setSelectedElement(element)
    setIsDraggingElement(true)
    const canvasRect = canvasRef.current.getBoundingClientRect()
    setDragOffset({
      x: (e.clientX - canvasRect.left) - element.x,
      y: (e.clientY - canvasRect.top) - element.y
    })
  }

  const handleMouseMove = (e) => {
    if (isDraggingElement && selectedElement && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect()
      let newX = (e.clientX - canvasRect.left) - dragOffset.x
      let newY = (e.clientY - canvasRect.top) - dragOffset.y

      // Calculate delta for group move
      const deltaX = newX - selectedElement.x
      const deltaY = newY - selectedElement.y

      const newElements = canvasElements.map(el => {
        // Move the primary selected element
        if (el.id === selectedElement.id) {
          const updated = { ...el, x: newX, y: newY }
          setSelectedElement(updated)
          return updated
        }
        // Move all other selected elements by the same delta (skip locked)
        if (selectedElements.some(sel => sel.id === el.id) && !isElementLocked(el.id)) {
          return { ...el, x: el.x + deltaX, y: el.y + deltaY }
        }
        return el
      })

      // Update selectedElements array with new positions
      const updatedSelectedElements = selectedElements.map(sel => {
        const updated = newElements.find(el => el.id === sel.id)
        return updated || sel
      })
      setSelectedElements(updatedSelectedElements)

      setCanvasElements(newElements)
    }
  }

  const handleMouseUp = () => {
    if (isDraggingElement) {
      saveToHistory(canvasElements)
      setIsDraggingElement(false)
    }
  }

  // Render element on canvas
  const renderCanvasElement = (element) => {
    const { type, properties, x, y, width, height } = element
    const isSelected = selectedElement?.id === element.id || selectedElements.some(el => el.id === element.id)
    const isLocked = isElementLocked(element.id)

    const elementStyle = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: type === 'textarea' || type === 'rich-text' || type === 'signature' ? `${height}px` : 'auto',
      minHeight: type === 'spacer' ? `${properties.height || '40px'}` : 'auto',
      cursor: isLocked ? 'not-allowed' : (isDraggingElement ? 'grabbing' : 'grab'),
      border: isSelected ? `2px solid ${theme.colors.white}` : '2px solid transparent',
      outline: isSelected ? '2px solid rgba(59, 130, 246, 0.3)' : 'none',
      outlineOffset: '2px',
      borderRadius: '4px',
      boxSizing: 'border-box',
      opacity: isLocked ? 0.7 : 1
    }

    const commonProps = {
      key: element.id,
      style: elementStyle,
      onMouseDown: (e) => handleElementMouseDown(element, e),
      onClick: (e) => handleElementSelect(element, e)
    }

    // Wrapper to add lock indicator
    const wrapWithLockIndicator = (content) => {
      if (isLocked && isSelected) {
        return (
          <>
            {content}
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: theme.colors.white,
              color: theme.colors.black,
              borderRadius: '4px',
              padding: '4px 6px',
              fontSize: '10px',
              fontWeight: '600',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              LOCKED
            </div>
          </>
        )
      }
      return content
    }

    switch (type) {
      case 'text':
        return wrapWithLockIndicator(
          <div {...commonProps}>
            <div style={{
              fontSize: properties.fontSize,
              color: properties.color,
              fontWeight: properties.fontWeight,
              textAlign: properties.textAlign,
              padding: '8px',
              userSelect: 'none'
            }}>
              {properties.content}
            </div>
          </div>
        )

      case 'heading':
        return wrapWithLockIndicator(
          <div {...commonProps}>
            <div style={{
              fontSize: properties.fontSize,
              color: properties.color,
              fontWeight: properties.fontWeight,
              textAlign: properties.textAlign,
              padding: '8px',
              userSelect: 'none'
            }}>
              {properties.content}
            </div>
          </div>
        )

      case 'text-input':
        return wrapWithLockIndicator(
          <div {...commonProps}>
            <div style={{ padding: '8px' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
                </div>
              )}
              <input
                type="text"
                placeholder={properties.placeholder}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: `1px solid ${theme.colors.border.dark}`,
                  borderRadius: '4px',
                  backgroundColor: theme.colors.bg.hover,
                  color: theme.colors.text.primary,
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>
        )

      case 'textarea':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px', height: '100%' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
                </div>
              )}
              <textarea
                placeholder={properties.placeholder}
                readOnly
                rows={properties.rows || 4}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: `1px solid ${theme.colors.border.dark}`,
                  borderRadius: '4px',
                  backgroundColor: theme.colors.bg.hover,
                  color: theme.colors.text.primary,
                  pointerEvents: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        )

      case 'file-upload':
        return (
          <div {...commonProps}>
            <div style={{
              backgroundColor: theme.colors.bg.hover,
              border: `2px dashed ${theme.colors.border.dark}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>{properties.label}</div>
              <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginTop: '4px' }}>
                {properties.multiple ? 'Multiple files' : 'Single file'}
              </div>
            </div>
          </div>
        )

      case 'button':
        return (
          <div {...commonProps}>
            <button style={{
              backgroundColor: properties.backgroundColor,
              color: properties.color,
              fontSize: '16px',
              fontWeight: '600',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              fontFamily: 'inherit'
            }}>
              {properties.label}
            </button>
          </div>
        )

      case 'rich-text':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px', height: '100%' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
                </div>
              )}
              <div style={{
                width: '100%',
                height: 'calc(100% - 32px)',
                padding: '10px',
                fontSize: '14px',
                border: `1px solid ${theme.colors.border.dark}`,
                borderRadius: '4px',
                backgroundColor: theme.colors.bg.hover,
                color: theme.colors.text.secondary,
                fontFamily: 'inherit'
              }}>
                {properties.placeholder}
              </div>
            </div>
          </div>
        )

      case 'multi-file':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px', height: '100%' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label}
                </div>
              )}
              <div style={{
                width: '100%',
                height: 'calc(100% - 32px)',
                backgroundColor: theme.colors.bg.hover,
                border: `2px dashed ${theme.colors.border.dark}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '600', color: theme.colors.text.secondary }}>MULTI FILE</div>
                <div style={{ fontSize: '13px', color: theme.colors.text.secondary }}>
                  Upload up to {properties.maxFiles} files
                </div>
              </div>
            </div>
          </div>
        )

      case 'image-gallery':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px', height: '100%' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label}
                </div>
              )}
              <div style={{
                width: '100%',
                height: 'calc(100% - 32px)',
                display: 'grid',
                gridTemplateColumns: properties.gridSize === '4x4' ? 'repeat(4, 1fr)' :
                                    properties.gridSize === '3x3' ? 'repeat(3, 1fr)' :
                                    'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {Array.from({ length: properties.gridSize === '4x4' ? 16 : properties.gridSize === '3x3' ? 9 : 6 }).map((_, i) => (
                  <div key={i} style={{
                    backgroundColor: theme.colors.bg.hover,
                    border: `1px solid ${theme.colors.border.dark}`,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    aspectRatio: '1/1'
                  }}>
                    <span style={{ fontSize: '20px', color: theme.colors.text.tertiary }}>+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'date-picker':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
                </div>
              )}
              <input
                type="date"
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: `1px solid ${theme.colors.border.dark}`,
                  borderRadius: '4px',
                  backgroundColor: theme.colors.bg.hover,
                  color: theme.colors.text.primary,
                  pointerEvents: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        )

      case 'time-picker':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
                </div>
              )}
              <input
                type="time"
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: `1px solid ${theme.colors.border.dark}`,
                  borderRadius: '4px',
                  backgroundColor: theme.colors.bg.hover,
                  color: theme.colors.text.primary,
                  pointerEvents: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        )

      case 'color-picker':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label}
                </div>
              )}
              <input
                type="color"
                value={properties.defaultColor}
                readOnly
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '4px',
                  border: `1px solid ${theme.colors.border.dark}`,
                  borderRadius: '4px',
                  backgroundColor: theme.colors.bg.hover,
                  cursor: 'pointer',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>
        )

      case 'range-slider':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label}
                </div>
              )}
              <input
                type="range"
                min={properties.min}
                max={properties.max}
                step={properties.step}
                readOnly
                style={{
                  width: '100%',
                  pointerEvents: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.colors.text.secondary, marginTop: '4px' }}>
                <span>{properties.min}</span>
                <span>{properties.max}</span>
              </div>
            </div>
          </div>
        )

      case 'star-rating':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label}
                </div>
              )}
              <div style={{ display: 'flex', gap: '4px', fontSize: '24px' }}>
                {Array.from({ length: properties.maxStars }).map((_, i) => (
                  <span key={i} style={{ color: theme.colors.text.primary }}>★</span>
                ))}
              </div>
            </div>
          </div>
        )

      case 'signature':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px', height: '100%' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
                </div>
              )}
              <div style={{
                width: '100%',
                height: 'calc(100% - 32px)',
                backgroundColor: theme.colors.bg.hover,
                border: `1px solid ${theme.colors.border.dark}`,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.text.secondary,
                fontSize: '14px'
              }}>
                Sign here
              </div>
            </div>
          </div>
        )

      case 'divider':
        return (
          <div {...commonProps}>
            <div style={{
              width: '100%',
              height: properties.thickness || '1px',
              backgroundColor: properties.color || theme.colors.text.tertiary,
              margin: '16px 0'
            }} />
          </div>
        )

      case 'spacer':
        return (
          <div {...commonProps}>
            <div style={{
              width: '100%',
              height: properties.height || '40px',
              backgroundColor: 'transparent',
              border: `1px dashed ${theme.colors.border.dark}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.text.secondary,
              fontSize: '11px'
            }}>
              Spacer
            </div>
          </div>
        )

      case 'select':
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
                  {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
                </div>
              )}
              <select
                disabled
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: `1px solid ${theme.colors.border.dark}`,
                  borderRadius: '4px',
                  backgroundColor: theme.colors.bg.hover,
                  color: theme.colors.text.primary,
                  pointerEvents: 'none',
                  fontFamily: 'inherit'
                }}
              >
                <option>Select option...</option>
              </select>
            </div>
          </div>
        )

      case 'checkbox':
        return (
          <div {...commonProps}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px'
            }}>
              <input
                type="checkbox"
                readOnly
                style={{ width: '18px', height: '18px', pointerEvents: 'none' }}
              />
              <span style={{ fontSize: '14px', color: theme.colors.text.primary }}>
                {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
              </span>
            </div>
          </div>
        )

      case 'image':
        return (
          <div {...commonProps}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: theme.colors.bg.hover,
              border: `1px solid ${theme.colors.border.dark}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {properties.src ? (
                <img
                  src={properties.src}
                  alt={properties.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: properties.objectFit
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: theme.colors.text.secondary }}>
                  <div style={{ fontSize: '32px' }}>IMG</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>Image Placeholder</div>
                </div>
              )}
            </div>
          </div>
        )

      case 'two-column':
      case 'three-column':
        const cols = type === 'two-column' ? 2 : 3
        return (
          <div {...commonProps}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: properties.gap || '20px',
              height: '100%',
              padding: '8px'
            }}>
              {Array.from({ length: cols }).map((_, i) => (
                <div key={i} style={{
                  backgroundColor: theme.colors.bg.hover,
                  border: `1px dashed ${theme.colors.border.dark}`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.text.secondary,
                  fontSize: '11px'
                }}>
                  Column {i + 1}
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Sidebar />
      <div
        style={{
          height: '100vh',
          background: theme.colors.bg.page,
          color: theme.colors.text.primary,
          paddingTop: '54px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Top Toolbar - Clean minimal design */}
        <div style={{
          height: '64px',
          borderBottom: `1px solid ${theme.colors.border.medium}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: theme.colors.bg.card
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isEditingTitle ? (
              <input
                type="text"
                value={formTitle}
                maxLength={50}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 50) {
                    setFormTitle(value)
                  }
                }}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false)
                }}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${theme.colors.border.medium}`,
                  color: theme.colors.text.primary,
                  fontSize: '18px',
                  fontWeight: '600',
                  padding: '8px 0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  minWidth: '300px'
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0,
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: theme.radius.sm,
                  maxWidth: '400px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: theme.colors.text.primary
                }}
              >
                {formTitle}
              </h1>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              style={{
                ...theme.buttons.secondary.base,
                color: historyIndex <= 0 ? theme.colors.text.tertiary : theme.colors.text.secondary,
                cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                opacity: historyIndex <= 0 ? 0.4 : 1
              }}
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              style={{
                ...theme.buttons.secondary.base,
                color: historyIndex >= history.length - 1 ? theme.colors.text.tertiary : theme.colors.text.secondary,
                cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
                opacity: historyIndex >= history.length - 1 ? 0.4 : 1
              }}
            >
              Redo
            </button>
            <div style={{
              width: '1px',
              height: '20px',
              background: theme.colors.border.medium,
              margin: '0 8px'
            }}></div>
            <button
              style={theme.buttons.secondary.base}
              onClick={() => setShowPreviewModal(true)}
            >
              Preview
            </button>
            <button
              style={theme.buttons.secondary.base}
              onClick={handleSave}
            >
              Save
            </button>
            <button
              style={theme.buttons.primary.base}
              onClick={handlePublish}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Workspace Layout - Sidebar + Canvas */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT SIDEBAR - Clean minimal design */}
          <div style={{
            width: '280px',
            borderRight: `1px solid ${theme.colors.border.medium}`,
            background: theme.colors.bg.card,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Tabs - Clean design */}
            <div style={{
              display: 'flex',
              gap: '0',
              borderBottom: `1px solid ${theme.colors.border.medium}`,
              padding: '0'
            }}>
              <button
                onClick={() => setActiveTab('templates')}
                style={{
                  flex: 1,
                  padding: '16px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'templates' ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                  color: activeTab === 'templates' ? theme.colors.text.primary : theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap'
                }}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('elements')}
                style={{
                  flex: 1,
                  padding: '16px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'elements' ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                  color: activeTab === 'elements' ? theme.colors.text.primary : theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap'
                }}
              >
                Elements
              </button>
              <button
                onClick={() => setActiveTab('branding')}
                style={{
                  flex: 1,
                  padding: '16px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'branding' ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                  color: activeTab === 'branding' ? theme.colors.text.primary : theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap'
                }}
              >
                Branding
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  flex: 1,
                  padding: '16px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'settings' ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                  color: activeTab === 'settings' ? theme.colors.text.primary : theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap'
                }}
              >
                Settings
              </button>
            </div>

            {/* Tab Content - Consistent spacing */}
            <div style={{ padding: '32px 16px' }}>
              {activeTab === 'branding' ? (
                <>
                  {/* Section Title */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.colors.text.tertiary,
                    marginBottom: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Branding
                  </div>

                  {/* Page Title */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={branding.pageTitle}
                      onChange={(e) => setBranding({ ...branding, pageTitle: e.target.value })}
                      placeholder="Uses form title if empty"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: theme.colors.bg.page,
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: theme.radius.md,
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.sm,
                        fontFamily: 'inherit',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Instructions */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      Instructions Text
                    </label>
                    <textarea
                      value={branding.instructions}
                      onChange={(e) => setBranding({ ...branding, instructions: e.target.value })}
                      placeholder="Optional instructions above file upload"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: theme.colors.bg.page,
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: theme.radius.md,
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.sm,
                        fontFamily: 'inherit',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Success Message */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      Success Message
                    </label>
                    <textarea
                      value={branding.successMessage}
                      onChange={(e) => setBranding({ ...branding, successMessage: e.target.value })}
                      placeholder="Message shown after successful upload"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: theme.colors.bg.page,
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: theme.radius.md,
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.sm,
                        fontFamily: 'inherit',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Show Powered By */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      cursor: 'pointer',
                      userSelect: 'none',
                      padding: '0'
                    }}>
                      <input
                        type="checkbox"
                        checked={branding.showPoweredBy}
                        onChange={(e) => setBranding({ ...branding, showPoweredBy: e.target.checked })}
                        style={{
                          marginRight: '14px',
                          cursor: 'pointer',
                          width: '20px',
                          height: '20px'
                        }}
                      />
                      Show "Powered by Sway"
                    </label>
                  </div>
                </>
              ) : activeTab === 'settings' ? (
                <>
                  {/* Section Title */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.colors.text.tertiary,
                    marginBottom: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Settings
                  </div>

                  {/* Allowed File Types */}
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '12px',
                      fontWeight: '500'
                    }}>
                      Allowed File Types
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {['image', 'document', 'video', 'audio', 'archive'].map(type => (
                        <label key={type} style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '14px',
                          color: theme.colors.text.primary,
                          cursor: 'pointer',
                          userSelect: 'none',
                          padding: '0'
                        }}>
                          <input
                            type="checkbox"
                            checked={settings.allowedFileTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Add this type
                                setSettings({ ...settings, allowedFileTypes: [...settings.allowedFileTypes, type] })
                              } else {
                                // Remove this type (allow empty array - user explicitly unchecked)
                                const newTypes = settings.allowedFileTypes.filter(t => t !== type)
                                setSettings({ ...settings, allowedFileTypes: newTypes })
                              }
                            }}
                            style={{
                              marginRight: '14px',
                              cursor: 'pointer',
                              width: '20px',
                              height: '20px'
                            }}
                          />
                          {type.charAt(0).toUpperCase() + type.slice(1)}s
                        </label>
                      ))}
                    </div>

                    {/* Custom File Types */}
                    <div style={{ marginTop: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        color: theme.colors.text.primary,
                        marginBottom: '8px',
                        fontWeight: '500'
                      }}>
                        Custom File Extensions
                      </label>
                      <input
                        type="text"
                        value={settings.customFileTypes}
                        onChange={(e) => setSettings({ ...settings, customFileTypes: e.target.value })}
                        placeholder=".psd, .ai, .sketch"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: theme.colors.bg.page,
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: theme.radius.md,
                          color: theme.colors.text.primary,
                          fontSize: theme.fontSize.sm,
                          fontFamily: 'inherit',
                          outline: 'none'
                        }}
                      />
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.text.tertiary,
                        marginTop: '6px'
                      }}>
                        Comma-separated list of file extensions (e.g., .psd, .ai)
                      </div>
                    </div>
                  </div>

                  {/* Maximum File Size */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      Maximum File Size
                    </label>
                    <select
                      value={settings.maxFileSize}
                      onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: theme.colors.bg.page,
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: theme.radius.md,
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.sm,
                        fontFamily: 'inherit',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="10485760">10 MB</option>
                      <option value="26214400">25 MB</option>
                      <option value="52428800">50 MB</option>
                      <option value="104857600">100 MB</option>
                      <option value="209715200">200 MB</option>
                      <option value="524288000">500 MB</option>
                    </select>
                  </div>

                  {/* Maximum Number of Files */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      Maximum Number of Files
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={settings.maxFiles}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        setSettings({ ...settings, maxFiles: Math.max(1, Math.min(50, val)) })
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: theme.colors.bg.page,
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: theme.radius.md,
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.sm,
                        fontFamily: 'inherit',
                        outline: 'none'
                      }}
                    />
                    <div style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.text.tertiary,
                      marginTop: '6px'
                    }}>
                      Range: 1-50 files
                    </div>
                  </div>
                </>
              ) : activeTab === 'templates' ? (
                <>
                  {/* Section Title */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.colors.text.tertiary,
                    marginBottom: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Templates
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {TEMPLATES.map((template) => {
                      const isPro = template.plan === 'pro'
                      const isLocked = isPro && userPlan === 'free'

                      return (
                        <div
                          key={template.id}
                          onClick={() => handleTemplateClick(template)}
                          style={{
                            padding: '12px',
                            background: 'transparent',
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: theme.radius.md,
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            opacity: isLocked ? 0.5 : 1
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: theme.colors.text.primary,
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {template.name}
                            </div>
                            {isPro && (
                              <div style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                color: theme.colors.text.tertiary,
                                background: 'transparent',
                                border: `1px solid ${theme.colors.border.medium}`,
                                padding: '2px 6px',
                                borderRadius: theme.radius.sm,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                PRO
                              </div>
                            )}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: theme.colors.text.secondary,
                            lineHeight: '1.5',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2
                          }}>
                            {template.description}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* Section Title */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.colors.text.tertiary,
                    marginBottom: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Elements
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {COMPONENT_LIBRARY.map((component) => {
                      const isPro = component.plan === 'pro'
                      const isLocked = isPro && userPlan === 'free'

                      return (
                        <div
                          key={component.id}
                          draggable={!isLocked}
                          onDragStart={() => !isLocked && handleDragStart(component)}
                          onClick={() => isLocked && setShowUpgradeModal(true)}
                          style={{
                            padding: '12px',
                            background: 'transparent',
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: theme.radius.md,
                            cursor: isLocked ? 'not-allowed' : 'grab',
                            userSelect: 'none',
                            opacity: isLocked ? 0.5 : 1
                          }}
                        >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: theme.colors.text.secondary,
                            minWidth: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: theme.radius.sm
                          }}>
                            {component.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '4px'
                            }}>
                              <div style={{ fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>
                                {component.label}
                              </div>
                              {isPro && (
                                <div style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: theme.colors.text.tertiary,
                                  background: 'transparent',
                                  border: `1px solid ${theme.colors.border.medium}`,
                                  padding: '2px 6px',
                                  borderRadius: theme.radius.sm,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  PRO
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: '13px', color: theme.colors.text.secondary, lineHeight: '1.4' }}>
                              {component.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CENTER - Canvas */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            background: theme.colors.bg.page,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '24px'
          }}>
            <div
              ref={canvasRef}
              onDrop={handleCanvasDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                width: '100%',
                maxWidth: '1200px',
                minHeight: '500px',
                aspectRatio: '16/9',
                background: theme.colors.bg.card,
                borderRadius: theme.radius.md,
                position: 'relative',
                border: `1px solid ${theme.colors.border.medium}`,
                overflow: 'visible'
              }}
            >
              {canvasElements.length === 0 && !isDragging && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: theme.colors.text.tertiary,
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '400' }}>Drag elements or choose a template to start</div>
                </div>
              )}

              {canvasElements.map(renderCanvasElement)}

              {isDragging && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  pointerEvents: 'none',
                  fontWeight: '400'
                }}>
                  Drop here to add element
                </div>
              )}
            </div>
          </div>

        </div>

        {/* BOTTOM PROPERTIES BAR */}
        <div style={{
          height: '160px',
          borderTop: `1px solid ${theme.colors.border.medium}`,
          background: theme.colors.bg.card,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Properties Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: `1px solid ${theme.colors.border.medium}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.text.primary }}>
                {selectedElement ? COMPONENT_LIBRARY.find(c => c.id === selectedElement.type)?.label : 'Properties'}
              </div>
              {selectedElement && (
                <div style={{ fontSize: '13px', color: theme.colors.text.secondary }}>
                  Edit element properties
                </div>
              )}
            </div>
            {selectedElement && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Copy Button */}
                <button
                  onClick={() => setClipboard(JSON.parse(JSON.stringify(selectedElement)))}
                  style={{
                    ...theme.buttons.secondary.base,
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '13px'
                  }}
                  title="Copy (Cmd+C)"
                >
                  Copy
                </button>
                {/* Paste Button */}
                <button
                  onClick={() => {
                    if (clipboard) {
                      const newElement = {
                        ...clipboard,
                        id: generateId(),
                        x: clipboard.x + 20,
                        y: clipboard.y + 20
                      }
                      const newElements = [...canvasElements, newElement]
                      setCanvasElements(newElements)
                      saveToHistory(newElements)
                      setSelectedElement(newElement)
                    }
                  }}
                  disabled={!clipboard}
                  style={{
                    ...theme.buttons.secondary.base,
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '13px',
                    color: clipboard ? theme.colors.text.secondary : theme.colors.text.tertiary,
                    cursor: clipboard ? 'pointer' : 'not-allowed',
                    opacity: clipboard ? 1 : 0.4
                  }}
                  title="Paste (Cmd+V)"
                >
                  Paste
                </button>
                {/* Lock/Unlock Button */}
                <button
                  onClick={() => toggleElementLock(selectedElement.id)}
                  style={{
                    ...(isElementLocked(selectedElement.id) ? theme.buttons.primary.base : theme.buttons.secondary.base),
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '13px'
                  }}
                  title={isElementLocked(selectedElement.id) ? 'Unlock' : 'Lock'}
                >
                  {isElementLocked(selectedElement.id) ? 'Locked' : 'Lock'}
                </button>
                {/* Layer Controls */}
                <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                  <button
                    onClick={sendToBack}
                    style={{
                      ...theme.buttons.secondary.base,
                      height: '32px',
                      padding: '0 10px',
                      fontSize: '13px'
                    }}
                    title="Send to Back"
                  >
                    Back
                  </button>
                  <button
                    onClick={sendBackward}
                    style={{
                      ...theme.buttons.secondary.base,
                      height: '32px',
                      padding: '0 10px',
                      fontSize: '13px'
                    }}
                    title="Send Backward"
                  >
                    -
                  </button>
                  <button
                    onClick={bringForward}
                    style={{
                      ...theme.buttons.secondary.base,
                      height: '32px',
                      padding: '0 10px',
                      fontSize: '13px'
                    }}
                    title="Bring Forward"
                  >
                    +
                  </button>
                  <button
                    onClick={bringToFront}
                    style={{
                      ...theme.buttons.secondary.base,
                      height: '32px',
                      padding: '0 10px',
                      fontSize: '13px'
                    }}
                    title="Bring to Front"
                  >
                    Front
                  </button>
                </div>
                {/* Divider */}
                <div style={{ width: '1px', height: '24px', background: theme.colors.border.medium, margin: '0 8px' }}></div>
                <button
                  onClick={handleDuplicateElement}
                  style={{
                    ...theme.buttons.secondary.base,
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '13px'
                  }}
                >
                  Duplicate
                </button>
                <button
                  onClick={handleDeleteElement}
                  style={{
                    ...theme.buttons.danger.base,
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '13px'
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Properties Content - Horizontal Scroll */}
          <div style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '16px 24px'
          }}>
            {selectedElement ? (
              <div style={{
                display: 'flex',
                gap: '32px',
                alignItems: 'flex-start',
                minWidth: 'max-content'
              }}>
                {/* Position Group */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '10px',
                      color: theme.colors.text.secondary,
                      marginBottom: '6px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      X
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) => {
                        const newElements = canvasElements.map(el => {
                          if (el.id === selectedElement.id) {
                            const updated = { ...el, x: parseInt(e.target.value) || 0 }
                            setSelectedElement(updated)
                            return updated
                          }
                          return el
                        })
                        setCanvasElements(newElements)
                      }}
                      style={{
                        width: '70px',
                        padding: '8px',
                        fontSize: '13px',
                        border: `1px solid ${theme.colors.border.dark}`,
                        borderRadius: '4px',
                        background: theme.colors.bg.hover,
                        color: theme.colors.text.primary,
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '10px',
                      color: theme.colors.text.secondary,
                      marginBottom: '6px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Y
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) => {
                        const newElements = canvasElements.map(el => {
                          if (el.id === selectedElement.id) {
                            const updated = { ...el, y: parseInt(e.target.value) || 0 }
                            setSelectedElement(updated)
                            return updated
                          }
                          return el
                        })
                        setCanvasElements(newElements)
                      }}
                      style={{
                        width: '70px',
                        padding: '8px',
                        fontSize: '13px',
                        border: `1px solid ${theme.colors.border.dark}`,
                        borderRadius: '4px',
                        background: theme.colors.bg.hover,
                        color: theme.colors.text.primary,
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>

                {/* Size Group */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.text.secondary,
                      marginBottom: '6px',
                      fontWeight: theme.weight.semibold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Width
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) => {
                        const newElements = canvasElements.map(el => {
                          if (el.id === selectedElement.id) {
                            const updated = { ...el, width: parseInt(e.target.value) || 100 }
                            setSelectedElement(updated)
                            return updated
                          }
                          return el
                        })
                        setCanvasElements(newElements)
                      }}
                      style={{
                        width: '80px',
                        padding: '8px',
                        fontSize: theme.fontSize.sm,
                        border: `1px solid ${theme.colors.border.dark}`,
                        borderRadius: theme.radius.sm,
                        background: theme.colors.bg.hover,
                        color: theme.colors.text.primary,
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.text.secondary,
                      marginBottom: '6px',
                      fontWeight: theme.weight.semibold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Height
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.height)}
                      onChange={(e) => {
                        const newElements = canvasElements.map(el => {
                          if (el.id === selectedElement.id) {
                            const updated = { ...el, height: parseInt(e.target.value) || 100 }
                            setSelectedElement(updated)
                            return updated
                          }
                          return el
                        })
                        setCanvasElements(newElements)
                      }}
                      style={{
                        width: '80px',
                        padding: '8px',
                        fontSize: theme.fontSize.sm,
                        border: `1px solid ${theme.colors.border.dark}`,
                        borderRadius: theme.radius.sm,
                        background: theme.colors.bg.hover,
                        color: theme.colors.text.primary,
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>

                {/* Vertical Divider */}
                <div style={{
                  width: '1px',
                  height: '60px',
                  background: theme.colors.border.dark,
                  margin: '10px 0'
                }} />

                {/* Dynamic Properties - Horizontal */}
                {Object.entries(selectedElement.properties).map(([key, value]) => (
                  <div key={key} style={{ minWidth: typeof value === 'boolean' ? '120px' : '180px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.text.secondary,
                      marginBottom: '6px',
                      fontWeight: theme.weight.semibold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {typeof value === 'boolean' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px' }}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handlePropertyChange(key, e.target.checked)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.secondary }}>Enabled</span>
                      </label>
                    ) : key.toLowerCase().includes('color') ? (
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => handlePropertyChange(key, e.target.value)}
                        style={{
                          width: '80px',
                          height: '36px',
                          padding: '2px',
                          border: `1px solid ${theme.colors.border.dark}`,
                          borderRadius: theme.radius.sm,
                          background: theme.colors.bg.hover,
                          cursor: 'pointer'
                        }}
                      />
                    ) : typeof value === 'number' ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handlePropertyChange(key, parseInt(e.target.value) || 0)}
                        style={{
                          width: '100px',
                          padding: '8px',
                          fontSize: theme.fontSize.sm,
                          border: `1px solid ${theme.colors.border.dark}`,
                          borderRadius: theme.radius.sm,
                          background: theme.colors.bg.hover,
                          color: theme.colors.text.primary,
                          fontFamily: 'inherit'
                        }}
                      />
                    ) : key === 'content' || key.toLowerCase().includes('text') || key.toLowerCase().includes('label') ? (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handlePropertyChange(key, e.target.value)}
                        style={{
                          width: '200px',
                          padding: '8px',
                          fontSize: theme.fontSize.sm,
                          border: `1px solid ${theme.colors.border.dark}`,
                          borderRadius: theme.radius.sm,
                          background: theme.colors.bg.hover,
                          color: theme.colors.text.primary,
                          fontFamily: 'inherit'
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handlePropertyChange(key, e.target.value)}
                        style={{
                          width: '150px',
                          padding: '8px',
                          fontSize: theme.fontSize.sm,
                          border: `1px solid ${theme.colors.border.dark}`,
                          borderRadius: theme.radius.sm,
                          background: theme.colors.bg.hover,
                          color: theme.colors.text.primary,
                          fontFamily: 'inherit'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: theme.colors.text.secondary,
                fontSize: '13px'
              }}>
                Select an element to edit its properties
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TEMPLATE MODAL */}
      {showTemplateModal && selectedTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '40px'
        }}
        onClick={() => {
          setShowTemplateModal(false)
          setSelectedTemplate(null)
        }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.colors.bg.card,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.md,
              maxWidth: '600px',
              width: '100%',
              padding: '24px'
            }}
          >
            <div style={{
              background: theme.colors.bg.page,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.md,
              padding: '0',
              marginBottom: '20px',
              height: '500px',
              overflow: 'auto',
              position: 'relative'
            }}>
              {selectedTemplate.elements.length > 0 ? (
                <div style={{
                  width: '100%',
                  minHeight: '500px',
                  background: theme.colors.bg.page,
                  padding: '32px',
                  position: 'relative'
                }}>
                  {selectedTemplate.elements.map((element) => {
                    const props = element.properties || {}

                    if (element.type === 'heading') {
                      return (
                        <div key={element.id} style={{
                          fontSize: props.fontSize || '32px',
                          fontWeight: props.fontWeight || '600',
                          color: props.color || theme.colors.white,
                          textAlign: props.textAlign || 'left',
                          marginBottom: '16px'
                        }}>
                          {props.content || 'Heading'}
                        </div>
                      )
                    }

                    if (element.type === 'text') {
                      return (
                        <div key={element.id} style={{
                          fontSize: props.fontSize || '16px',
                          fontWeight: props.fontWeight || '400',
                          color: props.color || theme.colors.text.secondary,
                          textAlign: props.textAlign || 'left',
                          marginBottom: '16px',
                          lineHeight: '1.6'
                        }}>
                          {props.content || 'Text content'}
                        </div>
                      )
                    }

                    if (element.type === 'file-upload') {
                      return (
                        <div key={element.id} style={{
                          border: `2px dashed ${theme.colors.border.medium}`,
                          borderRadius: theme.radius.md,
                          padding: '24px',
                          textAlign: 'center',
                          marginBottom: '12px',
                          background: 'rgba(255, 255, 255, 0.02)'
                        }}>
                          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.secondary, marginBottom: '6px' }}>
                            Click or drag files here
                          </div>
                          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.secondary }}>
                            {props.label || 'File Upload'}
                          </div>
                        </div>
                      )
                    }

                    if (element.type === 'text-input') {
                      return (
                        <div key={element.id} style={{ marginBottom: '12px' }}>
                          {props.label && (
                            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.secondary, marginBottom: '6px', fontWeight: '500' }}>
                              {props.label}
                            </div>
                          )}
                          <input
                            type="text"
                            placeholder={props.placeholder || 'Enter text'}
                            disabled
                            style={{
                              ...theme.inputs.text.base,
                              color: theme.colors.text.secondary
                            }}
                          />
                        </div>
                      )
                    }

                    if (element.type === 'button') {
                      return (
                        <div key={element.id} style={{
                          marginTop: '20px',
                          textAlign: props.textAlign || 'center'
                        }}>
                          <button disabled style={{
                            ...theme.buttons.primary.base,
                            padding: '0 24px'
                          }}>
                            {props.label || 'Submit'}
                          </button>
                        </div>
                      )
                    }

                    if (element.type === 'divider') {
                      return (
                        <div key={element.id} style={{
                          height: '1px',
                          background: theme.colors.border.dark,
                          margin: '24px 0'
                        }} />
                      )
                    }

                    if (element.type === 'spacer') {
                      return <div key={element.id} style={{ height: props.height || '40px' }} />
                    }

                    return null
                  })}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '280px',
                  color: theme.colors.text.secondary,
                  fontSize: '14px'
                }}>
                  Empty canvas - start from scratch
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTemplateModal(false)
                  setSelectedTemplate(null)
                }}
                style={theme.buttons.secondary.base}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.buttons.secondary.hover.background
                  e.target.style.borderColor = theme.buttons.secondary.hover.borderColor
                  e.target.style.color = theme.buttons.secondary.hover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.buttons.secondary.base.background
                  e.target.style.borderColor = theme.buttons.secondary.base.border.split(' ')[2]
                  e.target.style.color = theme.buttons.secondary.base.color
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUseTemplate}
                style={theme.buttons.primary.base}
                onMouseEnter={(e) => e.target.style.background = theme.buttons.primary.hover.background}
                onMouseLeave={(e) => e.target.style.background = theme.buttons.primary.base.background}
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '40px'
        }}
        onClick={() => setShowUpgradeModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.colors.bg.card,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.md,
              maxWidth: '500px',
              width: '100%',
              padding: '24px'
            }}
          >
            <div style={{
              fontSize: theme.fontSize.lg,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: '8px'
            }}>
              Upgrade to Pro
            </div>
            <div style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              Unlock the full power of the form builder with Pro features.
            </div>

            <div style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.md,
              padding: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: theme.fontSize.xs, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pro Features Include
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: theme.colors.text.secondary, fontSize: theme.fontSize.xs, lineHeight: '1.7' }}>
                <li>Unlimited elements per form</li>
                <li>15+ advanced elements (Rich Text, Multi-File, Gallery, Date/Time Pickers, etc.)</li>
                <li>5 premium templates</li>
                <li>Full keyboard shortcuts</li>
                <li>Advanced layout tools (Multi-column, Dividers, Spacers)</li>
                <li>Signature pads and star ratings</li>
                <li>Priority support</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  ...theme.buttons.secondary.base,
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.buttons.secondary.hover.background
                  e.target.style.borderColor = theme.buttons.secondary.hover.borderColor
                  e.target.style.color = theme.buttons.secondary.hover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.buttons.secondary.base.background
                  e.target.style.borderColor = theme.buttons.secondary.base.border.split(' ')[2]
                  e.target.style.color = theme.buttons.secondary.base.color
                }}
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false)
                  toast.info('Redirecting to pricing page...')
                  navigate('/plan')
                }}
                style={{
                  ...theme.buttons.primary.base,
                  flex: 1
                }}
                onMouseEnter={(e) => e.target.style.background = theme.buttons.primary.hover.background}
                onMouseLeave={(e) => e.target.style.background = theme.buttons.primary.base.background}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.colors.bg.page,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          overflow: 'auto',
          padding: '40px'
        }}
        onClick={() => setShowPreviewModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '1400px',
              minHeight: '800px',
              background: theme.colors.bg.card,
              position: 'relative',
              overflow: 'visible',
              borderRadius: theme.radius.md
            }}
          >
                {canvasElements.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: theme.colors.text.secondary,
                    fontSize: '16px'
                  }}>
                    No elements added yet. Start building your form!
                  </div>
                ) : (
                  canvasElements.map((element) => (
                    <div
                      key={element.id}
                      onDoubleClick={(e) => {
                        if (element.type === 'heading' || element.type === 'text') {
                          e.stopPropagation()
                          setEditingElementId(element.id)
                          setSelectedElement(element)
                        }
                      }}
                      style={{
                        position: 'absolute',
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: theme.radius.md,
                        background: element.type === 'button' ? theme.colors.white : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: element.properties?.textAlign === 'center' ? 'center' : element.properties?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        padding: '12px',
                        fontSize: element.properties?.fontSize || '16px',
                        color: element.type === 'button' ? theme.colors.black : element.properties?.color || theme.colors.white,
                        fontWeight: element.properties?.fontWeight || '400',
                        overflow: 'hidden',
                        pointerEvents: editingElementId === element.id ? 'auto' : 'none',
                        cursor: (element.type === 'heading' || element.type === 'text') ? 'text' : 'default'
                      }}
                    >
                      {editingElementId === element.id && (element.type === 'heading' || element.type === 'text') ? (
                        <input
                          type="text"
                          autoFocus
                          value={element.properties?.content || ''}
                          onChange={(e) => {
                            const updated = canvasElements.map(el =>
                              el.id === element.id
                                ? { ...el, properties: { ...el.properties, content: e.target.value } }
                                : el
                            )
                            setCanvasElements(updated)
                            setSelectedElement({ ...element, properties: { ...element.properties, content: e.target.value } })
                          }}
                          onBlur={() => setEditingElementId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingElementId(null)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: element.properties?.color || theme.colors.white,
                            fontSize: 'inherit',
                            fontWeight: 'inherit',
                            textAlign: element.properties?.textAlign || 'left',
                            padding: 0
                          }}
                        />
                      ) : (
                        <>
                          {element.type === 'heading' && element.properties?.content}
                          {element.type === 'text' && element.properties?.content}
                          {element.type === 'button' && element.properties?.label}
                          {element.type === 'file-upload' && <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>File Upload Zone</div>}
                          {element.type === 'text-input' && <div style={{ fontSize: '14px', color: theme.colors.text.secondary, width: '100%' }}>{element.properties?.placeholder || element.properties?.label || 'Text Input'}</div>}
                          {element.type === 'textarea' && <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>Text Area</div>}
                          {!['heading', 'text', 'button', 'file-upload', 'text-input', 'textarea'].includes(element.type) && (
                            <div style={{ fontSize: '12px', color: theme.colors.text.secondary, textTransform: 'uppercase' }}>{element.type.replace('-', ' ')}</div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </>
  )
}

export default Requests
