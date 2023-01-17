const fs = require('fs'),
    path = require('path'),
    utils = require('../utils/utils'),
    consts = require('../utils/consts');

module.exports = {
    /**
     * Create a new experiment.
     * 
     * @param {type} name           Experiment name.
     * @return {type}               Return the experiment directory path.
     */
    create_experiment(name) {
        var experiment_dir = consts.PREPROCESSING_DIR + name + path.sep;

        utils.create_directory(experiment_dir);

        return experiment_dir;
    },

    /**
     * Check if a experiment exists.
     * 
     * @param {type} name           Experiment name.
     * @return {type}               True if experiment exists, otherwise return false.
     */
    experiment_exists(name) {
        var experiment_dir = consts.PREPROCESSING_DIR + name + path.sep;

        return fs.existsSync(experiment_dir);
    },

    /**
     * Get info from all experiments available.
     * 
     * @return {array}      Array of objects containing info regarding all experiments available.
     */
    async get_all_experiments() {
        var pre_dir = consts.PREPROCESSING_DIR;
        var post_dir = consts.POSTPROCESSING_DIR;

        var files = await fs.promises.readdir(pre_dir);

        return files.map(function (dir_name) {

            var preprocess_files = fs.readdirSync(pre_dir + dir_name);

            var activity = 'activity';
            var total_number_of_files = 0;
            var isVideoAvailable = false;

            preprocess_files.filter(file => {
                total_number_of_files++;

                if (path.extname(file).toLowerCase() === '.csv') {
                    // Get activity string from file name.
                    // Filename example: Server_Test5_Braço__20230112.154454
                    activity = file.substring(0, file.indexOf('__'));
                    activity = activity.substring(0, activity.lastIndexOf('_'));

                } else if (path.extname(file).toLowerCase() === '.video') {
                    // Do not count '.video' as a file, because it is not
                    // uploaded by user.
                    total_number_of_files--;
                } else if (path.extname(file).toLowerCase() === '.mp4') {
                    isVideoAvailable = true;
                }
            })

            return {
                experiment: dir_name,
                activity: activity,
                time: fs.statSync(pre_dir + dir_name).mtime.getTime(),
                content: total_number_of_files,
                videoAvailable: isVideoAvailable,
                error: (fs.existsSync(post_dir + dir_name)) ?
                    fs.readdirSync(post_dir + dir_name).filter(file => { return file.includes('err.log'); }).length : 0
            }
        })
            .sort(function (a, b) {
                // Sort by date, newer come first
                return b.time - a.time;
            })
            .map(function (v) {
                return v;
            });
    },

    /**
     * Get pre and post-processed files from a experiment.
     * 
     * @param {type} experiment     Experiment name.
     * @return {Object}             JSON with 'pre' and 'post' fields, containing all files related to the experiment.
     */
    async get_pre_and_post_processed_files(experiment) {
        var files = {};
        files.pre = await module.exports.get_directory_content(consts.PREPROCESSING_DIR + path.sep + experiment, experiment);
        files.post = await module.exports.get_directory_content(consts.POSTPROCESSING_DIR + path.sep + experiment, experiment);
        return files;
    },

    /**
     * Get post-processed video and csv from a experiment.
     * 
     * @param {type} dir_path       Directory where to look for files.
     * @param {type} experiment     Experiment name.
     * @return {array}              Array with all content (files) in a directory.
     */
    async get_directory_content(dir_path, experiment) {
        if (!fs.existsSync(dir_path)) {
            return [];
        }

        let files = await fs.promises.readdir(dir_path);

        return files.map(function (fileName) {
            return {
                name: fileName,
                path: path.sep + experiment + path.sep + fileName,
                isVideo: (fileName.split('.').pop() === 'mp4') ? true : false
            }
        }).map(function (v) {
            return v;
        });
    },

    /**
     * Get post-processed video and csv from a experiment.
     * 
     * @param {type} name           Experiment name.
     * @return {Object}             JSON object with video, csv and path info.
     */
    async get_experiment_postprocessed_data(name) {
        var root = consts.POSTPROCESSING_DIR + path.sep + name
        var jsonData = {};
        var csv_files = [];

        if (!fs.existsSync(root)) {
            return jsonData;
        }

        let files = await fs.promises.readdir(root);
        files.forEach(function (file) {
            if (path.extname(file).toLowerCase() === '.mp4') {
                jsonData.video = file;
            } else if (path.extname(file).toLowerCase() === '.csv') {
                csv_files.push(file);
            }

        });

        jsonData.csv = csv_files;
        jsonData.path = path.sep + name + path.sep;

        return jsonData;
    }
}
