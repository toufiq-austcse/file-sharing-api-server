const fs = require('fs').promises;
const path = require('path');
const config = require('../../config/default');

const INACTIVITY_PERIOD_MS =
	Number(process.env.FILE_CLEANUP_INACTIVITY_MINUTES || config.FILE_CLEANUP_INACTIVITY_MINUTES) * 60 * 1000;

const cleanupInactiveFiles = async () => {
	try {
		console.log('Starting cleanup of inactive files...');
		const uploadsDir = config.getRootFolder();
		const files = await fs.readdir(uploadsDir);
		const now = Date.now();
		let deletedCount = 0;

		for (const file of files) {
			if (file.endsWith('.meta.json')) continue;

			const filePath = path.join(uploadsDir, file);
			const metaPath = path.join(uploadsDir, `${file}.meta.json`);

			try {
				const stats = await fs.stat(filePath);
				const inactiveDuration = now - stats.atimeMs;

				if (inactiveDuration > INACTIVITY_PERIOD_MS) {
					await fs.unlink(filePath);
					await fs.unlink(metaPath);

					deletedCount++;
					console.log(
						`Deleted inactive file and metadata: ${file} (inactive for ${Math.floor(inactiveDuration / (60 * 1000))} minutes)`
					);
				}
			} catch (error) {
				console.error(`Error processing file ${file}:`, error);
			}
		}

		console.log(`Cleanup completed. Deleted ${deletedCount} file(s) and their metadata`);
	} catch (error) {
		console.error('File cleanup error:', error);
	}
};

module.exports = {
	cleanupInactiveFiles,
};
