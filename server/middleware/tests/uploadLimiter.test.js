const { uploadLimiter } = require('../uploadLimiter');
const statusCodes = require('http-status-codes');

jest.mock('../../../config/default', () => ({
	DAILY_UPLOAD_LIMIT_BYTES: 1000000,
}));

jest.mock('../../core/utils/limiterUtils', () => ({
	getStartOfUTCDayString: jest.fn(() => '2024-01-01'),
	createUsageTracker: jest.fn(),
	getClientIP: jest.fn(),
}));

const { createUsageTracker, getClientIP } = require('../../core/utils/limiterUtils');

describe('uploadLimiter', () => {
	let req, res, next, mockGetUsageForIPAndDay;

	beforeEach(() => {
		req = {
			headers: { 'content-length': '100000' },
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			setHeader: jest.fn(),
		};

		next = jest.fn();

		mockGetUsageForIPAndDay = jest.fn();
		createUsageTracker.mockReturnValue({ getUsageForIPAndDay: mockGetUsageForIPAndDay });
		getClientIP.mockReturnValue('127.0.0.1');
	});

	it('should allow upload when under limit', () => {
		mockGetUsageForIPAndDay.mockReturnValue({ uploaded_bytes: 500000 });

		const middleware = uploadLimiter({ uploadLimitInBytes: 1000000 });
		middleware(req, res, next);

		expect(next).toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
	});

	it('should block upload when over limit', () => {
		mockGetUsageForIPAndDay.mockReturnValue({ uploaded_bytes: 1500000 });

		const middleware = uploadLimiter({ uploadLimitInBytes: 1000000 });
		middleware(req, res, next);

		expect(res.status).toHaveBeenCalledWith(statusCodes.TOO_MANY_REQUESTS);
		expect(next).not.toHaveBeenCalled();
	});

	it('should block when incoming upload exceeds remaining limit', () => {
		mockGetUsageForIPAndDay.mockReturnValue({ uploaded_bytes: 950000 });

		const middleware = uploadLimiter({ uploadLimitInBytes: 1000000 });
		middleware(req, res, next);

		expect(res.status).toHaveBeenCalledWith(statusCodes.TOO_MANY_REQUESTS);
	});
});
