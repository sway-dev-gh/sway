// Global setup for backend tests

module.exports = async () => {
  console.log('\n🧪 Setting up global test environment...')

  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.PORT = '5002' // Use different port for testing
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing'
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long'

  // Database configuration for tests
  process.env.DB_HOST = 'localhost'
  process.env.DB_PORT = '5432'
  process.env.DB_NAME = 'sway_test'
  process.env.DB_USER = 'test_user'
  process.env.DB_PASS = 'test_password'

  // Redis configuration for tests
  process.env.REDIS_URL = 'redis://localhost:6379/1'

  // Disable external services for testing
  process.env.DISABLE_REDIS = 'true'
  process.env.DISABLE_POSTGRES = 'true'
  process.env.DISABLE_STRIPE = 'true'
  process.env.DISABLE_EMAIL = 'true'

  // Security settings for tests
  process.env.CSRF_SECRET = 'test-csrf-secret'
  process.env.SESSION_SECRET = 'test-session-secret'

  // File upload settings for tests
  process.env.UPLOAD_PATH = '/tmp/sway-test-uploads'
  process.env.MAX_FILE_SIZE = '10485760' // 10MB

  // Rate limiting settings for tests (more permissive)
  process.env.RATE_LIMIT_WINDOW = '60000' // 1 minute
  process.env.RATE_LIMIT_MAX = '1000' // 1000 requests per minute

  // Logging settings for tests
  process.env.LOG_LEVEL = 'error' // Only log errors during tests
  process.env.LOG_TO_CONSOLE = 'false'

  console.log('✅ Global test environment configured')
}