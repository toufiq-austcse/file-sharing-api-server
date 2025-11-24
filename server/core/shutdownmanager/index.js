const config = require('../../../config/default');
/**
 * Manages graceful shutdown of the server.
 * @param server
 * @param stopJobs
 */
const manage = (server, stopJobs) => {
	let connections = [];

	let shutDown = async () => {
		console.log('Received kill signal, shutting down gracefully');

		if (stopJobs && typeof stopJobs === 'function') {
			try {
				await stopJobs();
				console.log('Background jobs stopped');
			} catch (error) {
				console.error('Error stopping jobs:', error);
			}
		}

		server.close(() => {
			console.log('Closed out remaining connections');
			process.exit(0);
		});

		connections.forEach((curr) => {
			curr.end();
		});

		setTimeout(() => {
			connections.forEach((curr) => {
				curr.destroy();
			});
		}, config.CONNECTION_CLOSING_TIME);

		setTimeout(() => {
			console.log('Could not close connections in time, forcefully shutting down');
			process.exit(1);
		}, config.WAIT_TIME_BEFORE_FORCE_SHUTDOWN);
	};

	process.on('SIGTERM', shutDown);
	process.on('SIGINT', shutDown);

	server.on('connection', (connection) => {
		connections.push(connection);
		console.log('New connection established. Total connections: ', connections.length);
		connection.on('close', function () {
			connections = connections.filter((curr) => {
				return curr !== connection;
			});
		});
	});
};

module.exports = {
	manage,
};
