const config = require('../../config/default');
const statusCodes = require('http-status-codes');
const {
	getStartOfUTCDayString,
	createUsageTracker,
	getClientIP,
	byteLen,
	shouldCountBytes,
} = require('../core/utils/limiter-utils');

const DEFAULT_DOWNLOAD_LIMIT_IN_BYTES = Number(
	process.env.DAILY_DOWNLOAD_LIMIT_BYTES || config.DAILY_DOWNLOAD_LIMIT_BYTES
);

const downloadLimiter = (options = {}) => {
	const downloadLimitInBytes = Number(options.downloadLimitInBytes ?? DEFAULT_DOWNLOAD_LIMIT_IN_BYTES);
	const { getUsageForIPAndDay } = createUsageTracker();

	return (req, res, next) => {
		const day = getStartOfUTCDayString();
		const ip = getClientIP(req);

		const usage = getUsageForIPAndDay(ip, day, 'downloaded_bytes');
		if (usage.downloaded_bytes >= downloadLimitInBytes) {
			return res.status(statusCodes.TOO_MANY_REQUESTS).json({ error: 'Daily download limit exceeded' });
		}

		let bytesSent = 0;

		const originalWrite = res.write;
		const originalEnd = res.end;

		res.write = function (chunk, encoding, callback) {
			if (chunk && shouldCountBytes(res)) {
				bytesSent += byteLen(chunk);
			}
			return originalWrite.call(this, chunk, encoding, callback);
		};
		res.end = function (chunk, encoding, callback) {
			if (chunk && shouldCountBytes(res)) {
				bytesSent += byteLen(chunk);
			}
			return originalEnd.call(this, chunk, encoding, callback);
		};
		res.on('finish', () => {
			if (shouldCountBytes(res)) {
				usage.downloaded_bytes += bytesSent;
			}
		});

		next();
	};
};

module.exports = {
	downloadLimiter,
};
