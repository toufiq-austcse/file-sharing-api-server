const { resolveStorageProvider } = require('../index');
const LocalStorageProvider = require('../../../services/LocalStorageProvider');
const GoogleCloudStorageProvider = require('../../../services/GoogleCloudStorageProvider');
const config = require('../../../../config/default');

jest.mock('../../../services/LocalStorageProvider');
jest.mock('../../../services/GoogleCloudStorageProvider');
jest.mock('../../../../config/default');

describe('resolveStorageProvider', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		delete process.env.CONFIG;
	});

	it('should return LocalStorageProvider when provider is local', () => {
		config.getProvider.mockReturnValue('local');
		config.getRootFolder.mockReturnValue('/tmp/uploads');

		const provider = resolveStorageProvider();

		expect(LocalStorageProvider).toHaveBeenCalledWith('/tmp/uploads');
		expect(provider).toBeInstanceOf(LocalStorageProvider);
	});

	it('should return GoogleCloudStorageProvider when provider is google', () => {
		config.getProvider.mockReturnValue('google');
		process.env.CONFIG = '/path/to/config.json';

		const provider = resolveStorageProvider();

		expect(GoogleCloudStorageProvider).toHaveBeenCalledWith('/path/to/config.json');
		expect(provider).toBeInstanceOf(GoogleCloudStorageProvider);
	});

	it('should throw error when CONFIG is not set for google provider', () => {
		config.getProvider.mockReturnValue('google');

		expect(() => resolveStorageProvider()).toThrow('CONFIG path is not set in environment variables');
	});

	it('should throw error for unsupported provider', () => {
		config.getProvider.mockReturnValue('aws');

		expect(() => resolveStorageProvider()).toThrow('Unsupported storage provider: aws');
	});
});
