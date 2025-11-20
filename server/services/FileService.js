const crypto = require('crypto');

class FileService {
	constructor(storageProvider) {
		this.storage = storageProvider;
	}

	generateKeys() {
		return {
			publicKey: crypto.randomBytes(16).toString('hex'),
			privateKey: crypto.randomBytes(32).toString('hex'),
		};
	}

	async uploadFile(file) {
		const { publicKey, privateKey } = this.generateKeys();
		await this.storage.upload(file, publicKey, privateKey);
		return { publicKey, privateKey };
	}

	async downloadFile(publicKey) {
		return this.storage.download(publicKey);
	}

	async deleteFile(privateKey) {
		return this.storage.delete(privateKey);
	}
}

module.exports = FileService;
