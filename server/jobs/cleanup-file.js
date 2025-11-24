const { FILE_CLEANUP_INACTIVITY_MINUTES } = require('../../config/default');

/**
 * Job to clean up inactive files from storage.
 */
class CleanUpFileJob {
	/**
	 * @param {Object} storageProvider - The storage provider instance.
	 * @param storageProvider
	 */
	constructor(storageProvider) {
		this.storage = storageProvider;
	}

	/**
	 * Executes the cleanup job.
	 * @returns {Promise<void>}
	 */
	async execute() {
		const INACTIVITY_PERIOD_MS =
			Number(process.env.FILE_CLEANUP_INACTIVITY_MINUTES || FILE_CLEANUP_INACTIVITY_MINUTES) * 60 * 1000;

		return this.storage.cleanupInactiveFiles(INACTIVITY_PERIOD_MS);
	}
}

module.exports = CleanUpFileJob;
