const fs = require('fs'),
    formidable = require('formidable'),
    path = require('path'),
    logger = require('../utils/logger'),
    consts = require('../utils/consts'),
    utils = require('../utils/utils'),
    service = require("../services/experimentService");

const MAX_FILE_SIZE = 4000 * 1024 * 1024; // 4Gb

module.exports = {
    /**
     * POST
     * 
     * Upload video.
     */
    video: function (req, res) {
        const form = new formidable.IncomingForm({ keepExtensions: true, maxFileSize: MAX_FILE_SIZE });

        // Parse form content
        form.parse(req, async function (err, fields, files) {

            if (err) {
                logger.error("error: " + err);
                return res.status(500).json({ status: "Error: " + err });
            }

            if (!files.file || !files.file.filepath || !fields.directory || !fields.timestamp) {
                logger.error("Invalid request");
                return res.status(400).json({ status: "Request is missing data (file, directory and timestamp are required)." });
            }

            if (path.parse(files.file.originalFilename).ext.toLocaleLowerCase() !== '.mp4') {
                logger.error("Invalid video file extension: " + files.file.originalFilename);
                return res.status(400).json({ status: "Invalid video file extension." });
            }

            logger.info("Receiving video: " + files.file.originalFilename +
                        ", to directory: " + fields.directory);

            var upload_dir = consts.PREPROCESSING_DIR + fields.directory + path.sep;
            var video_destination_path = upload_dir + files.file.originalFilename;
            var metadata_destionation_path = upload_dir + path.parse(files.file.originalFilename).name + ".video";

            // Check if experiment really exists
            if (!service.experiment_directory_exists(fields.directory)) {
                logger.info("Invalid upload directory: " + fields.directory);
                return res.status(409).json({ status: "Invalid upload directory." });
            }

            // Check if this experiment has a video available
            if (service.experiment_has_video(fields.directory)) {
                logger.info(fields.directory + " already contains a video.");
                return res.status(500).json({ status: "Upload ignored. A video already exists for this experiment." });
            }

            // Get file content on tmp dir.
            var raw_data = fs.readFileSync(files.file.filepath);

            // Copy video file
            fs.writeFileSync(video_destination_path, raw_data);

            // Copy video metadata file
            fs.writeFileSync(metadata_destionation_path, createVideoMetadata(files.file.originalFilename, fields));

            if (files.metadata) {
                fs.copyFile(files.metadata.filepath, upload_dir + files.metadata.originalFilename, (err) => {
                    logger.info("Failed to receive metadata file for: " + files.file.originalFilename +
                    ", to directory: " + fields.directory);
                });
            }

            logger.info("Receiving video: " + files.file.originalFilename +
                        ", to directory: " + fields.directory + " - [success]");

            return res.json({ status: "Success" });
        });
    },

    /**
     * POST
     * 
     * Upload file related to an activity.
     */
    file: function (req, res) {
        const form = new formidable.IncomingForm({ keepExtensions: true, maxFileSize: MAX_FILE_SIZE });

        // Parse form content
        form.parse(req, async function (err, fields, files) {

            if (err) {
                logger.error("error: " + err);
                return res.status(500).json({ status: "Error: " + err });
            }

            if (!files.file || !files.file.filepath || !fields.experiment || !fields.subject) {
                logger.error("Invalid request");
                return res.status(400).json({ status: "Request is missing required parameters (file and experiment are required)." });
            }

            if (!fields.overwrite) {
                fields.overwrite = 'false';
            }

            logger.info("Receiving file: " + files.file.originalFilename + 
                        " experiment: " + fields.experiment + " user: " + fields.subject);

            // Uploads are sent to operating systems tmp dir by default,
            // need to copy correct destination.
            var tmp_path = files.file.filepath;

            var activity = utils.extract_activity_from_filename(files.file.originalFilename);

            var upload_dir = service.create_experiment(fields.experiment, activity, fields.subject);
            var file_destination_path = upload_dir + files.file.originalFilename;

            if (await utils.validate_csv(tmp_path, files.file.originalFilename) !== "success") {
                return res.status(500).json({ status: "Invalid CSV name and content (" + files.file.originalFilename + ")" });
            }

            // Get file content on tmp dir.
            var raw_data = fs.readFileSync(tmp_path);

            fs.writeFileSync(file_destination_path, raw_data);

            logger.info("Receiving file: " + files.file.originalFilename + 
                        " experiment: " + fields.experiment + " user: " + fields.subject + " [success]");

            return res.json({ status: "Success" });
        });
    }
}

function createVideoMetadata(filename, values) {
    return '[Metadata]' + '\n' +
        'experiment = ' + values.directory + '\n' +
        'filename = ' + filename + '\n' +
        'startTimestamp = ' + (Date.parse(values.timestamp) - (Math.floor(values.videoduration * 1000))) + '\n' +
        'endTimestamp = ' + Date.parse(values.timestamp);
}
