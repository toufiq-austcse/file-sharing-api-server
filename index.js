const server = require('./server');

/**
 * Initialize the service and start managing it.
 */
(async function () {
	const service = await server.start();
	server.autoManageShutdown(service);
})();
