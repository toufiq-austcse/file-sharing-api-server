const config = require('../../config/default');

describe('Config Default', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	describe('getRootFolder Function', () => {
		it('should return default folder when FOLDER env var is not set', () => {
			delete process.env.FOLDER;
			expect(config.getRootFolder()).toBe('./uploads');
		});

		it('should return custom folder when FOLDER env var is set', () => {
			process.env.FOLDER = '/custom/uploads';
			expect(config.getRootFolder()).toBe('/custom/uploads');
		});

		it('should handle empty FOLDER env var', () => {
			process.env.FOLDER = '';
			expect(config.getRootFolder()).toBe('./uploads');
		});

		it('should handle relative paths in FOLDER', () => {
			process.env.FOLDER = '../data/files';
			expect(config.getRootFolder()).toBe('../data/files');
		});

		it('should handle absolute paths in FOLDER', () => {
			process.env.FOLDER = '/var/www/uploads';
			expect(config.getRootFolder()).toBe('/var/www/uploads');
		});
	});

	describe('Configuration Structure', () => {
		it('should export all required properties', () => {
			const expectedKeys = [
				'SERVER_NAME',
				'DEFAULT_PORT',
				'CONNECTION_CLOSING_TIME',
				'WAIT_TIME_BEFORE_FORCE_SHUTDOWN',
				'DAILY_UPLOAD_LIMIT_BYTES',
				'DAILY_DOWNLOAD_LIMIT_BYTES',
				'FILE_CLEANUP_INACTIVITY_MINUTES',
				'FILE_CLEANUP_CRON',
				'getRootFolder',
			];

			expectedKeys.forEach((key) => {
				expect(config).toHaveProperty(key);
			});
		});

		it('should have getRootFolder as a function', () => {
			expect(typeof config.getRootFolder).toBe('function');
		});
	});

	describe('Data Types', () => {
		it('should have correct data types for all properties', () => {
			expect(typeof config.SERVER_NAME).toBe('string');
			expect(typeof config.DEFAULT_PORT).toBe('number');
			expect(typeof config.CONNECTION_CLOSING_TIME).toBe('number');
			expect(typeof config.WAIT_TIME_BEFORE_FORCE_SHUTDOWN).toBe('number');
			expect(typeof config.DAILY_UPLOAD_LIMIT_BYTES).toBe('number');
			expect(typeof config.DAILY_DOWNLOAD_LIMIT_BYTES).toBe('number');
			expect(typeof config.FILE_CLEANUP_INACTIVITY_MINUTES).toBe('number');
			expect(typeof config.FILE_CLEANUP_CRON).toBe('string');
			expect(typeof config.getRootFolder).toBe('function');
		});

		it('should have positive numeric values', () => {
			expect(config.DEFAULT_PORT).toBeGreaterThan(0);
			expect(config.CONNECTION_CLOSING_TIME).toBeGreaterThan(0);
			expect(config.WAIT_TIME_BEFORE_FORCE_SHUTDOWN).toBeGreaterThan(0);
			expect(config.DAILY_UPLOAD_LIMIT_BYTES).toBeGreaterThan(0);
			expect(config.DAILY_DOWNLOAD_LIMIT_BYTES).toBeGreaterThan(0);
			expect(config.FILE_CLEANUP_INACTIVITY_MINUTES).toBeGreaterThan(0);
		});
	});
});
