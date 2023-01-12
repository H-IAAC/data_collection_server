const fs = require('fs'),
    path = require('path'),
    utils = require('../utils/utils'),
    consts = require('../utils/consts');

module.exports = {
    /**
     * Create a new label.
     * 
     * @param {type} label          Label name.
     * @return {type}               Return the label directory path.
     */
    create_label(label) {
        var label_dir = consts.PREPROCESSING_DIR + label + path.sep;

        utils.create_directory(label_dir);

        return label_dir;
    },

    /**
     * Check if a label exists.
     * 
     * @param {type} label          Label name.
     * @return {type}               True if label exists, otherwise return false.
     */
    label_exists(label) {
        var label_dir = consts.PREPROCESSING_DIR + label + path.sep;

        return fs.existsSync(label_dir);
    },

    /**
     * Get info from all labels available.
     * 
     * @return {array}      Array of objects containing info regarding all labels available.
     */
    async get_all_labels() {
        var pre_dir = consts.PREPROCESSING_DIR;
        var post_dir = consts.POSTPROCESSING_DIR;

        var files = await fs.promises.readdir(pre_dir);

        return files.map(function (fileName) {
            return {
                label: fileName,
                time: fs.statSync(pre_dir + fileName).mtime.getTime(),
                content: fs.readdirSync(pre_dir + fileName).filter(file => { return path.extname(file).toLowerCase() !== '.video'; }).length,
                videoAvailable: fs.readdirSync(pre_dir + fileName).filter(file => { return path.extname(file).toLowerCase() === '.mp4'; }),
                error: (fs.existsSync(post_dir + fileName)) ?
                            fs.readdirSync(post_dir + fileName).filter(file => { return file.includes('err.log'); }).length : 0
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
     * Get pre and post-processed files from a label.
     * 
     * @param {type} label          Label name.
     * @return {Object}             JSON with 'pre' and 'post' fields, containing all files related to the label.
     */
    async get_pre_and_post_processed_files(label) {
        var files = {};
        files.pre = await module.exports.get_directory_content(consts.PREPROCESSING_DIR + path.sep + label, label);
        files.post = await module.exports.get_directory_content(consts.POSTPROCESSING_DIR + path.sep + label, label);
        return files;
    },

    /**
     * Get post-processed video and csv from a label.
     * 
     * @param {type} dir_path       Directory where to look for files.
     * @param {type} label          Label name.
     * @return {array}              Array with all content (files) in a directory.
     */
    async get_directory_content(dir_path, label) {
        if (!fs.existsSync(dir_path)) {
            return [];
        }

        let files = await fs.promises.readdir(dir_path);

        return files.map(function (fileName) {
            return {
                name: fileName,
                path: path.sep + label + path.sep + fileName,
                isVideo: (fileName.split('.').pop() === 'mp4') ? true : false
            }
        }).map(function (v) {
            return v;
        });
    },

    /**
     * Get post-processed video and csv from a label.
     * 
     * @param {type} label      Label name.
     * @return {Object}         JSON object with video, csv and path info.
     */
    async get_label_postprocessed_data(label) {
        var root = consts.POSTPROCESSING_DIR + path.sep + label
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
        jsonData.path = path.sep + label + path.sep;

        return jsonData;
    }
}
