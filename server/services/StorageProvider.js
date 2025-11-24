/**
 * Abstract class representing a storage provider.
 * Concrete implementations should extend this class and implement its methods.
 */
class StorageProvider {
	/**
	 * @param file
	 * @param publicKey
	 * @param privateKey
	 * @returns {Promise<void>}
	 */
	async upload(file, publicKey, privateKey) {
		throw new Error('Method not implemented');
	}

	/**
	 * @param publicKey
	 * @returns {Promise<void>}
	 */
	async download(publicKey) {
		throw new Error('Method not implemented');
	}

	/**
	 * @param privateKey
	 * @returns {Promise<void>}
	 */
	async delete(privateKey) {
		throw new Error('Method not implemented');
	}

	/**
	 * @param publicKey
	 * @returns {Promise<void>}
	 */
	async exists(publicKey) {
		throw new Error('Method not implemented');
	}

	/**
	 * @param inactivityPeriodMs
	 * @returns {Promise<void>}
	 */
	async cleanupInactiveFiles(inactivityPeriodMs) {
		throw new Error('Method not implemented');
	}
}

module.exports = StorageProvider;
