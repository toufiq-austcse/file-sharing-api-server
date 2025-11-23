const express = require('express');
const statusCodes = require('http-status-codes');
const multer = require('multer');
const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => cb(null, '/tmp'),
		filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
	}),
});
const router = express.Router({ mergeParams: true });

const LocalStorageProvider = require('../../services/LocalStorageProvider');
const GoogleCloudStorageProvider = require('../../services/GoogleCloudStorageProvider');
const FileService = require('../../services/FileService');
const { uploadLimiter } = require('../../middleware/upload-limiter');
const { downloadLimiter } = require('../../middleware/download-limiter');
const { getRootFolder } = require('../../../config/default');

//const localStorageProvider = new LocalStorageProvider(getRootFolder());
const googleCloudStorageProvider = new GoogleCloudStorageProvider(
	'/Users/toufiqulislam/projects/personal/meldcx/file-server-task/gcp-config.json'
);
const fileService = new FileService(googleCloudStorageProvider);

router.post('/', uploadLimiter({}), upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(statusCodes.BAD_REQUEST).json({ error: 'file is required' });
		}
		let result = await fileService.uploadFile(req.file);
		return res.status(statusCodes.OK).send(result);
	} catch (e) {
		return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ error: e.message });
	}
});

router.get('/:publicKey', downloadLimiter({}), async (req, res) => {
	try {
		const publicKey = req.params.publicKey;
		if (!publicKey) {
			return res.status(statusCodes.BAD_REQUEST).json({ error: 'publicKey is required' });
		}

		const isExist = await fileService.fileExists(publicKey);
		if (!isExist) {
			return res.status(statusCodes.NOT_FOUND).json({ error: 'file not found' });
		}

		const fileData = await fileService.downloadFile(publicKey);
		res.setHeader('Content-Disposition', `attachment; filename="${fileData.original_name}"`);
		res.setHeader('Content-Type', fileData.mime_type);
		fileData.stream.pipe(res);
	} catch (e) {
		res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ error: e.message });
	}
});

router.delete('/:privateKey', async (req, res) => {
	try {
		const privateKey = req.params.privateKey;
		if (!privateKey) {
			return res.status(statusCodes.BAD_REQUEST).json({ error: 'privateKey is required' });
		}

		const isDeleted = await fileService.deleteFile(privateKey);
		if (!isDeleted) {
			return res.status(statusCodes.NOT_FOUND).json({ error: 'File not found or invalid privateKey' });
		}
		return res.status(statusCodes.OK).json({ message: 'File deleted successfully' });
	} catch (e) {
		return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ error: e.message });
	}
});
module.exports = router;
