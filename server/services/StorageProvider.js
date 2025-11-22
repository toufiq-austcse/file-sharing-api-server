class StorageProvider {
	async upload(file, publicKey, privateKey) {
		throw new Error('Method not implemented');
	}

	async download(publicKey) {
		throw new Error('Method not implemented');
	}

	async delete(privateKey) {
		throw new Error('Method not implemented');
	}

	async exists(publicKey) {
		throw new Error('Method not implemented');
	}
	async cleanupInactiveFiles(inactivityPeriodMs) {
		throw new Error('Method not implemented');
	}
}

module.exports = StorageProvider;
