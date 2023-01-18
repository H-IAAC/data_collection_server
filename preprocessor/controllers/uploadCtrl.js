const fs = require('fs'),
    formidable = require('formidable'),
    path = require('path'),
    logger = require('../utils/logger'),
    utils = require('../utils/utils'),
    service = require("../services/experimentService");;

const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2Gb

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

            if (!files.file || !files.file.filepath || !fields.experiment || !fields.overwrite || !fields.timestamp) {
                logger.error("Invalid request");
                return res.status(400).json({ status: "Request is missing data (file, experiment, overwrite and timestamp are required)." });
            }

            if (files.file.filepath.split('.').pop() !== 'mp4') {
                logger.error("Invalid upload, bad request video extension: " + files.file.filepath.split('.').pop());
                return res.status(400).json({ status: "Invalid video file extension." });
            }

            logger.info("Receiving video: " + files.file.originalFilename + " experiment: " + fields.experiment);

            var uploadLocation_dir = service.create_experiment(fields.experiment);
            var uploadLocationVideoFile = uploadLocation_dir + files.file.originalFilename;
            var uploadLocationVideoMeta = uploadLocation_dir + path.parse(files.file.originalFilename).name + ".video";

            // When overwrite flag is 'false'
            // Need to fail if a file with same file name already exists
            if ((fields.overwrite && fields.overwrite === 'false') && fs.existsSync(uploadLocationVideoFile)) {
                logger.info("Ignoring file " + uploadLocationVideoFile + " as it already exists.");
                return res.status(500).json({ status: "Upload ignored. A file with this experiment and name already exists." });
            }

            // Need to check if this experiment has no video, each experiment must have only 1 video.
            // so get all content from this
            var uploadLocation_files = await service.get_directory_content(uploadLocation_dir, fields.experiment);
            for (let file of uploadLocation_files) {
                if (file.isVideo === true) {
                    logger.info("Ignoring file " + files.file.originalFilename + ", experiment " + fields.experiment + " already has a video.");
                    return res.status(500).json({ status: "Upload ignored. A video already exists for this experiment." });
                }
            }

            // Get file content on tmp dir.
            var rawData = fs.readFileSync(files.file.filepath);

            // Uploads are sent to operating systems tmp dir by default,
            // need to copy correct destination.
            fs.writeFileSync(uploadLocationVideoFile, rawData);

            fs.writeFileSync(uploadLocationVideoMeta, createVideoMetadata(files.file.originalFilename, fields));

            logger.info("video: " + files.file.originalFilename + " experiment: " + fields.experiment + " [success]");

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

            if (!files.file || !files.file.filepath || !fields.experiment || !fields.activity) {
                logger.error("Invalid request");
                return res.status(400).json({ status: "Request is missing required parameters (file and experiment are required)." });
            }

            if (!fields.overwrite) {
                fields.overwrite = 'false';
            }

            logger.info("Receiving file: " + files.file.originalFilename + " experiment: " + fields.experiment);

            // Uploads are sent to operating systems tmp dir by default,
            // need to copy correct destination.
            var tmpPath = files.file.filepath;

            var uploadLocation_dir = service.create_experiment(fields.experiment);

            uploadLocation = uploadLocation_dir + files.file.originalFilename;

            // If a file with same file name already exists, then return an error and not overwrite the file.
            if (fields.overwrite === 'false' && fs.existsSync(uploadLocation)) {
                logger.info("Ignoring file " + uploadLocation + " as it already exists in the " + uploadLocation + " directory.");
                return res.status(500).json({ status: "Upload ignored. A file with experiment and name already exists." });
            }

            if (await utils.validate_csv(tmpPath, files.file.originalFilename) !== "success") {
                return res.status(500).json({ status: "Invalid CSV name and content (" + files.file.originalFilename + ")" });
            }

            // TODO: Need to check best approach to check timestamp between CSV and Video.
            // Check if there is a video already uploaded
            //if (await checkCSVTimestamp(tmpPath, uploadLocation_dir) === false) {
            //    logger.error("Upload of CSV " + tmpPath + " failed.");
            //    logger.error(tmpPath + ": CSV timestamp dont match Video timestamp");
            //    return res.status(500).json({ status: "Invalid CSV (Video and CSV timestamp don't match.)" });
            //}

            // Get file content on tmp dir.
            var rawData = fs.readFileSync(tmpPath);

            fs.writeFileSync(uploadLocation, rawData);

            logger.info("Receiving file: " + files.file.originalFilename + " experiment: " + fields.experiment + " [success]");

            return res.json({ status: "Success" });
        });
    }
}

function createVideoMetadata(filename, values) {
    return '[Metadata]' + '\n' +
        'experiment = ' + values.experiment + '\n' +
        'filename = ' + filename + '\n' +
        'videoDuration = ' + values.videoduration + '\n' +
        'startTimestamp = ' + (Date.parse(values.timestamp) - (Math.floor(values.videoduration * 1000))) + '\n' +
        'endTimestamp = ' + Date.parse(values.timestamp);
}

async function checkCSVTimestamp(csv_file, uploadLocation_dir) {
    var csv_lastTimestamp = await utils.get_csv_last_timestamps(csv_file);
    var video_endTimestamp = 0;

    let file_already_uploaded = await fs.promises.readdir(uploadLocation_dir);
    file_already_uploaded.forEach(function (file) {
        if (path.extname(file).toLowerCase() === '.video') {
            var ini = utils.convert_ini_to_json(uploadLocation_dir + file);
            video_endTimestamp = ini.Metadata.endTimestamp;
        }
    });

    console.log("video_endTimestamp: " + video_endTimestamp);
    console.log("csv_lastTimestamp:  " + csv_lastTimestamp);

    // If timestamp in CSV file is shorter then video timestamp, it means
    // that video ends before the csv contant.
    if ((video_endTimestamp !== 0) && (csv_lastTimestamp < video_endTimestamp))
        // In this case, CSV is invalid.
        return false;

    return true;
}
