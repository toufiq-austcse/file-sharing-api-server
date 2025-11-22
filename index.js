require('dotenv').config();

const server = require('./server');

function options() {
	let options = {};
	options.port = process.env.PORT;
	return options;
}

/**
 * Initialize the service and start managing it.
 */
(async function () {
	const service = await server.start(options());
	await server.startJobs();

	server.autoManageShutdown(service);
})();
