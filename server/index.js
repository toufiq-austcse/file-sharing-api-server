const { initiate } = require('./core/bootstrapper');
const { manage } = require('./core/shutdownmanager');
const config = require('../config/default');
const apiRoutes = require('./api');
const { initializeJobs, stopJobs } = require('./jobs');

const createApp = async () => {
	return initiate();
};

const start = async (options) => {
	options = options || {};
	const port = options.port || config.DEFAULT_PORT;

	const app = await createApp(options);
	app.use(apiRoutes);

	return app.listen(port, () => {
		console.log(`server started on port ${port}`);
	});
};
const startJobs = async () => {
	await initializeJobs();
};

const autoManageShutdown = (server) => {
	manage(server, stopJobs);
};

module.exports = {
	start,
	startJobs,
	autoManageShutdown,
};
