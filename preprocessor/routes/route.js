const express = require('express');
const uploadCtrl = require('../controllers/uploadCtrl');
const timestampCtrl = require('../controllers/timestampCtrl');
const labelsCtrl = require('../controllers/labelsCtrl');

const router = express.Router();

router.route('/timestamp').get(timestampCtrl.get);
router.route('/video').post(uploadCtrl.video);
router.route('/file').post(uploadCtrl.file);
router.route('/labels').get(labelsCtrl.get);
router.route('/labels').post(labelsCtrl.create);

module.exports = router;