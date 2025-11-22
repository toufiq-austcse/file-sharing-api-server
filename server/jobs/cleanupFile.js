const { FILE_CLEANUP_INACTIVITY_MINUTES } = require('../api/files/config');

class CleanUpFileJob {
	constructor(storageProvider) {
		this.storage = storageProvider;
	}
	async execute() {
		const INACTIVITY_PERIOD_MS =
			Number(process.env.FILE_CLEANUP_INACTIVITY_MINUTES || FILE_CLEANUP_INACTIVITY_MINUTES) * 60 * 1000;

		return this.storage.cleanupInactiveFiles(INACTIVITY_PERIOD_MS);
	}
}

module.exports = CleanUpFileJob;
