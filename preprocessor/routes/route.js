const express = require('express');
const uploadCtrl = require('../controllers/uploadCtrl');
const timestampCtrl = require('../controllers/timestampCtrl');
const experimentCtrl = require('../controllers/experimentCtrl');
const clientCtrl = require('../controllers/clientCtrl');

const router = express.Router();

router.route('/timestamp').get(timestampCtrl.get);
router.route('/video').post(uploadCtrl.video);
router.route('/file').post(uploadCtrl.file);
router.route('/experiments').get(experimentCtrl.get);
router.route('/experiments').post(experimentCtrl.create);
router.route('/experiment_exists').post(experimentCtrl.exists);

/* Python client library */
router.route('/list_all_experiments').get(clientCtrl.list_experiments);
router.route('/list_experiment_files').get(clientCtrl.list_experiment_files);
router.route('/get_video_filename').get(clientCtrl.get_video_filename);

module.exports = router;