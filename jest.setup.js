import '@testing-library/jest-dom'

// Add TextEncoder/TextDecoder for MSW and other dependencies
global.TextEncoder = global.TextEncoder || require('util').TextEncoder
global.TextDecoder = global.TextDecoder || require('util').TextDecoder

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Mock ResizeObserver for components that use it
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia for responsive components
global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />
  }
})

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    section: 'section',
    article: 'article',
    header: 'header',
    nav: 'nav',
    main: 'main',
    footer: 'footer',
    aside: 'aside',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    p: 'p',
    a: 'a',
    button: 'button',
    input: 'input',
    textarea: 'textarea',
    form: 'form',
    img: 'img',
    video: 'video',
    audio: 'audio',
    canvas: 'canvas',
    svg: 'svg',
    path: 'path',
    circle: 'circle',
    rect: 'rect',
    line: 'line',
    polygon: 'polygon',
    polyline: 'polyline',
    ellipse: 'ellipse',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: () => ({
    get: jest.fn(),
    set: jest.fn(),
  }),
}))

// Mock lucide-react icons to avoid SVG rendering issues
jest.mock('lucide-react', () => {
  const icons = {}
  const iconNames = [
    'Plus', 'FileText', 'Save', 'Users', 'Eye', 'MessageSquare', 'Clock', 'Settings',
    'Bell', 'Check', 'X', 'ArrowRight', 'ArrowLeft', 'ChevronDown', 'ChevronUp',
    'Search', 'Filter', 'Download', 'Upload', 'Edit', 'Trash', 'Star', 'Heart',
    'Home', 'User', 'Menu', 'MoreHorizontal', 'MoreVertical', 'Calendar', 'Mail',
    'Phone', 'MapPin', 'Globe', 'Link', 'Share', 'Copy', 'Clipboard', 'Archive',
    'Folder', 'FolderOpen', 'Image', 'Video', 'Music', 'File', 'Database',
    'Server', 'Shield', 'Lock', 'Unlock', 'Key', 'AlertTriangle', 'AlertCircle',
    'Info', 'CheckCircle', 'XCircle', 'HelpCircle', 'Zap', 'Wifi', 'WifiOff',
    'Bluetooth', 'Battery', 'Volume', 'VolumeOff', 'Play', 'Pause', 'Stop',
    'SkipBack', 'SkipForward', 'Repeat', 'Shuffle', 'Maximize', 'Minimize',
    'Monitor', 'Smartphone', 'Tablet', 'Laptop', 'Tv', 'Camera', 'Printer',
  ]

  iconNames.forEach(name => {
    icons[name] = function MockIcon(props) {
      return <svg data-testid={`${name}-icon`} {...props}>{name}</svg>
    }
  })

  return icons
})

// Mock WebSocket for real-time features
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock fetch for API calls
global.fetch = jest.fn()

// Console error suppression for cleaner test output
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: validateDOMNesting'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Set up fake timers for tests that need them
beforeEach(() => {
  jest.clearAllMocks()
  fetch.mockClear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
})