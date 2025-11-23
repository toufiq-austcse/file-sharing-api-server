const request = require('supertest');
const { initiate } = require('../index');

describe('Bootstrapper', () => {
	let app;

	beforeEach(async () => {
		app = await initiate();
	});

	describe('initiate', () => {
		it('should create express app', async () => {
			expect(app).toBeDefined();
			expect(typeof app).toBe('function');
		});
	});

	describe('GET /health', () => {
		it('should return 200 with success message', async () => {
			const response = await request(app).get('/health');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ message: 'Up and running' });
		});
	});
});
