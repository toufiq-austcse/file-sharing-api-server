const { initiate } = require('./core/bootstrapper');
const { manage } = require('./core/shutdownmanager');
const config = require('../config/default');
const apiRoutes = require('./api');
const { initializeJobs, stopJobs } = require('./jobs');

/**
 * Creates and configures the Express application
 * @returns {Promise<Express>}
 */
const createApp = async () => {
	return initiate();
};

/**
 * Starts the Express server
 * @param options
 * @returns {Promise<http.Server<typeof IncomingMessage, typeof ServerResponse>>}
 */
const start = async (options) => {
	options = options || {};
	const port = options.port || config.DEFAULT_PORT;

	const app = await createApp(options);
	app.use(apiRoutes);

	return app.listen(port, () => {
		console.log(`server started on port ${port}`);
	});
};

/**
 * Initializes and starts background jobs
 * @returns {Promise<void>}
 */
const startJobs = async () => {
	await initializeJobs();
};

/**
 * Automatically manages shutdown of background jobs when the server stops
 * @param server
 */
const autoManageShutdown = (server) => {
	manage(server, stopJobs);
};

module.exports = {
	start,
	startJobs,
	autoManageShutdown,
};
