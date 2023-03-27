const fs = require('fs'),
    logger = require('../utils/logger'),
    consts = require('../utils/consts'),
    { parse } = require("csv-parse"),
    readLastLines = require('read-last-lines'),
    path = require('path'),
    os = require('os');

module.exports = {
    /**
     * @return {json}           Return content from ./config/config.json
     */
    get_config: function () {

        if (fs.existsSync(consts.CONFIG_FILE_PATH)) {
            let rawdata = fs.readFileSync(consts.CONFIG_FILE_PATH);
            return JSON.parse(rawdata);
        }

        logger.error("ERROR! Missing config file: " + consts.CONFIG_FILE_PATH);
        return {};
    },

    /**
     * @param {type} dir_path   Path from the directory to be created.
     * @return {type}           Return true if directory created, false if fails or already exists.
     */
    create_directory: function (dir_path) {
        if (!fs.existsSync(dir_path)) {
            // .. if not, create it.
            logger.info("Creating directory: " + dir_path);
            fs.mkdirSync(dir_path);
        } else {
            return false;
        }

        return true;
    },

    /**
     * Validate csv format and name.
     * 
     * @param {type} file_path   Path to the csv file.
     * @param {type} file_name   Csv file name, note that file_path param may not use the original file name.
     */
    async validate_csv(file_path, file_name) {

        // Filename format must be "<activity>_<on-body_position>__20230110.232916.csv"
        var name_splitted = file_name.split("_");
        var onbody_position = name_splitted[name_splitted.length - 3];
        if (onbody_position === undefined) {
            return "fail";
        }

        // Check if csv content is consistent, this verification is not checking
        // if rows have the correct columns, it is a generic verification.
        return new Promise(function (resolve, reject) {
            fs.createReadStream(file_path)
                .pipe(parse({ delimiter: ";" }))
                .on("data", function (row) {
                    //console.log(row);
                })
                .on("end", function () {
                    //logger.info("CSV file " + file_path + " is valid.");
                    resolve("success");
                })
                .on("error", function (error) {
                    logger.error("CSV file " + file_path + " is invalid. (" + error.message + ")");
                    resolve("fail");
                });
        })
    },

    extract_activity_from_filename(file_name) {
        var activity = file_name.substring(file_name.indexOf('_') + 1, file_name.indexOf('__'));
        activity = activity.substring(0, activity.lastIndexOf('_'));

        return activity;
    },

    extract_experiment_from_directory(directory) {
        // Extract experiment and user from directory name
        // directory name example: '<experiment> [<user>]'
        return directory.substring(0, directory.indexOf(" ["));
    },

    extract_user_from_directory(directory) {
        // Extract experiment and user from directory name
        // directory name example: '<experiment> [<user>]'
        return directory.substring(directory.lastIndexOf(" [") + 2, directory.lastIndexOf("]"));
    },

    extract_activity_from_directory(directory) {
        return directory.substring(directory.indexOf(" [") + 2, directory.indexOf("] "));
    },

    number_of_csv_files_in_directory(directory) {

        if (!fs.existsSync(directory)) return 0;

        let count = 0;
        var files = fs.readdirSync(directory);

        files.forEach(file => {
            if (file.toLowerCase().includes('.csv'))
                count++;
        });

        return count;
    },

    get_directory_video(directory) {

        let ret = 'none';

        if (!fs.existsSync(directory)) return ret;

        var files = fs.readdirSync(directory);        

        files.forEach(file => {
            if (file.toLowerCase().includes('.mp4'))
                ret = file;
        });

        return ret;
    },

    get_template(directory) {

        var content = '{}';

        if (!fs.existsSync(directory)) return content;

        var files = fs.readdirSync(directory);        

        files.forEach(file => {
            if (file.toLowerCase().includes('.json')) {
                content = fs.readFileSync(directory + path.sep + file);
            }
        });

        return content;
    }
}
