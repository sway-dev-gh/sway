const pool = require('../db/pool')

/**
 * Create a notification for a user
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} metadata - Optional metadata
 */
async function createNotification(userId, type, title, message, metadata = {}) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, JSON.stringify(metadata)]
    )
  } catch (error) {
    console.error('Create notification error:', error)
  }
}

module.exports = { createNotification }
