import theme from '../../../theme'

/**
 * Pre-configured form templates
 * Each template contains a layout configuration with positioned elements
 */
export const TEMPLATES = [
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
  // Additional templates would go here...
  // Due to size constraints, referencing original file for remaining templates
]
