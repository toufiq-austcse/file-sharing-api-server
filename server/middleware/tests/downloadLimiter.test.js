const { downloadLimiter } = require('../downloadLimiter');
const config = require('../../../config/default');
const statusCodes = require('http-status-codes');
const {
	getStartOfUTCDayString,
	createUsageTracker,
	getClientIP,
	byteLen,
	shouldCountBytes,
} = require('../../core/utils/limiterUtils');

// Mock dependencies
jest.mock('../../../config/default', () => ({
	DAILY_DOWNLOAD_LIMIT_BYTES: 1000000, // 1MB default
}));

jest.mock('../../core/utils/limiterUtils', () => ({
	getStartOfUTCDayString: jest.fn(() => '2024-01-01'),
	createUsageTracker: jest.fn(),
	getClientIP: jest.fn(),
	byteLen: jest.fn(),
	shouldCountBytes: jest.fn(),
}));

describe('downloadLimiter', () => {
	let req, res, next;
	let mockUsageTracker, mockGetUsageForIPAndDay;

	beforeEach(() => {
		req = {
			ip: '127.0.0.1',
			headers: {},
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			write: jest.fn(),
			end: jest.fn(),
			on: jest.fn(),
			statusCode: 200,
		};

		next = jest.fn();

		// Mock usage tracker
		mockGetUsageForIPAndDay = jest.fn();
		mockUsageTracker = {
			getUsageForIPAndDay: mockGetUsageForIPAndDay,
		};

		createUsageTracker.mockReturnValue(mockUsageTracker);
		getClientIP.mockReturnValue('127.0.0.1');
		byteLen.mockImplementation((chunk) => (chunk ? chunk.length || 0 : 0));
		shouldCountBytes.mockReturnValue(true);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('middleware creation', () => {
		it('should create middleware with default options', () => {
			const middleware = downloadLimiter();
			expect(typeof middleware).toBe('function');
		});

		it('should create middleware with custom download limit', () => {
			const middleware = downloadLimiter({ downloadLimitInBytes: 500000 });
			expect(typeof middleware).toBe('function');
		});

		it('should use environment variable for download limit', () => {
			process.env.DAILY_DOWNLOAD_LIMIT_BYTES = '2000000';
			const middleware = downloadLimiter();
			expect(typeof middleware).toBe('function');
			delete process.env.DAILY_DOWNLOAD_LIMIT_BYTES;
		});
	});

	describe('download limit checking', () => {
		it('should allow download when under limit', () => {
			const usageData = { downloaded_bytes: 500000 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);

			const middleware = downloadLimiter({ downloadLimitInBytes: 1000000 });
			middleware(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it('should block download when limit exceeded', () => {
			const usageData = { downloaded_bytes: 1500000 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);

			const middleware = downloadLimiter({ downloadLimitInBytes: 1000000 });
			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(statusCodes.TOO_MANY_REQUESTS);
			expect(res.json).toHaveBeenCalledWith({ error: 'Daily download limit exceeded' });
			expect(next).not.toHaveBeenCalled();
		});

		it('should block download when at exact limit', () => {
			const usageData = { downloaded_bytes: 1000000 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);

			const middleware = downloadLimiter({ downloadLimitInBytes: 1000000 });
			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(statusCodes.TOO_MANY_REQUESTS);
			expect(res.json).toHaveBeenCalledWith({ error: 'Daily download limit exceeded' });
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('usage tracking setup', () => {
		it('should call utility functions with correct parameters', () => {
			const usageData = { downloaded_bytes: 0 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);

			const middleware = downloadLimiter();
			middleware(req, res, next);

			expect(getStartOfUTCDayString).toHaveBeenCalled();
			expect(getClientIP).toHaveBeenCalledWith(req);
			expect(createUsageTracker).toHaveBeenCalled();
			expect(mockGetUsageForIPAndDay).toHaveBeenCalledWith('127.0.0.1', '2024-01-01', 'downloaded_bytes');
		});
	});

	describe('response method overriding', () => {
		let usageData, middleware;

		beforeEach(() => {
			usageData = { downloaded_bytes: 0 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);
			middleware = downloadLimiter({ downloadLimitInBytes: 1000000 });
		});

		it('should override res.write method', () => {
			const originalWrite = res.write;
			middleware(req, res, next);

			expect(res.write).not.toBe(originalWrite);
		});

		it('should override res.end method', () => {
			const originalEnd = res.end;
			middleware(req, res, next);

			expect(res.end).not.toBe(originalEnd);
		});

		it('should track bytes in res.write calls', () => {
			middleware(req, res, next);

			const testChunk = 'test data';
			byteLen.mockReturnValue(9);

			res.write(testChunk);

			expect(byteLen).toHaveBeenCalledWith(testChunk);
			expect(shouldCountBytes).toHaveBeenCalledWith(res);
		});

		it('should track bytes in res.end calls', () => {
			middleware(req, res, next);

			const testChunk = 'final data';
			byteLen.mockReturnValue(10);

			res.end(testChunk);

			expect(byteLen).toHaveBeenCalledWith(testChunk);
			expect(shouldCountBytes).toHaveBeenCalledWith(res);
		});

		it('should not count bytes when shouldCountBytes returns false', () => {
			shouldCountBytes.mockReturnValue(false);
			middleware(req, res, next);

			const testChunk = 'test data';
			res.write(testChunk);

			expect(byteLen).not.toHaveBeenCalled();
		});
	});

	describe('finish event handling', () => {
		let usageData, middleware;

		beforeEach(() => {
			usageData = { downloaded_bytes: 100 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);
			middleware = downloadLimiter();
		});

		it('should register finish event listener', () => {
			middleware(req, res, next);

			expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
		});

		it('should update usage when response finishes', () => {
			middleware(req, res, next);

			// Simulate writing data
			byteLen.mockReturnValue(50);
			res.write('test1');
			res.write('test2');

			// Get the finish callback and call it
			const finishCallback = res.on.mock.calls.find((call) => call[0] === 'finish')[1];
			finishCallback();

			expect(usageData.downloaded_bytes).toBe(200); // 100 + 50 + 50
		});

		it('should not update usage when shouldCountBytes returns false', () => {
			shouldCountBytes.mockReturnValue(false);
			middleware(req, res, next);

			res.write('test');
			const finishCallback = res.on.mock.calls.find((call) => call[0] === 'finish')[1];
			finishCallback();

			expect(usageData.downloaded_bytes).toBe(100); // unchanged
		});
	});

	describe('method preservation', () => {
		let usageData, middleware, originalWrite, originalEnd;

		beforeEach(() => {
			usageData = { downloaded_bytes: 0 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);
			middleware = downloadLimiter();
			originalWrite = res.write;
			originalEnd = res.end;
		});

		it('should call original write method', () => {
			middleware(req, res, next);

			const testChunk = 'test';
			const encoding = 'utf8';
			const callback = jest.fn();

			res.write(testChunk, encoding, callback);

			expect(originalWrite).toHaveBeenCalledWith(testChunk, encoding, callback);
		});

		it('should call original end method', () => {
			middleware(req, res, next);

			const testChunk = 'final';
			const encoding = 'utf8';
			const callback = jest.fn();

			res.end(testChunk, encoding, callback);

			expect(originalEnd).toHaveBeenCalledWith(testChunk, encoding, callback);
		});
	});

	describe('edge cases', () => {
		it('should handle null chunks in write', () => {
			const usageData = { downloaded_bytes: 0 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);

			const middleware = downloadLimiter();
			middleware(req, res, next);

			expect(() => res.write(null)).not.toThrow();
		});

		it('should handle undefined chunks in end', () => {
			const usageData = { downloaded_bytes: 0 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);

			const middleware = downloadLimiter();
			middleware(req, res, next);

			expect(() => res.end(undefined)).not.toThrow();
		});

		it('should handle zero download limit', () => {
			const usageData = { downloaded_bytes: 0 };
			mockGetUsageForIPAndDay.mockReturnValue(usageData);

			const middleware = downloadLimiter({ downloadLimitInBytes: 0 });
			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(statusCodes.TOO_MANY_REQUESTS);
		});
	});
});
