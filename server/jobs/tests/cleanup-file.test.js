const CleanUpFileJob = require('../cleanup-file');
const config = require('../../../config/default');

jest.mock('../../../config/default', () => ({
	FILE_CLEANUP_INACTIVITY_MINUTES: 2,
}));

describe('CleanUpFileJob', () => {
	let mockStorage;
	let cleanupJob;

	beforeEach(() => {
		mockStorage = {
			cleanupInactiveFiles: jest.fn(),
		};
		cleanupJob = new CleanUpFileJob(mockStorage);
	});

	it('should cleanup inactive files with default timeout', async () => {
		await cleanupJob.execute();

		const expectedTimeout = config.FILE_CLEANUP_INACTIVITY_MINUTES * 60 * 1000;
		expect(mockStorage.cleanupInactiveFiles).toHaveBeenCalledWith(expectedTimeout);
	});

	it('should use environment variable when set', async () => {
		process.env.FILE_CLEANUP_INACTIVITY_MINUTES = '30';

		await cleanupJob.execute();

		const expectedTimeout = process.env.FILE_CLEANUP_INACTIVITY_MINUTES * 60 * 1000;
		expect(mockStorage.cleanupInactiveFiles).toHaveBeenCalledWith(expectedTimeout);

		delete process.env.FILE_CLEANUP_INACTIVITY_MINUTES;
	});

	it('should call cleanup on storage', async () => {
		await cleanupJob.execute();

		expect(mockStorage.cleanupInactiveFiles).toHaveBeenCalled();
	});

	it('should store storage provider correctly', () => {
		expect(cleanupJob.storage).toBe(mockStorage);
	});
});
