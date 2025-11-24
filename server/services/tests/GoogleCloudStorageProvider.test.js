const GoogleCloudStorageProvider = require('../GoogleCloudStorageProvider');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

jest.mock('@google-cloud/storage');
jest.mock('fs');

describe('GoogleCloudStorageProvider', () => {
	let provider;
	let mockBucket;
	let mockStorage;
	let mockFile;

	beforeEach(() => {
		mockFile = {
			createReadStream: jest.fn(),
			download: jest.fn(),
			save: jest.fn(),
			delete: jest.fn(),
			exists: jest.fn(),
			getMetadata: jest.fn(),
			setMetadata: jest.fn(),
			name: 'test-file',
		};

		mockBucket = {
			upload: jest.fn(),
			file: jest.fn(() => mockFile),
			getFiles: jest.fn(),
		};

		mockStorage = {
			bucket: jest.fn(() => mockBucket),
		};

		Storage.mockImplementation(() => mockStorage);

		const configPath = '/test/config.json';
		const mockConfig = {
			bucket_name: 'test-bucket',
			gcp_key_file_path: '/test/key.json',
		};

		fs.readFileSync = jest.fn(() => JSON.stringify(mockConfig));
		fs.promises = { unlink: jest.fn() };

		provider = new GoogleCloudStorageProvider(configPath);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should create instance with bucket name', () => {
			expect(provider.bucketName).toBe('test-bucket');
			expect(Storage).toHaveBeenCalledWith({ keyFilename: '/test/key.json' });
		});
	});

	describe('upload', () => {
		it('should upload file successfully', async () => {
			const testFile = {
				path: '/tmp/test.txt',
				originalname: 'test.txt',
				mimetype: 'text/plain',
				size: 100,
			};

			const publicKey = 'test-public-key';
			const privateKey = 'test-private-key';

			mockBucket.upload.mockResolvedValue([]);
			mockFile.save.mockResolvedValue();
			fs.promises.unlink.mockResolvedValue();

			const result = await provider.upload(testFile, publicKey, privateKey);

			expect(result).toEqual({ publicKey, privateKey });
			expect(mockBucket.upload).toHaveBeenCalledWith('/tmp/test.txt', {
				destination: publicKey,
				metadata: { contentType: 'text/plain' },
			});
			expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/test.txt');
			expect(mockFile.save).toHaveBeenCalled();
		});
	});

	describe('download', () => {
		it('should download file successfully', async () => {
			const publicKey = 'test-public-key';
			const metaData = {
				mime_type: 'text/plain',
				original_name: 'test.txt',
				private_key: 'test-private-key',
			};

			const mockStream = { pipe: jest.fn() };
			mockFile.download.mockResolvedValue([JSON.stringify(metaData)]);
			mockFile.createReadStream.mockReturnValue(mockStream);
			mockFile.setMetadata.mockResolvedValue([{}]);

			const result = await provider.download(publicKey);

			expect(result.stream).toBe(mockStream);
			expect(result.mime_type).toBe('text/plain');
			expect(result.original_name).toBe('test.txt');
			expect(mockFile.setMetadata).toHaveBeenCalled();
		});
	});

	describe('delete', () => {
		it('should delete file with correct private key', async () => {
			const privateKey = 'private-key';
			const metaFile = {
				name: 'pub123.meta.json',
				download: jest.fn().mockResolvedValue([
					JSON.stringify({
						private_key: privateKey,
						public_key: 'pub123',
					}),
				]),
				delete: jest.fn().mockResolvedValue(),
			};

			mockBucket.getFiles.mockResolvedValue([[metaFile]]);
			mockFile.delete.mockResolvedValue();

			const result = await provider.delete(privateKey);

			expect(result).toBe(true);
			expect(mockFile.delete).toHaveBeenCalled();
			expect(metaFile.delete).toHaveBeenCalled();
		});

		it('should return false for incorrect private key', async () => {
			const metaFile = {
				name: 'pub123.meta.json',
				download: jest.fn().mockResolvedValue([
					JSON.stringify({
						private_key: 'test-key',
						public_key: 'public-key',
					}),
				]),
			};

			mockBucket.getFiles.mockResolvedValue([[metaFile]]);

			const result = await provider.delete('wrong-key');

			expect(result).toBe(false);
		});
	});

	describe('exists', () => {
		it('should return true for existing file', async () => {
			mockFile.exists.mockResolvedValue([true]);

			const result = await provider.exists('public-key');

			expect(result).toBe(true);
			expect(mockBucket.file).toHaveBeenCalledWith('public-key');
		});

		it('should return false for non-existent file', async () => {
			mockFile.exists.mockResolvedValue([false]);

			const result = await provider.exists('non-existent');

			expect(result).toBe(false);
		});
	});

	describe('cleanupInactiveFiles', () => {
		it('deletes old files that have not been accessed recently', async () => {
			const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
			provider.accessMap.set('old-file', tenMinutesAgo);

			mockFile.exists.mockResolvedValue([true]);

			await provider.cleanupInactiveFiles(5 * 60 * 1000);

			expect(mockFile.delete).toHaveBeenCalled();
			expect(provider.accessMap.has('old-file')).toBe(false);
		});

		it('should not delete files within threshold period', async () => {
			const recentTime = new Date();
			provider.accessMap.set('new-file', recentTime);

			await provider.cleanupInactiveFiles(10 * 60 * 1000);

			expect(mockFile.delete).not.toHaveBeenCalled();
			expect(provider.accessMap.has('new-file')).toBe(true);
		});

		it('should remove file from accessMap if it does not exist in bucket', async () => {
			const oldTime = new Date(Date.now() - 10 * 60 * 1000);
			provider.accessMap.set('missing-file', oldTime);

			mockFile.exists.mockResolvedValue([false]);

			await provider.cleanupInactiveFiles(5 * 60 * 1000);

			expect(provider.accessMap.has('missing-file')).toBe(false);
			expect(mockFile.delete).not.toHaveBeenCalled();
		});
	});
});
