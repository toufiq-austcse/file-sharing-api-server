const cors = require('cors');
const express = require('express');

/**
 * Initializes the express app with necessary middlewares and routes
 * @returns {Promise<*|Express>}
 */
const initialize = async () => {
	let app = express();

	app.use(cors());
	app.use(express.json());

	app.get('/health', (req, res) => {
		res.status(200).send({ message: 'Up and running' });
	});

	return app;
};

/**
 * The main entry point that creates the express app instance which later spins
 * @returns {Promise<Express>}
 */
const initiate = async () => {
	let app = initialize();
	return app;
};

module.exports = {
	initiate,
};
