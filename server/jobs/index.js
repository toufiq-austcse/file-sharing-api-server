const scheduler = require('../core/scheduler');

const config = require('../../config/default');
const { cleanupInactiveFiles } = require('./cleanupFile');

function initializeJobs() {
	const cleanupCron = config.FILE_CLEANUP_CRON || process.env.FILE_CLEANUP_CRON;

	scheduler.scheduleJob('file-cleanup', cleanupCron, cleanupInactiveFiles);
	scheduler.startJob('file-cleanup');

	console.log('Background jobs initialized');
}

module.exports = { initializeJobs };
