const express = require('express');
const router = express.Router();

const files = require('./files');

router.use(files.config.ENDPOINT, files.route);

module.exports = router;
