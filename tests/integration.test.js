process.env.DAILY_DOWNLOAD_LIMIT_BYTES = 500000;
process.env.DAILY_UPLOAD_LIMIT_BYTES = 500000;

const request = require('supertest');
const express = require('express');
const statusCodes = require('http-status-codes');
const fs = require('fs');
const path = require('path');
const filesApi = require('../server/api/files');
const { getRootFolder } = require('../config/default');
const app = express();

app.use(filesApi.config.ENDPOINT, filesApi.route);

describe('Files API Integration Tests', () => {
	describe('POST /files', () => {
		it('should upload a file successfully', async () => {
			const response = await request(app).post('/files').attach('file', Buffer.from('Hello, World!'), 'hello.txt');

			expect(response.status).toBe(statusCodes.OK);
			expect(response.body).toHaveProperty('publicKey');
			expect(response.body).toHaveProperty('privateKey');
		});

		it('should return 400 when no file is provided', async () => {
			const response = await request(app).post('/files');

			expect(response.status).toBe(statusCodes.BAD_REQUEST);
			expect(response.body).toHaveProperty('error');
		});
		it('should work within realistic upload limits', async () => {
			const testContent = 'Small tests file for upload limit testing';

			const response = await request(app)
				.post('/files')
				.attach('file', Buffer.from(testContent), 'tests-upload-limit.txt')
				.set('X-Forwarded-For', '192.168.1.250');

			expect(response.status).toBe(statusCodes.OK);
			expect(response.body).toHaveProperty('publicKey');
			expect(response.body).toHaveProperty('privateKey');
		});
		it('should return 429 when upload limit is exceeded', async () => {
			const largeContent = 'A'.repeat(process.env.DAILY_UPLOAD_LIMIT_BYTES + 300);
			const largePath = path.join(__dirname, 'large-upload-file.txt');

			try {
				fs.writeFileSync(largePath, largeContent);
				const testIP = '192.168.1.300';

				const response = await request(app).post('/files').attach('file', largePath).set('X-Forwarded-For', testIP);

				expect(response.status).toBe(statusCodes.TOO_MANY_REQUESTS);
				expect(response.body).toHaveProperty('error');
			} finally {
				if (fs.existsSync(largePath)) {
					fs.unlinkSync(largePath);
				}
			}
		});
	});

	describe('GET /files/:publicKey', () => {
		it('should download a file successfully', async () => {
			const uploadResponse = await request(app)
				.post('/files')
				.attach('file', Buffer.from('Hello, World!'), 'hello.txt');
			const publicKey = uploadResponse.body.publicKey;

			const downloadResponse = await request(app).get(`/files/${publicKey}`);

			expect(downloadResponse.status).toBe(statusCodes.OK);
			expect(downloadResponse.header['content-disposition']).toContain('hello.txt');
			expect(downloadResponse.text).toBe('Hello, World!');
		});

		it('should return 404 for non-existent publicKey', async () => {
			const response = await request(app).get('/files/nonexistentkey');

			expect(response.status).toBe(statusCodes.NOT_FOUND);
			expect(response.body).toHaveProperty('error', 'file not found');
		});

		it('should return 429 when download limit is exceeded', async () => {
			const largeContent = 'A'.repeat(process.env.DAILY_UPLOAD_LIMIT_BYTES - 300);
			const largePath = path.join(__dirname, 'large-file.txt');

			try {
				fs.writeFileSync(largePath, largeContent);
				const testIP = '192.168.1.200';

				const uploadResponse = await request(app)
					.post('/files')
					.attach('file', largePath)
					.set('X-Forwarded-For', testIP);

				const publicKey = uploadResponse.body.publicKey;

				const firstDownload = await request(app).get(`/files/${publicKey}`).set('X-Forwarded-For', testIP);

				expect(firstDownload.status).toBe(statusCodes.OK);

				const secondDownload = await request(app).get(`/files/${publicKey}`).set('X-Forwarded-For', testIP);

				expect(secondDownload.status).toBe(statusCodes.OK);

				const thirdDownload = await request(app).get(`/files/${publicKey}`).set('X-Forwarded-For', testIP);

				expect(thirdDownload.status).toBe(statusCodes.TOO_MANY_REQUESTS);
			} finally {
				if (fs.existsSync(largePath)) {
					fs.unlinkSync(largePath);
				}
			}
		});

		it('should track download limits per IP separately', async () => {
			const testContent = 'Content for IP separation tests';

			const uploadResponse = await request(app).post('/files').attach('file', Buffer.from(testContent), 'ip-tests.txt');
			const publicKey = uploadResponse.body.publicKey;

			const ip1Response = await request(app).get(`/files/${publicKey}`).set('X-Forwarded-For', '192.168.1.101');

			expect(ip1Response.status).toBe(statusCodes.OK);
			expect(ip1Response.text).toBe(testContent);

			const ip2Response = await request(app).get(`/files/${publicKey}`).set('X-Forwarded-For', '192.168.1.102');

			expect(ip2Response.status).toBe(statusCodes.OK);
			expect(ip2Response.text).toBe(testContent);
		});
	});

	describe('DELETE /files/:privateKey', () => {
		it('should delete a file successfully', async () => {
			// First, upload a file to get the privateKey
			const uploadResponse = await request(app)
				.post('/files')
				.attach('file', Buffer.from('Hello, World!'), 'hello.txt');
			const privateKey = uploadResponse.body.privateKey;

			const deleteResponse = await request(app).delete(`/files/${privateKey}`);

			expect(deleteResponse.status).toBe(statusCodes.OK);
			expect(deleteResponse.body).toHaveProperty('message', 'File deleted successfully');
		});

		it('should return 404 for non-existent privateKey', async () => {
			const response = await request(app).delete('/files/nonexistentkey');

			expect(response.status).toBe(statusCodes.NOT_FOUND);
			expect(response.body).toHaveProperty('error', 'File not found or invalid privateKey');
		});
	});

	afterAll(() => {
		let rootFolder = getRootFolder();

		fs.readdir(rootFolder, (err, files) => {
			if (err) throw err;

			for (const file of files) {
				fs.unlink(path.join(rootFolder, file), (err) => {
					if (err) throw err;
				});
			}
		});
		app.close && app.close();
	});
});
