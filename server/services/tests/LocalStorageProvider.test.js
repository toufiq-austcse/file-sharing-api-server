const LocalStorageProvider = require('../LocalStorageProvider');
const fs = require('fs').promises;
const { createReadStream, existsSync } = require('fs');
const path = require('path');

describe('LocalStorageProvider', () => {
	let provider;
	const testRootFolder = path.join(__dirname, 'tests-storage');

	beforeAll(async () => {
		provider = new LocalStorageProvider(testRootFolder);
	});

	beforeEach(async () => {
		// Clean up tests directory
		if (existsSync(testRootFolder)) {
			await fs.rm(testRootFolder, { recursive: true, force: true });
		}
	});

	afterAll(async () => {
		// Final cleanup
		if (existsSync(testRootFolder)) {
			await fs.rm(testRootFolder, { recursive: true, force: true });
		}
	});

	describe('constructor', () => {
		it('should create instance with root folder', () => {
			expect(provider.rootFolder).toBe(testRootFolder);
		});
	});

	describe('upload', () => {
		it('should upload file successfully', async () => {
			const testFile = {
				path: path.join(__dirname, 'temp-tests-file.txt'),
				originalname: 'tests.txt',
				mimetype: 'text/plain',
				size: 12,
			};

			await fs.writeFile(testFile.path, 'tests content');

			const publicKey = 'pub123';
			const privateKey = 'priv456';

			const result = await provider.upload(testFile, publicKey, privateKey);

			expect(result).toEqual({ publicKey, privateKey });

			const filePath = path.join(testRootFolder, publicKey);
			const content = await fs.readFile(filePath, 'utf8');
			expect(content).toBe('tests content');

			const metaPath = path.join(testRootFolder, `${publicKey}.meta.json`);
			const metaContent = await fs.readFile(metaPath, 'utf8');
			const metadata = JSON.parse(metaContent);

			expect(metadata.private_key).toBe(privateKey);
			expect(metadata.public_key).toBe(publicKey);
			expect(metadata.original_name).toBe('tests.txt');
			expect(metadata.mime_type).toBe('text/plain');
			expect(metadata.size).toBe(12);
			expect(metadata.uploaded_at).toBeDefined();
		});

		it('should create root folder if it does not exist', async () => {
			const testFile = {
				path: path.join(__dirname, 'temp-tests-file2.txt'),
				originalname: 'test2.txt',
				mimetype: 'text/plain',
				size: 5,
			};

			await fs.writeFile(testFile.path, 'hello');

			await provider.upload(testFile, 'pub789', 'priv012');

			expect(existsSync(testRootFolder)).toBe(true);
		});
	});

	describe('download', () => {
		let publicKey, privateKey;

		beforeEach(async () => {
			publicKey = 'download-tests-public-key';
			privateKey = 'download-tests-private-key';

			const testFile = {
				path: path.join(__dirname, 'download-temp.txt'),
				originalname: 'download-tests.txt',
				mimetype: 'text/plain',
				size: 13,
			};

			await fs.writeFile(testFile.path, 'download tests');
			await provider.upload(testFile, publicKey, privateKey);
		});

		it('should download file successfully', async () => {
			const result = await provider.download(publicKey);

			expect(result.stream).toBeDefined();
			expect(result.mime_type).toBe('text/plain');
			expect(result.original_name).toBe('download-tests.txt');
			expect(typeof result.stream.pipe).toBe('function');
		});

		it('should update file access times', async () => {
			const metaPath = path.join(testRootFolder, `${publicKey}.meta.json`);
			const beforeStats = await fs.stat(metaPath);

			// Wait a bit to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 10));

			await provider.download(publicKey);

			const afterStats = await fs.stat(metaPath);
			expect(afterStats.atime.getTime()).toBeGreaterThan(beforeStats.atime.getTime());
		});

		it('should throw error for non-existent file', async () => {
			await expect(provider.download('non-existent-key')).rejects.toThrow();
		});
	});

	describe('delete', () => {
		let publicKey, privateKey;

		beforeEach(async () => {
			publicKey = 'delete-tests-public-key';
			privateKey = 'delete-tests-private-key';

			const testFile = {
				path: path.join(__dirname, 'delete-temp.txt'),
				originalname: 'delete-tests.txt',
				mimetype: 'text/plain',
				size: 11,
			};

			await fs.writeFile(testFile.path, 'delete tests');
			await provider.upload(testFile, publicKey, privateKey);
		});

		it('should delete file with correct private key', async () => {
			const result = await provider.delete(privateKey);

			expect(result).toBe(true);

			const filePath = path.join(testRootFolder, publicKey);
			const metaPath = path.join(testRootFolder, `${publicKey}.meta.json`);

			await expect(fs.access(filePath)).rejects.toThrow();
			await expect(fs.access(metaPath)).rejects.toThrow();
		});

		it('should return false for incorrect private key', async () => {
			const result = await provider.delete('wrong-private-key');

			expect(result).toBe(false);

			const filePath = path.join(testRootFolder, publicKey);
			await expect(fs.access(filePath)).resolves.not.toThrow();
		});

		it('should return false when no files exist', async () => {
			await fs.rm(testRootFolder, { recursive: true, force: true });
			await fs.mkdir(testRootFolder, { recursive: true });

			const result = await provider.delete('any-key');

			expect(result).toBe(false);
		});
	});

	describe('exists', () => {
		it('should return true for existing file', async () => {
			const publicKey = 'exists-tests-public-key';
			const testFile = {
				path: path.join(__dirname, 'exists-temp.txt'),
				originalname: 'exists-tests.txt',
				mimetype: 'text/plain',
				size: 10,
			};

			await fs.writeFile(testFile.path, 'exists tests');
			await provider.upload(testFile, publicKey, 'priv123');

			const result = await provider.exists(publicKey);

			expect(result).toBe(true);
		});

		it('should return false for non-existent file', async () => {
			const result = await provider.exists('non-existent-key');

			expect(result).toBe(false);
		});
	});

	describe('xcleanupInactiveFiles', () => {
		beforeEach(async () => {
			const oldFile = {
				path: path.join(__dirname, 'old-temp.txt'),
				originalname: 'old-file.txt',
				mimetype: 'text/plain',
				size: 8,
			};

			const newFile = {
				path: path.join(__dirname, 'new-temp.txt'),
				originalname: 'new-file.txt',
				mimetype: 'text/plain',
				size: 8,
			};

			await fs.writeFile(oldFile.path, 'old file');
			await fs.writeFile(newFile.path, 'new file');

			await provider.upload(oldFile, 'old-pub', 'old-priv');
			await provider.upload(newFile, 'new-pub', 'new-priv');

			const oldFilePath = path.join(testRootFolder, 'old-pub');
			const oldTime = new Date(Date.now() - 10 * 60 * 1000);
			await fs.utimes(oldFilePath, oldTime, oldTime);
		});

		it('should delete inactive files older than threshold', async () => {
			await provider.cleanupInactiveFiles(5 * 60 * 1000);

			await expect(fs.access(path.join(testRootFolder, 'old-pub'))).rejects.toThrow();

			await expect(fs.access(path.join(testRootFolder, 'new-pub'))).resolves.not.toThrow();
		});

		it('should not delete files within threshold period', async () => {
			await provider.cleanupInactiveFiles(15 * 60 * 1000);

			await expect(fs.access(path.join(testRootFolder, 'old-pub'))).resolves.not.toThrow();
			await expect(fs.access(path.join(testRootFolder, 'new-pub'))).resolves.not.toThrow();
		});
	});
});
