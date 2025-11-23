const CleanUpFileJob = require('../cleanup-file');

jest.mock('../../api/files/config', () => ({
	FILE_CLEANUP_INACTIVITY_MINUTES: 60,
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

		const expectedTimeout = 60 * 60 * 1000;
		expect(mockStorage.cleanupInactiveFiles).toHaveBeenCalledWith(expectedTimeout);
	});

	it('should use environment variable when set', async () => {
		process.env.FILE_CLEANUP_INACTIVITY_MINUTES = '30';

		await cleanupJob.execute();

		const expectedTimeout = 30 * 60 * 1000;
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
