const StorageProvider = require('./StorageProvider');
const path = require('path');
const fs = require('fs').promises;
const { createReadStream } = require('fs');

/**
 * LocalStorageProvider implements file storage using the local filesystem.
 */
class LocalStorageProvider extends StorageProvider {
	/**
	 * Creates an instance of LocalStorageProvider.
	 * @param rootFolder
	 */
	constructor(rootFolder) {
		super();
		this.rootFolder = rootFolder;
	}

	/**
	 * Uploads a file to local storage.
	 * @param file
	 * @param publicKey
	 * @param privateKey
	 * @returns {Promise<{publicKey: string, privateKey: string}>}
	 */
	async upload(file, publicKey, privateKey) {
		const filePath = path.join(this.rootFolder, publicKey);
		const metaPath = path.join(this.rootFolder, `${publicKey}.meta.json`);

		await fs.mkdir(this.rootFolder, { recursive: true });

		await fs.copyFile(file.path, filePath);
		await fs.unlink(file.path);

		await fs.writeFile(
			metaPath,
			JSON.stringify({
				private_key: privateKey,
				public_key: publicKey,
				original_name: file.originalname,
				mime_type: file.mimetype,
				size: file.size,
				uploaded_at: new Date().toISOString(),
			})
		);

		return { publicKey, privateKey };
	}

	/**
	 * Downloads a file from local storage.
	 * @param publicKey
	 * @returns {Promise<{stream: ReadStream, mime_type: string, original_name: string}>}
	 */
	async download(publicKey) {
		const currentTime = new Date();
		const filePath = path.join(this.rootFolder, publicKey);
		const metaPath = path.join(this.rootFolder, `${publicKey}.meta.json`);

		const metaData = JSON.parse(await fs.readFile(metaPath, 'utf8'));

		await fs.utimes(metaPath, currentTime, currentTime);
		await fs.utimes(metaPath, currentTime, currentTime);

		return {
			stream: createReadStream(filePath),
			mime_type: metaData.mime_type,
			original_name: metaData.original_name,
		};
	}

	/**
	 * Deletes a file from local storage using the private key.
	 * @param privateKey
	 * @returns {Promise<boolean>}
	 */
	async delete(privateKey) {
		const files = await fs.readdir(this.rootFolder);

		for (const file of files) {
			if (file.endsWith('.meta.json')) {
				const metaPath = path.join(this.rootFolder, file);
				const metaData = JSON.parse(await fs.readFile(metaPath, 'utf8'));

				if (metaData.private_key === privateKey) {
					await fs.unlink(path.join(this.rootFolder, metaData.public_key));
					await fs.unlink(metaPath);
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Checks if a file exists in local storage.
	 * @param publicKey
	 * @returns {Promise<boolean>}
	 */
	async exists(publicKey) {
		const filePath = path.join(this.rootFolder, publicKey);
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Cleans up inactive files that have not been accessed within the specified inactivity period.
	 * @param inactivityPeriodMs
	 * @returns {Promise<void>}
	 */
	async cleanupInactiveFiles(inactivityPeriodMs) {
		try {
			console.log('Starting cleanup of inactive files...');
			const uploadsDir = this.rootFolder;
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
					console.log('inactiveDuration ', inactiveDuration, inactivityPeriodMs);

					if (inactiveDuration > inactivityPeriodMs) {
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
	}
}

module.exports = LocalStorageProvider;
