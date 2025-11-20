const config = require('../../../config/default');

/**
 * Manage graceful shutdown of the server.
 * @param server
 */
const manage = (server) => {
	let connections = [];

	let shutDown = () => {
		console.log('Received kill signal, shutting down gracefully');

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
