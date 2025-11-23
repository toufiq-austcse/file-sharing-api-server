const {
	getStartOfUTCDayString,
	createUsageTracker,
	getClientIP,
	byteLen,
	shouldCountBytes,
} = require('../limiter-utils');

jest.mock('../../../../config/default', () => ({
	DAILY_DOWNLOAD_LIMIT_BYTES: 1000000,
}));

describe('Limiter Utils', () => {
	describe('getStartOfUTCDayString', () => {
		it('should return date string in YYYY-MM-DD format', () => {
			const date = new Date('2024-03-15T10:30:00Z');
			expect(getStartOfUTCDayString(date)).toBe('2024-03-15');
		});

		it('should use current date when no date provided', () => {
			const result = getStartOfUTCDayString();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});

	describe('byteLen', () => {
		it('should return 0 for null or undefined', () => {
			expect(byteLen(null)).toBe(0);
			expect(byteLen(undefined)).toBe(0);
		});

		it('should return buffer length for Buffer', () => {
			const buffer = Buffer.from('hello');
			expect(byteLen(buffer)).toBe(5);
		});

		it('should return byte length for string', () => {
			expect(byteLen('test')).toBe(4);
		});
	});

	describe('shouldCountBytes', () => {
		it('should return false when no Content-Type header', () => {
			const res = { getHeader: jest.fn(() => null) };
			expect(shouldCountBytes(res)).toBe(false);
		});

		it('should return false for JSON content', () => {
			const res = { getHeader: jest.fn(() => 'application/json') };
			expect(shouldCountBytes(res)).toBe(false);
		});

		it('should return true for non-JSON content', () => {
			const res = { getHeader: jest.fn(() => 'application/pdf') };
			expect(shouldCountBytes(res)).toBe(true);
		});
	});

	describe('createUsageTracker', () => {
		it('should create new usage record for IP and day', () => {
			const tracker = createUsageTracker();
			const usage = tracker.getUsageForIPAndDay('192.168.1.1', '2024-03-15', 'downloads');

			expect(usage.day).toBe('2024-03-15');
			expect(usage.downloads).toBe(0);
		});

		it('should return same record for same IP and day', () => {
			const tracker = createUsageTracker();
			const usage1 = tracker.getUsageForIPAndDay('192.168.1.1', '2024-03-15', 'downloads');
			const usage2 = tracker.getUsageForIPAndDay('192.168.1.1', '2024-03-15', 'downloads');

			expect(usage1).toBe(usage2);
		});
	});

	describe('getClientIP', () => {
		it('should get IP from x-forwarded-for header', () => {
			const req = { headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' } };
			expect(getClientIP(req)).toBe('192.168.1.1');
		});

		it('should get IP from x-real-ip header', () => {
			const req = { headers: { 'x-real-ip': '192.168.1.2' } };
			expect(getClientIP(req)).toBe('192.168.1.2');
		});

		it('should return unknown when no IP found', () => {
			const req = { headers: {} };
			expect(getClientIP(req)).toBe('unknown');
		});
	});
});
