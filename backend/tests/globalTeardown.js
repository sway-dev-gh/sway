// Global teardown for backend tests

module.exports = async () => {
  console.log('\n🧹 Cleaning up global test environment...')

  // Clean up any test files or resources
  try {
    const fs = require('fs')
    const path = require('path')

    // Clean up test upload directory
    const testUploadPath = process.env.UPLOAD_PATH || '/tmp/sway-test-uploads'
    if (fs.existsSync(testUploadPath)) {
      const files = fs.readdirSync(testUploadPath)
      for (const file of files) {
        fs.unlinkSync(path.join(testUploadPath, file))
      }
      fs.rmdirSync(testUploadPath)
      console.log('🗑️  Cleaned up test upload directory')
    }
  } catch (error) {
    console.log('⚠️  Test cleanup warning:', error.message)
  }

  // Reset environment variables
  delete process.env.DISABLE_REDIS
  delete process.env.DISABLE_POSTGRES
  delete process.env.DISABLE_STRIPE
  delete process.env.DISABLE_EMAIL

  console.log('✅ Global test environment cleaned up')
}