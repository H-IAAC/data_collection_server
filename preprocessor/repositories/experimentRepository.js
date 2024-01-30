const fs = require('fs'),
    path = require('path'),
    utils = require('../utils/utils'),
    consts = require('../utils/consts');

module.exports = {
    /**
     * Get experiment config.
     * 
     * @param {type} experiment         Experiment name.
     * @param {type} activity           Activity name.
     * @param {type} user               User name.
     * @return {type}                   Return a JSON file, if any.
     */
    get_experiment_config(experiment, activity, user) {
        var dir = consts.PREPROCESSING_DIR + experiment + ' [' + activity + '] [' + user + ']' + path.sep;        

        return utils.get_template(dir);;
    },

    /**
     * Create a new experiment.
     * 
     * @param {type} experiment         Experiment name.
     * @param {type} activity           Activity name.
     * @param {type} user               User name.
     * @return {type}                   Return directory path.
     */
    create_experiment(experiment, activity, user) {
        var dir = consts.PREPROCESSING_DIR + experiment + ' [' + activity + '] [' + user + ']' + path.sep;        

        utils.create_directory(dir);

        return dir;
    },

    /**
     * Check if a experiment exists.
     * 
     * @param {type} directory           Experiment directory.
     * @return {type}                   True if experiment exists, otherwise return false.
     */
    experiment_directory_exists(directory) {
        var experiment_dir = consts.PREPROCESSING_DIR + directory + path.sep;

        return fs.existsSync(experiment_dir);
    },

    create_experiment_path(path) {
        var experiment_dir = utils.create_directory(path);
        return fs.existsSync(experiment_dir);
    },

    /**
     * Check if a experiment exists.
     * 
     * @param {type} experiment         Experiment name.
     * @param {type} activity           Activity name.
     * @param {type} user               User name.
     * @return {type}                   True if experiment exists, otherwise return false.
     */
    experiment_exists(experiment, activity, user) {
        var dir = consts.PREPROCESSING_DIR + experiment + ' [' + activity + '] [' + user + ']' + path.sep;

        return fs.existsSync(dir);
    },    

    /**
     * Check if a directory has a video.
     * 
     * @param {type} directory      Directory name.
     * @return {type}               True if has video, otherwise return false.
     */
     experiment_has_video(directory) {
        var ret = false;
        var experiment_dir = consts.PREPROCESSING_DIR + directory + path.sep;

        if (!fs.existsSync(experiment_dir))
            return ret;

        var files = fs.readdirSync(experiment_dir);

        files.forEach(file => {
            if (file.toLowerCase().includes('.mp4'))
                ret = true;
        });

        return ret;
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

            var experiment = 'Experiment';
            var activity = '---';
            var user = 'user'
            var total_number_of_files = 0;
            var isVideoAvailable = false;
            var config = false;

            // Extract experiment and user from directory name
            // directory name example: '<experiment> [<user>]'
            experiment = utils.extract_experiment_from_directory(dir_name);
            user = utils.extract_user_from_directory(dir_name);
            activity = utils.extract_activity_from_directory(dir_name);

            preprocess_files.filter(file => {
                if (path.extname(file).toLowerCase() === '.video') {
                } else if (path.extname(file).toLowerCase() === '.mp4') {
                    total_number_of_files++;
                    isVideoAvailable = true;
                } else if (path.extname(file).toLowerCase() === '.json') {
                    config = true;
                } else if (path.extname(file).toLowerCase() === '.csv') {
                    total_number_of_files++;
                } else if (path.extname(file).toLowerCase() === '.zip') {
                    total_number_of_files++;
                }
            })

            return {
                directory: dir_name,
                experiment: experiment,
                user: user,
                activity: activity,
                time: fs.statSync(pre_dir + dir_name).mtime.getTime(),
                content: total_number_of_files,
                videoAvailable: isVideoAvailable,
                hasPostProcessor: fs.existsSync(post_dir + dir_name),
                error: (fs.existsSync(post_dir + dir_name)) ?
                    fs.readdirSync(post_dir + dir_name).filter(file => { return file.includes('err.log'); }).length : 0,
                configAvailable: config
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
                isVideo: (fileName.split('.').pop() === 'mp4') ? true : false,
                size: (fs.statSync(dir_path + path.sep + fileName).size / (1024 * 1000)).toFixed(2) + " MB"
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
        jsonData.path = consts.POSTPROCESSING_STATIC + path.sep + name + path.sep;

        return jsonData;
    },

    /**
     * Get a list os experiments.
     */
    async list_all_experiments() {
        var pre_dir = consts.PREPROCESSING_DIR;
        var post_dir = consts.POSTPROCESSING_DIR;

        let directories = await fs.promises.readdir(pre_dir);        

        return directories.map(function (dir_name) {
            
            return {
                experiment: utils.extract_experiment_from_directory(dir_name),
                user: utils.extract_user_from_directory(dir_name),
                activity: utils.extract_activity_from_directory(dir_name),
                csv_count: utils.number_of_csv_files_in_directory(pre_dir + dir_name) + utils.number_of_csv_files_in_directory(post_dir + dir_name),
                video: utils.get_directory_video(pre_dir + dir_name)
            }
        }).map(function (v) {
            return v;
        });
    },

    /**
     * Get files from pre and post processor directory.
     */
    async list_experiment_files(query) {
        var only_post = false;

        var pre_dir = consts.PREPROCESSING_DIR + path.sep;
        pre_dir += query.experiment + " [" + query.activity + "] [" + query.user + "]";

        var pos_dir = consts.POSTPROCESSING_DIR + path.sep;
        pos_dir += query.experiment + " [" + query.activity + "] [" + query.user + "]";

        var jsonData = {};
        var content = [];

        if (query.only_post_processor && query.only_post_processor.toLowerCase() == 'true')
            only_post = true;

        if (!fs.existsSync(pre_dir)) {
            return content;
        }

        // Get files from pre processing directory
        if (only_post == false) {
            let files = await fs.promises.readdir(pre_dir);
            files.forEach(function (file) {
                if (path.extname(file).toLowerCase() !== '.video' && path.extname(file).toLowerCase() !== '.json')
                    content.push(file);
            });
        }

        // Get files from post processing directory
        files = await fs.promises.readdir(pos_dir);
        files.forEach(function (file) {
            // Do not return mp4 from post processor directory, as it is already been returned with the
            // pre processor content.
            if (path.extname(file).toLowerCase() !== '.video' && path.extname(file).toLowerCase() !== '.mp4')
                content.push(file);
        });

        jsonData.files = content;

        return jsonData;
    },

    /**
     * Get the video filename, as video file name follow the original name uploaded by the user,
     * this method is used to discover the file name of an experiment.
     */
    async get_video_filename(query) {
        var pre_dir = consts.PREPROCESSING_DIR + path.sep;
        pre_dir += query.experiment + " [" + query.activity + "] [" + query.user + "]";

        var jsonData = {};

        jsonData.video = utils.get_directory_video(pre_dir);

        return jsonData;
    },

    /**
     * Return log content
     * 
     * @return      Log content
     */
    async get_log() {

        return fs.promises.readFile(path.resolve(__dirname, "../log_pre.out"), 'utf8');



        /*return await fs.readFile('log.out', 'utf-8', (err, contents) => {
            if (err) {
                return console.error(err)
            }
  
            // Replace string occurrences
            return contents.replace('\n', '</br>')
        });*/

        /*fs.readFile('log.out', 'utf-8', function (err, contents) {
            if (err) {
              console.log(err);
              return;
            }
            console.log('contents: ' + contents);
            console.log('---------------');
            return contents;
        });*/
    }
}
