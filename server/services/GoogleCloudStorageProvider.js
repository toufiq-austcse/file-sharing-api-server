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
	 * @param inactivityPeriodMs
	 * @returns {Promise<void>}
	 */
	async cleanupInactiveFiles(inactivityPeriodMs) {
		try {
			console.log('Starting cleanup of inactive files...');
			const [files] = await this.bucket.getFiles();
			const now = Date.now();
			let deletedCount = 0;

			for (const file of files) {
				if (file.name.endsWith('.meta.json')) continue;

				try {
					const [metadata] = await file.getMetadata();
					const lastAccessed = metadata.metadata?.lastAccessed
						? new Date(metadata.metadata.lastAccessed).getTime()
						: new Date(metadata.timeCreated).getTime();

					const inactiveDuration = now - lastAccessed;

					if (inactiveDuration > inactivityPeriodMs) {
						const metaFile = this.bucket.file(`${file.name}.meta.json`);

						await file.delete();
						await metaFile.delete();

						deletedCount++;
						console.log(
							`Deleted inactive file and metadata: ${file.name} (inactive for ${Math.floor(inactiveDuration / (60 * 1000))} minutes)`
						);
					}
				} catch (error) {
					console.error(`Error processing file ${file.name}:`, error);
				}
			}

			console.log(`Cleanup completed. Deleted ${deletedCount} file(s) and their metadata`);
		} catch (error) {
			console.error('File cleanup error:', error);
		}
	}
}

module.exports = GoogleCloudStorageProvider;
