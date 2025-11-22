const config = require('../../config/default');
const statusCodes = require('http-status-codes');
const { getStartOfUTCDayString, createUsageTracker, getClientIP } = require('../core/utils/limiterUtils');

const DEFAULT_UPLOAD_LIMIT_IN_BYTES = Number(process.env.DAILY_UPLOAD_LIMIT_BYTES || config.DAILY_UPLOAD_LIMIT_BYTES);

const uploadLimiter = (options = {}) => {
	const uploadLimitInBytes = Number(options.uploadLimitInBytes ?? DEFAULT_UPLOAD_LIMIT_IN_BYTES);
	const { getUsageForIPAndDay } = createUsageTracker();

	return (req, res, next) => {
		const day = getStartOfUTCDayString();
		const ip = getClientIP(req);

		const usage = getUsageForIPAndDay(ip, day, 'uploaded_bytes');

		const incomingUpload = Number(req.headers['content-length'] || 0);

		if (usage.uploaded_bytes >= uploadLimitInBytes) {
			console.log('Upload limit exceeded for IP:', ip);

			console.log(usage.uploaded_bytes, '>=', uploadLimitInBytes);
			return res.status(statusCodes.TOO_MANY_REQUESTS).json({ error: 'Daily traffic limit exceeded' });
		}

		if (usage.uploaded_bytes + incomingUpload > uploadLimitInBytes) {
			return res.status(statusCodes.TOO_MANY_REQUESTS).json({ error: 'Daily upload limit exceeded' });
		}

		usage.uploaded_bytes += incomingUpload;

		res.setHeader('X-Traffic-Uploaded', String(uploadLimitInBytes));

		next();
	};
};

module.exports = {
	uploadLimiter,
};
