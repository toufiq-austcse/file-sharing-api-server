const scheduler = require('../core/scheduler');
const config = require('../../config/default');
const CleanupFileJob = require('./cleanup-file');
const { resolveStorageProvider } = require('../core/storage-provider-resolver');

const initializeJobs = async () => {
	const cleanupCron = config.FILE_CLEANUP_CRON || process.env.FILE_CLEANUP_CRON;

	const storageProvider = resolveStorageProvider();
	const cleanupFileJob = new CleanupFileJob(storageProvider);

	scheduler.scheduleJob('file-cleanup', cleanupCron, () => cleanupFileJob.execute());
	scheduler.startJob('file-cleanup');

	console.log('Background jobs initialized');
};

const stopJobs = async () => {
	scheduler.stopAll();
	console.log('All background jobs stopped');
};
module.exports = { initializeJobs, stopJobs };
