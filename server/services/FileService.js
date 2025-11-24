const crypto = require('crypto');

/**
 * FileService handles file operations using the provided storage provider.
 */
class FileService {
	/**
	 * @param storageProvider
	 */
	constructor(storageProvider) {
		this.storage = storageProvider;
	}

	/**
	 * Generates a pair of public and private keys.
	 * @returns {{publicKey: string, privateKey: string}}
	 */
	generateKeys() {
		return {
			publicKey: crypto.randomBytes(16).toString('hex'),
			privateKey: crypto.randomBytes(32).toString('hex'),
		};
	}

	/**
	 * Uploads a file and returns its public and private keys.
	 * @param file
	 * @returns {Promise<{publicKey: string, privateKey: string}>}
	 */
	async uploadFile(file) {
		const { publicKey, privateKey } = this.generateKeys();
		await this.storage.upload(file, publicKey, privateKey);
		return { publicKey, privateKey };
	}

	/**
	 * Downloads a file using its public key.
	 * @param publicKey
	 * @returns {Promise<{stream: ReadStream, mime_type: string, original_name: string}>}
	 */
	async downloadFile(publicKey) {
		return this.storage.download(publicKey);
	}

	/**
	 * Deletes a file using its private key.
	 * @param privateKey
	 * @returns {Promise<boolean>}
	 */
	async deleteFile(privateKey) {
		return this.storage.delete(privateKey);
	}

	/**
	 * Checks if a file exists using its public key.
	 * @param publicKey
	 * @returns {Promise<boolean>}
	 */
	async fileExists(publicKey) {
		return this.storage.exists(publicKey);
	}
}

module.exports = FileService;
