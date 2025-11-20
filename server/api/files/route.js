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
const aLocalStorageProvider = new LocalStorageProvider('./uploads');
const FileService = require('../../services/FileService');

const aFileService = new FileService(aLocalStorageProvider);

router.post('/', upload.single('file'), async (req, res) => {
	try {
		let result = await aFileService.uploadFile(req.file);
		res.status(statusCodes.OK).send(result);
	} catch (e) {
		res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ error: e.message });
	}
});

router.get('/:publicKey', async (req, res) => {
	try {
		let fileData = await aFileService.downloadFile(req.params.publicKey);
		res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
		res.setHeader('Content-Type', fileData.mimeType);
		fileData.stream.pipe(res);
	} catch (e) {
		res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ error: e.message });
	}
});

module.exports = router;
