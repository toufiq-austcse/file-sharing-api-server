const FileService = require('../FileService');
const crypto = require('crypto');

describe('FileService', () => {
	let fileService;
	let mockStorageProvider;

	beforeEach(() => {
		mockStorageProvider = {
			upload: jest.fn(),
			download: jest.fn(),
			delete: jest.fn(),
		};
		fileService = new FileService(mockStorageProvider);
	});

	describe('constructor', () => {
		it('should create FileService instance with storage provider', () => {
			expect(fileService).toBeInstanceOf(FileService);
			expect(fileService.storage).toBe(mockStorageProvider);
		});
	});

	describe('generateKeys', () => {
		it('should generate public and private keys', () => {
			const keys = fileService.generateKeys();

			expect(keys).toHaveProperty('publicKey');
			expect(keys).toHaveProperty('privateKey');
			expect(typeof keys.publicKey).toBe('string');
			expect(typeof keys.privateKey).toBe('string');
		});

		it('should generate keys with correct lengths', () => {
			const keys = fileService.generateKeys();

			expect(keys.publicKey).toHaveLength(32);

			expect(keys.privateKey).toHaveLength(64);
		});

		it('should generate unique keys on each call', () => {
			const keys1 = fileService.generateKeys();
			const keys2 = fileService.generateKeys();

			expect(keys1.publicKey).not.toBe(keys2.publicKey);
			expect(keys1.privateKey).not.toBe(keys2.privateKey);
		});

		it('should generate valid hex strings', () => {
			const keys = fileService.generateKeys();
			const hexRegex = /^[0-9a-f]+$/i;

			expect(hexRegex.test(keys.publicKey)).toBe(true);
			expect(hexRegex.test(keys.privateKey)).toBe(true);
		});
	});

	describe('uploadFile', () => {
		const mockFile = {
			originalname: 'tests.txt',
			mimetype: 'text/plain',
			size: 100,
			path: '/tmp/tests.txt',
		};

		it('should upload file and return keys', async () => {
			mockStorageProvider.upload.mockResolvedValue({ publicKey: 'public-key', privateKey: 'private-key' });

			const result = await fileService.uploadFile(mockFile);

			expect(mockStorageProvider.upload).toHaveBeenCalledTimes(1);

			expect(result).toHaveProperty('publicKey');
			expect(result).toHaveProperty('privateKey');
			expect(typeof result.publicKey).toBe('string');
			expect(typeof result.privateKey).toBe('string');
		});

		it('should generate different keys for each upload', async () => {
			mockStorageProvider.upload.mockResolvedValue({});

			const result1 = await fileService.uploadFile(mockFile);
			const result2 = await fileService.uploadFile(mockFile);

			expect(result1.publicKey).not.toBe(result2.publicKey);
			expect(result1.privateKey).not.toBe(result2.privateKey);
		});

		it('should propagate storage errors', async () => {
			const storageError = new Error('Storage failed');
			mockStorageProvider.upload.mockRejectedValue(storageError);

			await expect(fileService.uploadFile(mockFile)).rejects.toThrow('Storage failed');
		});

		it('should handle different file types', async () => {
			const imageFile = {
				originalname: 'image.jpg',
				mimetype: 'image/jpeg',
				size: 2048,
				path: '/tmp/image.jpg',
			};

			mockStorageProvider.upload.mockResolvedValue({});

			const result = await fileService.uploadFile(imageFile);

			expect(mockStorageProvider.upload).toHaveBeenCalledWith(imageFile, expect.any(String), expect.any(String));
			expect(result).toHaveProperty('publicKey');
			expect(result).toHaveProperty('privateKey');
		});
	});

	describe('downloadFile', () => {
		const testPublicKey = 'tests-public-key-123';

		it('should download file with public key', async () => {
			const mockDownloadResult = {
				stream: 'mock-stream',
				mime_type: 'text/plain',
				original_name: 'tests.txt',
			};
			mockStorageProvider.download.mockResolvedValue(mockDownloadResult);

			const result = await fileService.downloadFile(testPublicKey);

			expect(mockStorageProvider.download).toHaveBeenCalledTimes(1);
			expect(mockStorageProvider.download).toHaveBeenCalledWith(testPublicKey);
			expect(result).toBe(mockDownloadResult);
		});

		it('should propagate storage download errors', async () => {
			const downloadError = new Error('File not found');
			mockStorageProvider.download.mockRejectedValue(downloadError);

			await expect(fileService.downloadFile(testPublicKey)).rejects.toThrow('File not found');
		});

		it('should handle empty public key', async () => {
			await fileService.downloadFile('');

			expect(mockStorageProvider.download).toHaveBeenCalledWith('');
		});

		it('should handle null public key', async () => {
			await fileService.downloadFile(null);

			expect(mockStorageProvider.download).toHaveBeenCalledWith(null);
		});
	});

	describe('deleteFile', () => {
		const testPrivateKey = 'tests-private-key-456';

		it('should delete file with private key', async () => {
			mockStorageProvider.delete.mockResolvedValue(true);

			const result = await fileService.deleteFile(testPrivateKey);

			expect(mockStorageProvider.delete).toHaveBeenCalledTimes(1);
			expect(mockStorageProvider.delete).toHaveBeenCalledWith(testPrivateKey);
			expect(result).toBe(true);
		});

		it('should return false when file not found', async () => {
			mockStorageProvider.delete.mockResolvedValue(false);

			const result = await fileService.deleteFile('non-existent-key');

			expect(result).toBe(false);
		});

		it('should propagate storage deletion errors', async () => {
			const deleteError = new Error('Deletion failed');
			mockStorageProvider.delete.mockRejectedValue(deleteError);

			await expect(fileService.deleteFile(testPrivateKey)).rejects.toThrow('Deletion failed');
		});

		it('should handle empty private key', async () => {
			mockStorageProvider.delete.mockResolvedValue(false);

			const result = await fileService.deleteFile('');

			expect(mockStorageProvider.delete).toHaveBeenCalledWith('');
			expect(result).toBe(false);
		});
	});

	describe('integration with crypto module', () => {
		it('should use crypto.randomBytes for key generation', () => {
			const cryptoSpy = jest.spyOn(crypto, 'randomBytes');

			fileService.generateKeys();

			expect(cryptoSpy).toHaveBeenCalledWith(16); // publicKey
			expect(cryptoSpy).toHaveBeenCalledWith(32); // privateKey

			cryptoSpy.mockRestore();
		});
	});
});
