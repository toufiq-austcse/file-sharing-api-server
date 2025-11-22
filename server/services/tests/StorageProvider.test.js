const StorageProvider = require('../StorageProvider');

describe('StorageProvider Interface', () => {
	let storageProvider;

	beforeEach(() => {
		storageProvider = new StorageProvider();
	});

	describe('Constructor', () => {
		it('should create StorageProvider instance', () => {
			expect(storageProvider).toBeInstanceOf(StorageProvider);
		});
	});

	describe('upload method', () => {
		it('should throw "Method not implemented" error', async () => {
			const mockFile = { name: 'test.txt', data: Buffer.from('test') };
			const publicKey = 'public-key-123';
			const privateKey = 'private-key-456';

			await expect(storageProvider.upload(mockFile, publicKey, privateKey)).rejects.toThrow('Method not implemented');
		});
	});

	describe('download method', () => {
		it('should throw "Method not implemented" error', async () => {
			const publicKey = 'public-key-123';

			await expect(storageProvider.download(publicKey)).rejects.toThrow('Method not implemented');
		});
	});

	describe('delete method', () => {
		it('should throw "Method not implemented" error', async () => {
			const privateKey = 'private-key-456';

			await expect(storageProvider.delete(privateKey)).rejects.toThrow('Method not implemented');
		});
	});

	describe('exists method', () => {
		it('should throw "Method not implemented" error', async () => {
			const publicKey = 'public-key-123';

			await expect(storageProvider.exists(publicKey)).rejects.toThrow('Method not implemented');
		});
	});

	describe('cleanupInactiveFiles method', () => {
		it('should throw "Method not implemented" error', async () => {
			const inactivityPeriodMs = 300000;

			await expect(storageProvider.cleanupInactiveFiles(inactivityPeriodMs)).rejects.toThrow('Method not implemented');
		});
	});

	describe('Method signatures', () => {
		it('should have all required methods defined', () => {
			expect(typeof storageProvider.upload).toBe('function');
			expect(typeof storageProvider.download).toBe('function');
			expect(typeof storageProvider.delete).toBe('function');
			expect(typeof storageProvider.exists).toBe('function');
			expect(typeof storageProvider.cleanupInactiveFiles).toBe('function');
		});

		it('should have async methods', () => {
			const methods = ['upload', 'download', 'delete', 'exists', 'cleanupInactiveFiles'];

			methods.forEach((method) => {
				const result = storageProvider[method]();
				expect(result).toBeInstanceOf(Promise);
				result.catch(() => {});
			});
		});
	});
});
