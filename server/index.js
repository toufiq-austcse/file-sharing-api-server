const { initiate } = require('./core/bootstrapper');
const { manage } = require('./core/shutdownmanager');
const config = require('../config/default');
const apiRoutes = require('./api');

const createApp = async () => {
	return initiate();
};

const start = async (options) => {
	options = options || {};
	const port = options.port || config.DEFAULT_PORT;

	const app = await createApp(options);
	app.use('/api', apiRoutes);

	return app.listen(port, function () {
		console.log(`server started on port ${port}`);
	});
};

const autoManageShutdown = (server) => {
	manage(server);
};

module.exports = {
	start,
	autoManageShutdown,
};
