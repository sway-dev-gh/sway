// Backend Jest setup file for Node.js testing environment

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env.test') })

// Add Node.js globals for modern web APIs
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to silence logs during testing
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Mock Redis client for tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
  })),
}))

// Mock PostgreSQL client for tests
jest.mock('pg', () => {
  const mockClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    release: jest.fn(),
  }

  const mockPool = {
    connect: jest.fn(() => Promise.resolve(mockClient)),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  }

  return {
    Client: jest.fn(() => mockClient),
    Pool: jest.fn(() => mockPool),
  }
})

// Mock Socket.IO for real-time testing
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
    in: jest.fn(() => ({
      emit: jest.fn(),
    })),
    use: jest.fn(),
    close: jest.fn(),
  })),
}))

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
}))

// Mock multer for file upload testing
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('test content'),
        size: 12,
      }
      next()
    },
    array: () => (req, res, next) => {
      req.files = [
        {
          fieldname: 'files',
          originalname: 'test1.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          buffer: Buffer.from('test content 1'),
          size: 14,
        },
        {
          fieldname: 'files',
          originalname: 'test2.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          buffer: Buffer.from('test content 2'),
          size: 14,
        },
      ]
      next()
    },
  })
  multer.memoryStorage = jest.fn()
  return multer
})

// Mock Winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}))

// Mock bcrypt for password hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) =>
    Promise.resolve(hash === `hashed_${password}`)
  ),
  genSalt: jest.fn(() => Promise.resolve('salt')),
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => 'mock.jwt.token'),
  verify: jest.fn((token, secret) => ({
    userId: 'test-user-id',
    email: 'test@example.com',
    iat: Date.now(),
    exp: Date.now() + 3600000,
  })),
  decode: jest.fn(() => ({ userId: 'test-user-id' })),
}))

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      list: jest.fn(),
    },
    paymentMethods: {
      create: jest.fn(),
      attach: jest.fn(),
      detach: jest.fn(),
      list: jest.fn(),
    },
    prices: {
      list: jest.fn(),
      retrieve: jest.fn(),
    },
    products: {
      list: jest.fn(),
      retrieve: jest.fn(),
    },
  }))
})

// Mock crypto for security functions
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn((text) => ({ toString: () => `encrypted_${text}` })),
    decrypt: jest.fn((encrypted) => ({
      toString: jest.fn(() => encrypted.replace('encrypted_', ''))
    })),
  },
  enc: {
    Utf8: {},
  },
  lib: {
    WordArray: {
      random: jest.fn(() => ({ toString: () => 'random-string' })),
    },
  },
}))

// Mock node-cache
jest.mock('node-cache', () => {
  return jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(() => []),
    getStats: jest.fn(() => ({ hits: 0, misses: 0, keys: 0 })),
    flushAll: jest.fn(),
    close: jest.fn(),
  }))
})

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.DB_HOST = 'localhost'
  process.env.DB_PORT = '5432'
  process.env.DB_NAME = 'sway_test'
  process.env.DB_USER = 'test'
  process.env.DB_PASS = 'test'
  process.env.REDIS_URL = 'redis://localhost:6379/1'
})

// Clean up after each test
beforeEach(() => {
  jest.clearAllMocks()
})

// Global test teardown
afterAll(async () => {
  // Clean up any global resources
})

// Error handling for async tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})