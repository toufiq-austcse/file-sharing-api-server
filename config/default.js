const DEFAULT_ROOT_FOLDER = './uploads';
const DEFAULT_PROVIDER = 'local';
const getRootFolder = () => {
	return process.env.ROOT_FOLDER || DEFAULT_ROOT_FOLDER;
};
const getProvider = () => {
	return process.env.PROVIDER || DEFAULT_PROVIDER;
};
module.exports = {
	SERVER_NAME: 'file-sharing-api-server',
	DEFAULT_PORT: 3000,
	CONNECTION_CLOSING_TIME: 5000,
	WAIT_TIME_BEFORE_FORCE_SHUTDOWN: 10000,
	DAILY_UPLOAD_LIMIT_BYTES: 2081228,
	DAILY_DOWNLOAD_LIMIT_BYTES: 2081052,
	FILE_CLEANUP_INACTIVITY_MINUTES: 2,
	FILE_CLEANUP_CRON: '* * * * *',
	getRootFolder,
	getProvider,
};
