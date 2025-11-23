const { initializeJobs, stopJobs } = require('../index');
const scheduler = require('../../core/scheduler');
const CleanupFileJob = require('../cleanup-file');

jest.mock('../../core/scheduler');
jest.mock('../cleanup-file');

describe('Jobs', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('initializeJobs', () => {
		it('should schedule and start cleanup job', async () => {
			await initializeJobs();

			expect(scheduler.scheduleJob).toHaveBeenCalledWith('file-cleanup', expect.any(String), expect.any(Function));
			expect(scheduler.startJob).toHaveBeenCalledWith('file-cleanup');
		});
	});

	describe('stopJobs', () => {
		it('should stop all scheduled jobs', async () => {
			await stopJobs();

			expect(scheduler.stopAll).toHaveBeenCalled();
		});
	});
});
