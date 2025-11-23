const cron = require('node-cron');
const scheduler = require('../index');

jest.mock('node-cron');

describe('Scheduler', () => {
	let mockJob;

	beforeEach(() => {
		mockJob = {
			start: jest.fn(),
			stop: jest.fn(),
		};
		cron.schedule.mockReturnValue(mockJob);
		scheduler.jobs.clear();
	});

	describe('scheduleJob', () => {
		it('should schedule a job with cron expression', () => {
			const task = jest.fn();
			scheduler.scheduleJob('tests-job', '0 * * * *', task);

			expect(cron.schedule).toHaveBeenCalledWith('0 * * * *', task, {
				scheduled: false,
			});
		});

		it('should store job in jobs map', () => {
			const task = jest.fn();
			scheduler.scheduleJob('tests-job', '0 * * * *', task);

			expect(scheduler.jobs.has('tests-job')).toBe(true);
		});
	});

	describe('startJob', () => {
		it('should start a scheduled job', () => {
			scheduler.scheduleJob('tests-job', '0 * * * *', jest.fn());
			scheduler.startJob('tests-job');

			expect(mockJob.start).toHaveBeenCalled();
		});

		it('should do nothing if job does not exist', () => {
			scheduler.startJob('non-existent');

			expect(mockJob.start).not.toHaveBeenCalled();
		});
	});

	describe('stopJob', () => {
		it('should stop a running job', () => {
			scheduler.scheduleJob('tests-job', '0 * * * *', jest.fn());
			scheduler.stopJob('tests-job');

			expect(mockJob.stop).toHaveBeenCalled();
		});
	});

	describe('stopAll', () => {
		it('should stop all jobs', () => {
			scheduler.scheduleJob('job-1', '0 * * * *', jest.fn());
			scheduler.scheduleJob('job-2', '0 * * * *', jest.fn());
			scheduler.stopAll();

			expect(mockJob.stop).toHaveBeenCalledTimes(2);
		});
	});
});
