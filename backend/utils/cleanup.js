const cron = require('node-cron');
const PendingUser = require('../models/PendingUser');

// Clean up expired pending users every day at 2 AM
const setupCleanupJobs = () => {
  // Run daily at 2:00 AM
  cron.schedule('5 2 * * *', async () => {
    try {
      console.log('🧹 Running cleanup job for expired pending users...');
      const deletedCount = await PendingUser.cleanupExpired();
      console.log(`✅ Cleaned up ${deletedCount} expired pending user(s)`);
    } catch (error) {
      console.error('❌ Error during pending user cleanup:', error);
    }
  });

  console.log('📅 Scheduled cleanup job for pending users (daily at 2:00 AM)');
};

module.exports = { setupCleanupJobs };

