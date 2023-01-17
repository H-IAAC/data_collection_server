const express = require('express');
const uploadCtrl = require('../controllers/uploadCtrl');
const timestampCtrl = require('../controllers/timestampCtrl');
const experimentCtrl = require('../controllers/ExperimentCtrl');

const router = express.Router();

router.route('/timestamp').get(timestampCtrl.get);
router.route('/video').post(uploadCtrl.video);
router.route('/file').post(uploadCtrl.file);
router.route('/experiments').get(experimentCtrl.get);
router.route('/experiments').post(experimentCtrl.create);

module.exports = router;