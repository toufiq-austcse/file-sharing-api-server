const { initiate } = require('./core/bootstrapper');
const { manage } = require('./core/shutdownmanager');
const config = require('../config/default');

/**
 * Creates and initializes the application instance
 * @returns {Promise<Object>} The initialized application
 */
const createApp = async () => {
	return initiate();
};

/**
 * Starts the server on the specified port
 * @param {Object} options - Configuration options
 * @param {number} [options.port] - Port number to listen on
 * @returns {Promise<Object>} The running server instance
 */
const start = async (options) => {
	options = options || {};
	const port = options.port || config.DEFAULT_PORT;

	const app = await createApp(options);

	return app.listen(port, function () {
		console.log(`server started on port ${port}`);
	});
};

/**
 * Sets up automatic shutdown handling for the server
 * @param {Object} server - The server instance to manage
 */
const autoManageShutdown = (server) => {
	manage(server);
};

module.exports = {
	start,
	autoManageShutdown,
};
