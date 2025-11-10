import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

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
          color: '#ffffff',
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
          backgroundColor: '#ffffff',
          color: '#000000'
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
        y: 50,
        width: 800,
        height: 50,
        properties: {
          content: 'Get In Touch',
          fontSize: '32px',
          color: '#ffffff',
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'template-input-1',
        type: 'text-input',
        x: 100,
        y: 130,
        width: 800,
        height: 48,
        properties: {
          label: 'Full Name',
          placeholder: 'Enter your name'
        }
      },
      {
        id: 'template-input-2',
        type: 'text-input',
        x: 100,
        y: 210,
        width: 800,
        height: 48,
        properties: {
          label: 'Email',
          placeholder: 'your@email.com'
        }
      },
      {
        id: 'template-textarea-1',
        type: 'textarea',
        x: 100,
        y: 290,
        width: 800,
        height: 120,
        properties: {
          label: 'Message',
          placeholder: 'Your message here...'
        }
      },
      {
        id: 'template-upload-2',
        type: 'file-upload',
        x: 100,
        y: 440,
        width: 800,
        height: 100,
        properties: {
          label: 'Attach Files',
          accept: '*',
          multiple: true
        }
      },
      {
        id: 'template-button-2',
        type: 'button',
        x: 450,
        y: 580,
        width: 200,
        height: 48,
        properties: {
          label: 'Send Message',
          backgroundColor: '#ffffff',
          color: '#000000'
        }
      }
    ]
  },
  // PRO TEMPLATES
  {
    id: 'agency',
    name: 'Agency Onboarding',
    description: 'Professional multi-section onboarding form',
    plan: 'pro',
    preview: 'Complete agency client onboarding with brand assets',
    elements: [
      {
        id: 'pro-image-1',
        type: 'image',
        x: 450,
        y: 40,
        width: 200,
        height: 80,
        properties: {
          src: '',
          alt: 'Company Logo'
        }
      },
      {
        id: 'pro-heading-1',
        type: 'heading',
        x: 100,
        y: 150,
        width: 800,
        height: 50,
        properties: {
          content: 'Client Onboarding',
          fontSize: '32px',
          color: '#ffffff',
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'pro-divider-1',
        type: 'divider',
        x: 100,
        y: 220,
        width: 800,
        height: 2,
        properties: {}
      },
      {
        id: 'pro-text-1',
        type: 'text',
        x: 100,
        y: 240,
        width: 800,
        height: 30,
        properties: {
          content: 'Company Information',
          fontSize: '18px',
          color: '#ffffff',
          fontWeight: '600'
        }
      },
      {
        id: 'pro-input-1',
        type: 'text-input',
        x: 100,
        y: 290,
        width: 390,
        height: 48,
        properties: {
          label: 'Company Name',
          placeholder: 'Acme Inc.'
        }
      },
      {
        id: 'pro-input-2',
        type: 'text-input',
        x: 510,
        y: 290,
        width: 390,
        height: 48,
        properties: {
          label: 'Website',
          placeholder: 'www.example.com'
        }
      },
      {
        id: 'pro-select-1',
        type: 'select',
        x: 100,
        y: 370,
        width: 390,
        height: 48,
        properties: {
          label: 'Industry',
          options: 'Technology,Finance,Healthcare,Retail,Other'
        }
      },
      {
        id: 'pro-select-2',
        type: 'select',
        x: 510,
        y: 370,
        width: 390,
        height: 48,
        properties: {
          label: 'Project Budget',
          options: 'Under $10k,$10k-$50k,$50k-$100k,$100k+'
        }
      },
      {
        id: 'pro-divider-2',
        type: 'divider',
        x: 100,
        y: 450,
        width: 800,
        height: 2,
        properties: {}
      },
      {
        id: 'pro-text-2',
        type: 'text',
        x: 100,
        y: 470,
        width: 800,
        height: 30,
        properties: {
          content: 'Brand Assets',
          fontSize: '18px',
          color: '#ffffff',
          fontWeight: '600'
        }
      },
      {
        id: 'pro-multi-file-1',
        type: 'multi-file',
        x: 100,
        y: 520,
        width: 800,
        height: 150,
        properties: {
          label: 'Upload Brand Guide, Logos, and Assets',
          maxFiles: 10
        }
      },
      {
        id: 'pro-checkbox-1',
        type: 'checkbox',
        x: 100,
        y: 700,
        width: 800,
        height: 24,
        properties: {
          label: 'I agree to the terms and conditions'
        }
      },
      {
        id: 'pro-button-1',
        type: 'button',
        x: 450,
        y: 750,
        width: 200,
        height: 48,
        properties: {
          label: 'Submit',
          backgroundColor: '#ffffff',
          color: '#000000'
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
        y: 40,
        width: 800,
        height: 50,
        properties: {
          content: 'Submit New Product',
          fontSize: '32px',
          color: '#ffffff',
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'prod-input-1',
        type: 'text-input',
        x: 100,
        y: 120,
        width: 390,
        height: 48,
        properties: {
          label: 'Product Name',
          placeholder: 'Product title'
        }
      },
      {
        id: 'prod-input-2',
        type: 'text-input',
        x: 510,
        y: 120,
        width: 390,
        height: 48,
        properties: {
          label: 'SKU',
          placeholder: 'SKU-001'
        }
      },
      {
        id: 'prod-select-1',
        type: 'select',
        x: 100,
        y: 200,
        width: 250,
        height: 48,
        properties: {
          label: 'Category',
          options: 'Electronics,Clothing,Home,Sports,Books'
        }
      },
      {
        id: 'prod-input-3',
        type: 'text-input',
        x: 370,
        y: 200,
        width: 250,
        height: 48,
        properties: {
          label: 'Price',
          placeholder: '$99.99'
        }
      },
      {
        id: 'prod-rating-1',
        type: 'star-rating',
        x: 640,
        y: 200,
        width: 260,
        height: 48,
        properties: {
          label: 'Quality Rating'
        }
      },
      {
        id: 'prod-rich-text-1',
        type: 'rich-text',
        x: 100,
        y: 280,
        width: 800,
        height: 120,
        properties: {
          label: 'Product Description',
          placeholder: 'Detailed product description...'
        }
      },
      {
        id: 'prod-gallery-1',
        type: 'image-gallery',
        x: 100,
        y: 430,
        width: 800,
        height: 250,
        properties: {
          label: 'Product Images (up to 6)',
          gridSize: '2x3'
        }
      },
      {
        id: 'prod-button-1',
        type: 'button',
        x: 450,
        y: 710,
        width: 200,
        height: 48,
        properties: {
          label: 'Submit Product',
          backgroundColor: '#ffffff',
          color: '#000000'
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
        y: 40,
        width: 800,
        height: 50,
        properties: {
          content: 'Event Registration',
          fontSize: '32px',
          color: '#ffffff',
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'event-input-1',
        type: 'text-input',
        x: 100,
        y: 120,
        width: 390,
        height: 48,
        properties: {
          label: 'Full Name',
          placeholder: 'John Doe'
        }
      },
      {
        id: 'event-input-2',
        type: 'text-input',
        x: 510,
        y: 120,
        width: 390,
        height: 48,
        properties: {
          label: 'Email',
          placeholder: 'john@example.com'
        }
      },
      {
        id: 'event-input-3',
        type: 'text-input',
        x: 100,
        y: 200,
        width: 390,
        height: 48,
        properties: {
          label: 'Company',
          placeholder: 'Company name'
        }
      },
      {
        id: 'event-input-4',
        type: 'text-input',
        x: 510,
        y: 200,
        width: 390,
        height: 48,
        properties: {
          label: 'Job Title',
          placeholder: 'Position'
        }
      },
      {
        id: 'event-select-1',
        type: 'select',
        x: 100,
        y: 280,
        width: 390,
        height: 48,
        properties: {
          label: 'Ticket Type',
          options: 'VIP Pass,Standard,Press'
        }
      },
      {
        id: 'event-date-1',
        type: 'date-picker',
        x: 510,
        y: 280,
        width: 390,
        height: 48,
        properties: {
          label: 'Availability Date'
        }
      },
      {
        id: 'event-upload-1',
        type: 'file-upload',
        x: 100,
        y: 360,
        width: 800,
        height: 100,
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
        y: 490,
        width: 800,
        height: 100,
        properties: {
          label: 'Special Requests',
          placeholder: 'Dietary restrictions, accessibility needs, etc.'
        }
      },
      {
        id: 'event-button-1',
        type: 'button',
        x: 450,
        y: 620,
        width: 200,
        height: 48,
        properties: {
          label: 'Register',
          backgroundColor: '#ffffff',
          color: '#000000'
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
        y: 40,
        width: 800,
        height: 50,
        properties: {
          content: 'Creative Brief',
          fontSize: '32px',
          color: '#ffffff',
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'creative-input-1',
        type: 'text-input',
        x: 100,
        y: 120,
        width: 390,
        height: 48,
        properties: {
          label: 'Project Name',
          placeholder: 'Project title'
        }
      },
      {
        id: 'creative-input-2',
        type: 'text-input',
        x: 510,
        y: 120,
        width: 390,
        height: 48,
        properties: {
          label: 'Client Name',
          placeholder: 'Client'
        }
      },
      {
        id: 'creative-multi-file-1',
        type: 'multi-file',
        x: 100,
        y: 200,
        width: 800,
        height: 120,
        properties: {
          label: 'Brand Assets',
          maxFiles: 10
        }
      },
      {
        id: 'creative-gallery-1',
        type: 'image-gallery',
        x: 100,
        y: 350,
        width: 800,
        height: 300,
        properties: {
          label: 'Mood Board (4x4)',
          gridSize: '4x4'
        }
      },
      {
        id: 'creative-color-1',
        type: 'color-picker',
        x: 100,
        y: 680,
        width: 150,
        height: 48,
        properties: {
          label: 'Primary Color'
        }
      },
      {
        id: 'creative-color-2',
        type: 'color-picker',
        x: 270,
        y: 680,
        width: 150,
        height: 48,
        properties: {
          label: 'Secondary'
        }
      },
      {
        id: 'creative-color-3',
        type: 'color-picker',
        x: 440,
        y: 680,
        width: 150,
        height: 48,
        properties: {
          label: 'Accent'
        }
      },
      {
        id: 'creative-button-1',
        type: 'button',
        x: 450,
        y: 760,
        width: 200,
        height: 48,
        properties: {
          label: 'Submit Brief',
          backgroundColor: '#ffffff',
          color: '#000000'
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
        y: 40,
        width: 800,
        height: 50,
        properties: {
          content: 'Job Application',
          fontSize: '32px',
          color: '#ffffff',
          fontWeight: '600',
          textAlign: 'center'
        }
      },
      {
        id: 'job-input-1',
        type: 'text-input',
        x: 100,
        y: 120,
        width: 390,
        height: 48,
        properties: {
          label: 'Full Name',
          placeholder: 'Your name'
        }
      },
      {
        id: 'job-input-2',
        type: 'text-input',
        x: 510,
        y: 120,
        width: 390,
        height: 48,
        properties: {
          label: 'Email',
          placeholder: 'your@email.com'
        }
      },
      {
        id: 'job-input-3',
        type: 'text-input',
        x: 100,
        y: 200,
        width: 390,
        height: 48,
        properties: {
          label: 'Phone',
          placeholder: '+1 (555) 000-0000'
        }
      },
      {
        id: 'job-input-4',
        type: 'text-input',
        x: 510,
        y: 200,
        width: 390,
        height: 48,
        properties: {
          label: 'Location',
          placeholder: 'City, State'
        }
      },
      {
        id: 'job-upload-1',
        type: 'file-upload',
        x: 100,
        y: 280,
        width: 390,
        height: 100,
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
        y: 280,
        width: 390,
        height: 100,
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
        y: 410,
        width: 800,
        height: 48,
        properties: {
          label: 'Portfolio/Website',
          placeholder: 'https://yourportfolio.com'
        }
      },
      {
        id: 'job-multi-file-1',
        type: 'multi-file',
        x: 100,
        y: 490,
        width: 800,
        height: 120,
        properties: {
          label: 'Work Samples',
          maxFiles: 5
        }
      },
      {
        id: 'job-date-1',
        type: 'date-picker',
        x: 100,
        y: 640,
        width: 390,
        height: 48,
        properties: {
          label: 'Available Start Date'
        }
      },
      {
        id: 'job-input-6',
        type: 'text-input',
        x: 510,
        y: 640,
        width: 390,
        height: 48,
        properties: {
          label: 'Salary Expectations',
          placeholder: '$80,000 - $100,000'
        }
      },
      {
        id: 'job-button-1',
        type: 'button',
        x: 450,
        y: 720,
        width: 200,
        height: 48,
        properties: {
          label: 'Submit Application',
          backgroundColor: '#ffffff',
          color: '#000000'
        }
      }
    ]
  }
]

// Component Library - Elements that can be dragged onto canvas
const COMPONENT_LIBRARY = [
  // FREE ELEMENTS
  {
    id: 'text',
    label: 'Text Block',
    icon: 'TEXT',
    description: 'Paragraph text',
    plan: 'free'
  },
  {
    id: 'heading',
    label: 'Heading',
    icon: 'HEAD',
    description: 'Title or heading',
    plan: 'free'
  },
  {
    id: 'text-input',
    label: 'Text Input',
    icon: 'INPUT',
    description: 'Single line input',
    plan: 'free'
  },
  {
    id: 'textarea',
    label: 'Text Area',
    icon: 'AREA',
    description: 'Multi-line text input',
    plan: 'free'
  },
  {
    id: 'file-upload',
    label: 'File Upload',
    icon: 'FILE',
    description: 'File upload zone',
    plan: 'free'
  },
  {
    id: 'button',
    label: 'Button',
    icon: 'BTN',
    description: 'Action button',
    plan: 'free'
  },
  // PRO ELEMENTS
  {
    id: 'rich-text',
    label: 'Rich Text',
    icon: 'RICH',
    description: 'Formatted text editor',
    plan: 'pro'
  },
  {
    id: 'multi-file',
    label: 'Multi-File',
    icon: 'MF',
    description: 'Multiple file uploads',
    plan: 'pro'
  },
  {
    id: 'image-gallery',
    label: 'Image Gallery',
    icon: 'GAL',
    description: 'Image upload grid',
    plan: 'pro'
  },
  {
    id: 'date-picker',
    label: 'Date Picker',
    icon: 'DATE',
    description: 'Calendar selector',
    plan: 'pro'
  },
  {
    id: 'time-picker',
    label: 'Time Picker',
    icon: 'TIME',
    description: 'Time selector',
    plan: 'pro'
  },
  {
    id: 'color-picker',
    label: 'Color Picker',
    icon: 'COLOR',
    description: 'Color input',
    plan: 'pro'
  },
  {
    id: 'range-slider',
    label: 'Range Slider',
    icon: 'RANGE',
    description: 'Numeric slider',
    plan: 'pro'
  },
  {
    id: 'star-rating',
    label: 'Star Rating',
    icon: 'STAR',
    description: '1-5 star rating',
    plan: 'pro'
  },
  {
    id: 'signature',
    label: 'Signature',
    icon: 'SIG',
    description: 'Signature pad',
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
    description: 'Vertical spacing',
    plan: 'pro'
  },
  {
    id: 'select',
    label: 'Dropdown',
    icon: 'SELECT',
    description: 'Select menu',
    plan: 'pro'
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    icon: 'CHECK',
    description: 'Checkbox field',
    plan: 'pro'
  },
  {
    id: 'image',
    label: 'Image',
    icon: 'IMG',
    description: 'Image placeholder',
    plan: 'pro'
  },
  {
    id: 'two-column',
    label: 'Two Columns',
    icon: '2COL',
    description: '2-column layout',
    plan: 'pro'
  },
  {
    id: 'three-column',
    label: 'Three Columns',
    icon: '3COL',
    description: '3-column layout',
    plan: 'pro'
  }
]

// Default properties for each component type
const DEFAULT_PROPERTIES = {
  'text': {
    content: 'Enter your text here',
    fontSize: '16px',
    color: '#cccccc',
    fontWeight: '400',
    textAlign: 'left'
  },
  'heading': {
    content: 'Heading Text',
    fontSize: '32px',
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
    color: '#000000'
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
    defaultColor: '#3b82f6'
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
    color: '#3a3a3a'
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
  const [canvasElements, setCanvasElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [selectedElements, setSelectedElements] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedComponent, setDraggedComponent] = useState(null)
  const [formTitle, setFormTitle] = useState('Untitled Form')
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
      alert('Please add a form title before saving')
      return
    }

    if (canvasElements.length === 0) {
      alert('Please add at least one element to your form before saving')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const formData = {
        title: formTitle,
        elements: canvasElements,
        status: 'draft'
      }

      const response = await api.post('/api/requests', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Form saved as draft!')
      navigate('/tracking')
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save form. Please try again.')
    }
  }

  // Publish form (make it live)
  const handlePublish = async () => {
    // Validation
    if (!formTitle || formTitle.trim() === '') {
      alert('Please add a form title before publishing')
      return
    }

    if (canvasElements.length === 0) {
      alert('Please add at least one element to your form before publishing')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const formData = {
        title: formTitle,
        elements: canvasElements,
        status: 'live'
      }

      const response = await api.post('/api/requests', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Form published successfully!')
      navigate('/tracking')
    } catch (error) {
      console.error('Publish error:', error)
      alert('Failed to publish form. Please try again.')
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
  }, [selectedElement, canvasElements, clipboard, historyIndex, history])

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
    setSelectedElement(element)
    setIsDraggingElement(true)
    const canvasRect = canvasRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - canvasRect.left - element.x,
      y: e.clientY - canvasRect.top - element.y
    })
  }

  const handleMouseMove = (e) => {
    if (isDraggingElement && selectedElement && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect()
      const newX = e.clientX - canvasRect.left - dragOffset.x
      const newY = e.clientY - canvasRect.top - dragOffset.y

      const newElements = canvasElements.map(el => {
        if (el.id === selectedElement.id) {
          const updated = { ...el, x: newX, y: newY }
          setSelectedElement(updated)
          return updated
        }
        return el
      })
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
    const isSelected = selectedElement?.id === element.id

    const elementStyle = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: type === 'textarea' || type === 'rich-text' || type === 'signature' ? `${height}px` : 'auto',
      minHeight: type === 'spacer' ? `${properties.height || '40px'}` : 'auto',
      cursor: isDraggingElement ? 'grabbing' : 'grab',
      border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
      outline: isSelected ? '2px solid rgba(59, 130, 246, 0.3)' : 'none',
      outlineOffset: '2px',
      borderRadius: '4px',
      transition: isDraggingElement ? 'none' : 'all 0.15s ease',
      boxSizing: 'border-box'
    }

    const commonProps = {
      key: element.id,
      style: elementStyle,
      onMouseDown: (e) => handleElementMouseDown(element, e),
      onClick: (e) => handleElementSelect(element, e)
    }

    switch (type) {
      case 'text':
        return (
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
        return (
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
        return (
          <div {...commonProps}>
            <div style={{ padding: '8px' }}>
              {properties.label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
                  {properties.label} {properties.required && <span style={{ color: '#ff4444' }}>*</span>}
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
                  border: '1px solid #3a3a3a',
                  borderRadius: '4px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
                  {properties.label} {properties.required && <span style={{ color: '#ff4444' }}>*</span>}
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
                  border: '1px solid #3a3a3a',
                  borderRadius: '4px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
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
              backgroundColor: '#1a1a1a',
              border: '2px dashed #3a3a3a',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>↑</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>{properties.label}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
                  {properties.label} {properties.required && <span style={{ color: '#ff4444' }}>*</span>}
                </div>
              )}
              <div style={{
                width: '100%',
                height: 'calc(100% - 32px)',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                backgroundColor: '#1a1a1a',
                color: '#888',
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
                  {properties.label}
                </div>
              )}
              <div style={{
                width: '100%',
                height: 'calc(100% - 32px)',
                backgroundColor: '#1a1a1a',
                border: '2px dashed #3a3a3a',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '600', color: '#888' }}>MULTI FILE</div>
                <div style={{ fontSize: '13px', color: '#888' }}>
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
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
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #3a3a3a',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    aspectRatio: '1/1'
                  }}>
                    <span style={{ fontSize: '20px', color: '#444' }}>+</span>
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
                  {properties.label} {properties.required && <span style={{ color: '#ff4444' }}>*</span>}
                </div>
              )}
              <input
                type="date"
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #3a3a3a',
                  borderRadius: '4px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
                  {properties.label} {properties.required && <span style={{ color: '#ff4444' }}>*</span>}
                </div>
              )}
              <input
                type="time"
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #3a3a3a',
                  borderRadius: '4px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
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
                  border: '1px solid #3a3a3a',
                  borderRadius: '4px',
                  backgroundColor: '#1a1a1a',
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginTop: '4px' }}>
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
                  {properties.label}
                </div>
              )}
              <div style={{ display: 'flex', gap: '4px', fontSize: '24px' }}>
                {Array.from({ length: properties.maxStars }).map((_, i) => (
                  <span key={i} style={{ color: '#ffffff' }}>★</span>
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
                  {properties.label} {properties.required && <span style={{ color: '#ff4444' }}>*</span>}
                </div>
              )}
              <div style={{
                width: '100%',
                height: 'calc(100% - 32px)',
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
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
              backgroundColor: properties.color || '#3a3a3a',
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
              border: '1px dashed #3a3a3a',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
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
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>
                  {properties.label} {properties.required && <span style={{ color: '#ff4444' }}>*</span>}
                </div>
              )}
              <select
                disabled
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #3a3a3a',
                  borderRadius: '4px',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
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
              <span style={{ fontSize: '14px', color: '#ffffff' }}>
                {properties.label} {properties.required && <span style={{ color: '#ff4444' }}>*</span>}
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
              backgroundColor: '#1a1a1a',
              border: '1px solid #3a3a3a',
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
                <div style={{ textAlign: 'center', color: '#666' }}>
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
                  backgroundColor: '#1a1a1a',
                  border: '1px dashed #3a3a3a',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
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
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#ffffff',
          paddingTop: '54px',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Top Toolbar */}
        <div style={{
          height: '64px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: '#0a0a0a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              ←
            </button>
            {isEditingTitle ? (
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false)
                }}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #3b82f6',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '500',
                  padding: '4px 0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  minWidth: '200px'
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  margin: 0,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                {formTitle}
              </h1>
            )}

            {/* Plan Badge */}
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: userPlan === 'pro' ? '#ffffff' : '#888',
              background: userPlan === 'pro' ? 'rgba(255, 255, 255, 0.1)' : '#1a1a1a',
              padding: '4px 10px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {userPlan === 'free' ? `FREE (${canvasElements.length}/5)` : 'PRO'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Keyboard shortcuts hint */}
            <div style={{ fontSize: '11px', color: '#666', marginRight: '8px' }}>
              {userPlan === 'pro' ? 'Shortcuts enabled' : 'Upgrade for shortcuts'}
            </div>

            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a2a',
                color: historyIndex <= 0 ? '#444' : '#888',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a2a',
                color: historyIndex >= history.length - 1 ? '#444' : '#888',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Redo
            </button>
            <button
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid #2a2a2a',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
              onClick={() => setShowPreviewModal(true)}
            >
              Preview
            </button>
            <button
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid #2a2a2a',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
              onClick={handleSave}
            >
              Save
            </button>
            <button
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
              onClick={handlePublish}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Three Column Layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT SIDEBAR */}
          <div style={{
            width: '280px',
            borderRight: '1px solid #2a2a2a',
            background: '#0a0a0a',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a' }}>
              <button
                onClick={() => setActiveTab('templates')}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: activeTab === 'templates' ? '#1a1a1a' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'templates' ? '2px solid #ffffff' : '2px solid transparent',
                  color: activeTab === 'templates' ? '#ffffff' : '#666',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('elements')}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: activeTab === 'elements' ? '#1a1a1a' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'elements' ? '2px solid #ffffff' : '2px solid transparent',
                  color: activeTab === 'elements' ? '#ffffff' : '#666',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Elements
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ padding: '20px 16px' }}>
              {activeTab === 'templates' ? (
                <>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#666',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Choose a Template
                  </div>

                  {TEMPLATES.map((template) => {
                    const isPro = template.plan === 'pro'
                    const isLocked = isPro && userPlan === 'free'

                    return (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        style={{
                          padding: '14px',
                          marginBottom: '10px',
                          background: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          opacity: isLocked ? 0.6 : 1,
                          position: 'relative'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                            {template.name}
                          </div>
                          {isPro && (
                            <div style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: isLocked ? '#888' : '#ffffff',
                              background: isLocked ? '#2a2a2a' : 'rgba(255, 255, 255, 0.1)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              PRO
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', lineHeight: '1.4' }}>
                          {template.description}
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#666',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Drag to Canvas
                  </div>

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
                          marginBottom: '8px',
                          background: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '6px',
                          cursor: isLocked ? 'not-allowed' : 'grab',
                          userSelect: 'none',
                          opacity: isLocked ? 0.6 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#ffffff',
                            minWidth: '32px',
                            textAlign: 'center',
                            background: '#2a2a2a',
                            borderRadius: '6px',
                            padding: '6px',
                            lineHeight: '1'
                          }}>
                            {component.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '2px'
                            }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: '#ffffff' }}>
                                {component.label}
                              </div>
                              {isPro && (
                                <div style={{
                                  fontSize: '9px',
                                  fontWeight: '700',
                                  color: isLocked ? '#888' : '#ffffff',
                                  background: isLocked ? '#2a2a2a' : 'rgba(255, 255, 255, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px'
                                }}>
                                  PRO
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              {component.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* CENTER - Canvas */}
          <div style={{
            flex: 1,
            overflow: 'hidden',
            background: '#1a1a1a',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: '40px'
          }}>
            <div
              ref={canvasRef}
              onDrop={handleCanvasDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                width: '1200px',
                height: '800px',
                background: '#000000',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                borderRadius: '8px',
                position: 'relative',
                border: isDragging ? '2px dashed #3b82f6' : '1px solid #2a2a2a',
                overflow: 'hidden'
              }}
            >
              {canvasElements.length === 0 && !isDragging && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#444',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>↓</div>
                  <div style={{ fontSize: '16px' }}>Drag elements or choose a template to start</div>
                </div>
              )}

              {canvasElements.map(renderCanvasElement)}

              {isDragging && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '18px',
                  color: '#666',
                  pointerEvents: 'none'
                }}>
                  Drop here to add element
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR - Properties */}
          <div style={{
            width: '280px',
            borderLeft: '1px solid #2a2a2a',
            background: '#0a0a0a',
            overflowY: 'auto',
            padding: '20px',
            paddingBottom: '40px',
            boxSizing: 'border-box'
          }}>
            {selectedElement ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                    {COMPONENT_LIBRARY.find(c => c.id === selectedElement.type)?.label}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleDuplicateElement}
                      style={{
                        background: 'transparent',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#888',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={handleDeleteElement}
                      style={{
                        background: 'transparent',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#ff4444',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Dynamic Properties */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Position */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#888',
                      marginBottom: '8px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Position
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                          padding: '8px',
                          fontSize: '13px',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          background: '#1a1a1a',
                          color: '#ffffff',
                          fontFamily: 'inherit'
                        }}
                        placeholder="X"
                      />
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
                          padding: '8px',
                          fontSize: '13px',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          background: '#1a1a1a',
                          color: '#ffffff',
                          fontFamily: 'inherit'
                        }}
                        placeholder="Y"
                      />
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#888',
                      marginBottom: '8px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Size
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                          padding: '8px',
                          fontSize: '13px',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          background: '#1a1a1a',
                          color: '#ffffff',
                          fontFamily: 'inherit'
                        }}
                        placeholder="Width"
                      />
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
                          padding: '8px',
                          fontSize: '13px',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          background: '#1a1a1a',
                          color: '#ffffff',
                          fontFamily: 'inherit'
                        }}
                        placeholder="Height"
                      />
                    </div>
                  </div>

                  {/* Element-specific properties */}
                  {Object.entries(selectedElement.properties).map(([key, value]) => (
                    <div key={key}>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        color: '#888',
                        marginBottom: '8px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      {typeof value === 'boolean' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handlePropertyChange(key, e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <span style={{ fontSize: '13px', color: '#ccc' }}>Enabled</span>
                        </label>
                      ) : key.toLowerCase().includes('color') ? (
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => handlePropertyChange(key, e.target.value)}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '4px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            cursor: 'pointer'
                          }}
                        />
                      ) : typeof value === 'number' ? (
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handlePropertyChange(key, parseInt(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit'
                          }}
                        />
                      ) : key === 'content' && selectedElement.type === 'text' ? (
                        <textarea
                          value={value}
                          onChange={(e) => handlePropertyChange(key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            minHeight: '80px'
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handlePropertyChange(key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit'
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '60px 20px'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '16px', opacity: 0.3 }}>◇</div>
                <div style={{ fontSize: '13px' }}>
                  Select an element to edit its properties
                </div>
                <div style={{ fontSize: '11px', marginTop: '16px', color: '#444', lineHeight: '1.6' }}>
                  {userPlan === 'pro' ? (
                    <>
                      Delete: Del/Backspace<br/>
                      Duplicate: Cmd+D<br/>
                      Copy: Cmd+C<br/>
                      Paste: Cmd+V<br/>
                      Undo: Cmd+Z<br/>
                      Redo: Cmd+Shift+Z
                    </>
                  ) : (
                    'Upgrade to Pro for keyboard shortcuts'
                  )}
                </div>
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
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
              {selectedTemplate.name}
            </div>
            <div style={{ fontSize: '15px', color: '#999', marginBottom: '24px', lineHeight: '1.6' }}>
              {selectedTemplate.preview}
            </div>

            <div style={{
              background: '#0a0a0a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px',
              minHeight: '300px',
              maxHeight: '400px',
              overflow: 'auto',
              position: 'relative'
            }}>
              {selectedTemplate.elements.length > 0 ? (
                <div style={{
                  width: '100%',
                  minHeight: '280px',
                  background: '#000',
                  borderRadius: '6px',
                  border: '1px solid #1a1a1a',
                  position: 'relative',
                  transform: 'scale(0.4)',
                  transformOrigin: 'top left',
                  width: '250%',
                  height: '600px'
                }}>
                  {selectedTemplate.elements.map((element) => (
                    <div
                      key={element.id}
                      style={{
                        position: 'absolute',
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        border: '1px solid #333',
                        borderRadius: '4px',
                        background: element.type === 'button' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        fontSize: element.properties?.fontSize || '14px',
                        color: element.type === 'button' ? '#000' : '#fff',
                        fontWeight: element.properties?.fontWeight || '400',
                        textAlign: element.properties?.textAlign || 'left',
                        overflow: 'hidden',
                        pointerEvents: 'none'
                      }}
                    >
                      {element.type === 'heading' && element.properties?.content}
                      {element.type === 'text' && element.properties?.content}
                      {element.type === 'button' && element.properties?.label}
                      {element.type === 'file-upload' && <div style={{ fontSize: '12px', color: '#666' }}>File Upload</div>}
                      {element.type === 'text-input' && <div style={{ fontSize: '12px', color: '#666' }}>{element.properties?.label || 'Text Input'}</div>}
                      {element.type === 'textarea' && <div style={{ fontSize: '12px', color: '#666' }}>Text Area</div>}
                      {!['heading', 'text', 'button', 'file-upload', 'text-input', 'textarea'].includes(element.type) && (
                        <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>{element.type}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '280px',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  Empty canvas - start from scratch
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTemplateModal(false)
                  setSelectedTemplate(null)
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  color: '#888',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUseTemplate}
                style={{
                  background: '#ffffff',
                  border: 'none',
                  color: '#000000',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
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
              background: '#1a1a1a',
              border: '1px solid #ffffff',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Upgrade to Pro
            </div>
            <div style={{
              fontSize: '15px',
              color: '#ccc',
              marginBottom: '24px',
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              Unlock the full power of the form builder with Pro features.
            </div>

            <div style={{
              background: '#0a0a0a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pro Features Include:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#999', fontSize: '14px', lineHeight: '2' }}>
                <li>Unlimited elements per form</li>
                <li>15+ advanced elements (Rich Text, Multi-File, Gallery, Date/Time Pickers, etc.)</li>
                <li>5 premium templates</li>
                <li>Full keyboard shortcuts</li>
                <li>Advanced layout tools (Multi-column, Dividers, Spacers)</li>
                <li>Signature pads and star ratings</li>
                <li>Priority support</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  color: '#888',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false)
                  alert('Redirecting to pricing page...')
                }}
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: 'none',
                  color: '#000000',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
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
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '40px'
        }}
        onClick={() => setShowPreviewModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#000',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              maxWidth: '1400px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid #2a2a2a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                  Form Preview
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {formTitle}
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Close Preview
              </button>
            </div>

            {/* Canvas Preview */}
            <div style={{
              padding: '40px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              minHeight: '600px'
            }}>
              <div style={{
                width: '1200px',
                height: '800px',
                background: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {canvasElements.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#666',
                    fontSize: '16px'
                  }}>
                    No elements added yet. Start building your form!
                  </div>
                ) : (
                  canvasElements.map((element) => (
                    <div
                      key={element.id}
                      style={{
                        position: 'absolute',
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        border: '1px solid #333',
                        borderRadius: '6px',
                        background: element.type === 'button' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: element.properties?.textAlign === 'center' ? 'center' : element.properties?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        padding: '12px',
                        fontSize: element.properties?.fontSize || '16px',
                        color: element.type === 'button' ? '#000' : element.properties?.color || '#fff',
                        fontWeight: element.properties?.fontWeight || '400',
                        overflow: 'hidden',
                        pointerEvents: 'none'
                      }}
                    >
                      {element.type === 'heading' && element.properties?.content}
                      {element.type === 'text' && element.properties?.content}
                      {element.type === 'button' && element.properties?.label}
                      {element.type === 'file-upload' && <div style={{ fontSize: '14px', color: '#999' }}>File Upload Zone</div>}
                      {element.type === 'text-input' && <div style={{ fontSize: '14px', color: '#999', width: '100%' }}>{element.properties?.placeholder || element.properties?.label || 'Text Input'}</div>}
                      {element.type === 'textarea' && <div style={{ fontSize: '14px', color: '#999' }}>Text Area</div>}
                      {!['heading', 'text', 'button', 'file-upload', 'text-input', 'textarea'].includes(element.type) && (
                        <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>{element.type.replace('-', ' ')}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Requests
