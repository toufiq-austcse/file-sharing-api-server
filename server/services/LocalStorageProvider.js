const StorageProvider = require('./StorageProvider');
const path = require('path');
const fs = require('fs').promises;
const { createReadStream } = require('fs');
const config = require('../../config/default');

class LocalStorageProvider extends StorageProvider {
	constructor(rootFolder) {
		super();
		this.rootFolder = rootFolder || config.DEFAULT_ROOT_FOLDER;
	}

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

	async exists(publicKey) {
		const filePath = path.join(this.rootFolder, publicKey);
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}
}

module.exports = LocalStorageProvider;
