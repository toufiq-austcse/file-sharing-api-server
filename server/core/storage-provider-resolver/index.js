const LocalStorageProvider = require('../../services/LocalStorageProvider');
const GoogleCloudStorageProvider = require('../../services/GoogleCloudStorageProvider');
const { getProvider, getRootFolder } = require('../../../config/default');

/**
 * Resolves and returns the appropriate storage provider based on configuration.
 * @returns {LocalStorageProvider|GoogleCloudStorageProvider}
 */
const resolveStorageProvider = () => {
	const provider = getProvider();
	if (provider === 'local') {
		console.log(`Using storage provider: ${provider}`);
		return new LocalStorageProvider(getRootFolder());
	}
	if (provider === 'google') {
		console.log(`Using storage provider: ${provider}`);
		if (!process.env.CONFIG) {
			throw new Error('CONFIG path is not set in environment variables');
		}
		return new GoogleCloudStorageProvider(process.env.CONFIG);
	}
	throw new Error(`Unsupported storage provider: ${provider}`);
};

module.exports = {
	resolveStorageProvider,
};
