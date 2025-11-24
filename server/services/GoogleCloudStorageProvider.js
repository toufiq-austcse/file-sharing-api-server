const StorageProvider = require('./StorageProvider');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

/**
 * GoogleCloudStorageProvider implements file storage using Google Cloud Storage.
 */
class GoogleCloudStorageProvider extends StorageProvider {
	/**
	 * Creates an instance of GoogleCloudStorageProvider
	 * @param gcpConfigFilePath
	 */
	constructor(gcpConfigFilePath) {
		super();

		const configPath = path.resolve(gcpConfigFilePath);
		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

		this.bucketName = config.bucket_name;
		const keyFilePath = config.gcp_key_file_path;

		this.storage = new Storage({ keyFilename: keyFilePath });
		this.bucket = this.storage.bucket(this.bucketName);
		this.accessMap = new Map();
	}

	/**
	 * Uploads a file to Google Cloud Storage.
	 * @param file
	 * @param publicKey
	 * @param privateKey
	 * @returns {Promise<{publicKey: string, privateKey: string}>}
	 */
	async upload(file, publicKey, privateKey) {
		const filePath = publicKey;
		const metaPath = `${publicKey}.meta.json`;

		await this.bucket.upload(file.path, {
			destination: filePath,
			metadata: {
				contentType: file.mimetype,
			},
		});

		await fs.promises.unlink(file.path);

		const metaData = {
			private_key: privateKey,
			public_key: publicKey,
			original_name: file.originalname,
			mime_type: file.mimetype,
			size: file.size,
			uploaded_at: new Date().toISOString(),
		};

		const metaFile = this.bucket.file(metaPath);
		await metaFile.save(JSON.stringify(metaData), {
			contentType: 'application/json',
		});

		this.accessMap.set(publicKey, new Date());

		return { publicKey, privateKey };
	}

	/**
	 * Downloads a file from Google Cloud Storage.
	 * @param publicKey
	 * @returns {Promise<{stream: ReadStream, mime_type: string, original_name: string}>}
	 */
	async download(publicKey) {
		const currentTime = new Date();
		const filePath = publicKey;
		const metaPath = `${publicKey}.meta.json`;

		const metaFile = this.bucket.file(metaPath);
		const [metaContent] = await metaFile.download();
		const metaData = JSON.parse(metaContent.toString());

		let res = await metaFile.setMetadata({
			metadata: {
				lastAccessed: currentTime.toISOString(),
			},
		});

		const file = this.bucket.file(filePath);
		const stream = file.createReadStream();
		this.accessMap.set(publicKey, new Date());

		return {
			stream,
			mime_type: metaData.mime_type,
			original_name: metaData.original_name,
		};
	}

	/**
	 * Deletes a file from Google Cloud Storage using the private key.
	 * @param privateKey
	 * @returns {Promise<boolean>}
	 */
	async delete(privateKey) {
		const [files] = await this.bucket.getFiles();

		for (const file of files) {
			if (file.name.endsWith('.meta.json')) {
				const [metaContent] = await file.download();
				const metaData = JSON.parse(metaContent.toString());

				if (metaData.private_key === privateKey) {
					await this.bucket.file(metaData.public_key).delete();
					await file.delete();
					this.accessMap.delete(privateKey);
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Checks if a file exists in Google Cloud Storage.
	 * @param publicKey
	 * @returns {Promise<boolean>}
	 */
	async exists(publicKey) {
		const file = this.bucket.file(publicKey);
		const [exists] = await file.exists();
		return exists;
	}

	/**
	 * Cleans up files that have been inactive for a specified period.
	 * Uses in-memory access tracking to determine file activity.
	 * @param inactivityPeriodMs - Milliseconds of inactivity before deletion
	 * @returns {Promise<void>}
	 */
	async cleanupInactiveFiles(inactivityPeriodMs) {
		try {
			console.log('Starting cleanup of inactive files...');
			const now = Date.now();
			let deletedCount = 0;

			for (const [publicKey, lastAccessTime] of this.accessMap.entries()) {
				const inactiveDuration = now - lastAccessTime.getTime();

				if (inactiveDuration > inactivityPeriodMs) {
					try {
						const file = this.bucket.file(publicKey);
						const metaFile = this.bucket.file(`${publicKey}.meta.json`);

						const [fileExists] = await file.exists();
						if (fileExists) {
							await file.delete();
							await metaFile.delete();

							this.accessMap.delete(publicKey);
							deletedCount++;

							console.log(
								`Deleted inactive file: ${publicKey} (inactive for ${Math.floor(inactiveDuration / (60 * 1000))} minutes)`
							);
						} else {
							this.accessMap.delete(publicKey);
						}
					} catch (error) {
						console.error(`Error deleting file ${publicKey}:`, error);
					}
				}
			}

			console.log(`Cleanup completed. Deleted ${deletedCount} file(s) and their metadata`);
		} catch (error) {
			console.error('File cleanup error:', error);
		}
	}
}

module.exports = GoogleCloudStorageProvider;
