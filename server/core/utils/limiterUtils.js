const getStartOfUTCDayString = (date = new Date()) => {
	return date.toISOString().slice(0, 10);
};

const byteLen = (chunk) => {
	if (!chunk) return 0;
	return Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(String(chunk));
};

const shouldCountBytes = (res) => {
	const contentType = res.getHeader('Content-Type');
	if (!contentType) {
		return false;
	}
	const type = String(contentType).toLowerCase();
	return !type.includes('application/json') && !type.includes('text/json');
};

const createUsageTracker = () => {
	const usagesMap = new Map();

	function getUsageForIPAndDay(ip, day, initialKey) {
		const record = usagesMap.get(ip);
		if (!record || record.day !== day) {
			const fresh = { day, [initialKey]: 0 };
			usagesMap.set(ip, fresh);
			return fresh;
		}
		return record;
	}

	return { getUsageForIPAndDay };
};

const getClientIP = (req) => {
	const forwarded = req.headers['x-forwarded-for'];
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}

	return (
		req.headers['x-real-ip'] ||
		req.headers['cf-connecting-ip'] ||
		req.headers['x-client-ip'] ||
		req.headers['x-forwarded'] ||
		req.headers['forwarded-for'] ||
		req.headers['forwarded'] ||
		req.connection?.remoteAddress ||
		req.socket?.remoteAddress ||
		req.ip ||
		'unknown'
	);
};

module.exports = {
	getStartOfUTCDayString,
	createUsageTracker,
	getClientIP,
	byteLen,
	shouldCountBytes,
};
