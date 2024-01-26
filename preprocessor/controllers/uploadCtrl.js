const fs = require('fs'),
    formidable = require('formidable'),
    path = require('path'),
    logger = require('../utils/logger'),
    consts = require('../utils/consts'),
    utils = require('../utils/utils'),
    service = require("../services/experimentService");

const MAX_FILE_SIZE = 5000 * 1024 * 1024; // 5Gb

module.exports = {
    /**
     * POST
     * 
     * Upload video.
     * Test using curl:
     * curl --progress-bar -X POST http://localhost:8080/api/video -H 'Content-Type: multipart/form-data' -F file=@1.mp4 -F directory="1 2 5" | cat
     */
    video: function (req, res) {
        const form = new formidable.IncomingForm({ keepExtensions: true, maxFileSize: MAX_FILE_SIZE });

        logger.info("Video uploading");

        /*const requiredFields = ['directory'];

        form
        .on ('field', function (name, value) {
            console.log ("fields: " + name + " - " + value) ;
            console.log ("requiredFields.indexOf(name): " + requiredFields.indexOf(name)) ;

            if (requiredFields.indexOf(name) == -1 || !value) {
                // field is required and its value is empty
                console.log ("fields throw error") ;
                form._error('Required field is empty!');
                return;
            } else {
                console.log ("fields ok") ;
            }

           // if (!fields.directory) {
           //     const msg = "Video upload require parameters: directory, videoduration, startTimestamp and endTimestamp."
           //     logger.error(msg);
           //     return res.status(400).json({ status: msg });
           // }

        })
        .on ('file', function (name, file) {
            console.log ("file: " + name + " - " + file) ;
            //fs.rename (file.path, form.uploadDir + '/' + file.name) ;
            //filename =file.name ;
        })
        .on ('end', function () {
            console.log ('-> upload done') ;
            //if ( filename == '' )
            //    res.status (500).end ('No file submitted!') ;
            //res.json ({ 'name': filename }) ;
        });
        
        form.on('error', function (message) {
            console.log ('-> ERROR: ' + message) ;
            res.status(400).json({ status: message });
            return;
        })*/


        // Parse form content
        form.parse(req, async function (err, fields, files) {

            if (err) {
                logger.error("error: " + err);
                return res.status(500).json({ status: "Error: " + err });
            }

            if (!files.file || !files.file.filepath ||
                !fields.directory) {
                const msg = "Video upload require parameters: File, directory, videoduration, startTimestamp and endTimestamp."
                logger.error(msg);
                return res.status(400).json({ status: msg });
            }

            const uploaded_filename = files.file.originalFilename; // File name from the file been uploaded
            const uploaded_filepath = files.file.filepath;         // Path to the file been uploaded, normally it is in \tmp

            logger.info("Receiving video: " + uploaded_filename + ", to directory: " + fields.directory);

            if (path.parse(uploaded_filename).ext.toLocaleLowerCase() !== '.mp4') {
                const msg = "Invalid video file extension: " + uploaded_filename;
                logger.error(msg);
                return res.status(400).json({ status: msg });
            }

            const output_dir = consts.PREPROCESSING_DIR + path.sep + fields.directory + path.sep;
            const video_output_path = output_dir + uploaded_filename;
            const metadata_output_path = output_dir + path.parse(uploaded_filename).name + ".video";

            // Check if this experiment has a video available
            if (service.experiment_has_video(fields.directory)) {
                const msg = "Video upload ignored! A video already exists for this experiment " + fields.directory + ".";
                logger.info(msg);
                return res.status(500).json({ status: msg });
            }

            service.create_experiment_path(output_dir);

            logger.info("Copying file " + uploaded_filepath + " to " + video_output_path + ".");

            fs.rename(uploaded_filepath, video_output_path, (err) => {
                if (err) {
                    const msg = "Copying file " + uploaded_filepath + " failed: " + err;
                    logger.error(msg);
                    return res.status(500).json({ status: msg});
                }

                // Create the metadata file for the video
                fs.writeFileSync(metadata_output_path, createVideoMetadata(uploaded_filename, fields));

                logger.info("Receiving video: " + uploaded_filename + ", to directory: " + fields.directory + " - [success]");

                return res.json({ status: "Success" });
            });

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

            if (!files.file || !files.file.filepath || !fields.experiment || !fields.subject || !fields.activity) {
                logger.error("Invalid request");
                return res.status(400).json({ status: "Request is missing required parameters (file and experiment are required)." });
            }

            if (!fields.overwrite) {
                fields.overwrite = 'false';
            }

            const uploaded_filename = files.file.originalFilename; // File name from the file been uploaded
            const uploaded_filepath = files.file.filepath;         // Path to the file been uploaded, normally it is in \tmp

            logger.info("Receiving file: " + uploaded_filename + 
                        " experiment: " + fields.experiment + " user: " + fields.subject);

            const output_dir = service.create_experiment(fields.experiment, fields.activity, fields.subject);
            const file_output_path = output_dir + uploaded_filename;

            if (path.extname(uploaded_filename) === "csv") {
                if (await utils.validate_csv(uploaded_filepath, uploaded_filename) !== "success") {
                    return res.status(500).json({ status: "Invalid CSV name and content (" + uploaded_filename + ")" });
                }
            }

            logger.info("Copying file " + uploaded_filepath + " to " + file_output_path + ".");
            fs.rename(uploaded_filepath, file_output_path, (err) => {
                if (err) {
                    const msg = "Copying file " + uploaded_filepath + " failed: " + err;
                    logger.error(msg);
                    return res.status(500).json({ status: msg});
                }

                logger.info("Receiving file: " + uploaded_filename + 
                            " experiment: " + fields.experiment + " user: " + fields.subject + " [success]");

                return res.json({ status: "Success" });
            });

        });
    },

    /**
     * POST
     * 
     * Upload config.
     */
    config: function (req, res) {
        const form = new formidable.IncomingForm({ keepExtensions: true, maxFileSize: MAX_FILE_SIZE });

        // Parse form content
        form.parse(req, async function (err, fields, files) {

            if (err) {
                logger.error("error: " + err);
                return res.status(500).json({ status: "Error: " + err });
            }

            if (!files.file || !files.file.filepath || !fields.experiment || !fields.subject || !fields.activity) {
                logger.error("Invalid request");
                return res.status(400).json({ status: "Request is missing required parameters (file and experiment are required)." });
            }

            const uploaded_filename = files.file.originalFilename; // File name from the file been uploaded
            const uploaded_filepath = files.file.filepath;         // Path to the file been uploaded, normally it is in \tmp

            logger.info("Receiving config: " + uploaded_filename + 
                        " for experiment: [" + fields.experiment +
                        "] user: [" + fields.subject +
                        "] activity: [" + fields.activity + "]");

            const output_dir = service.create_experiment(fields.experiment, fields.activity, fields.subject);
            const file_output_path = output_dir + uploaded_filename;

            logger.info("Copying file " + uploaded_filepath + " to " + file_output_path + ".");
            fs.rename(uploaded_filepath, file_output_path, (err) => {
                if (err) {
                    const msg = "Copying file " + uploaded_filepath + " failed: " + err;
                    logger.error(msg);
                    return res.status(500).json({ status: msg});
                }

                logger.info("Receiving config: " + uploaded_filename + 
                    " for experiment: [" + fields.experiment +
                    "] user: [" + fields.subject +
                    "] activity: [" + fields.activity + "] [success]");

                return res.json({ status: "Success" });
            });

        });
    },

    /**
     * GET
     * 
     * Return config.
     */
    getConfig: function (req, res) {

        if (!req.query.experiment || !req.query.subject || !req.query.activity) {
            logger.error("Invalid request");
            return res.status(400).json({ status: "Request is missing required parameter." });
        }

        const experiment = req.query.experiment;
        const subject = req.query.subject;
        const activity = req.query.activity;

        logger.info("Checking config for experiment: [" + experiment + "] user: [" + subject + "] activity: [" + activity + "]");

        var config = service.get_experiment_config(experiment, activity, subject);

        logger.info("Returning config: [" + config + "]");

        return res.send(config);
    }
}

function createVideoMetadata(filename, values) {
    return '[Metadata]' + '\n' +
        'experiment = ' + values.directory + '\n' +
        'filename = ' + filename + '\n' +
        'duration = ' + values.videoduration + '\n' +
        'startTimestamp = ' + values.startTimestamp + '\n' +
        'endTimestamp = ' + values.endTimestamp;
}
