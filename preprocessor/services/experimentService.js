const repo = require('../repositories/experimentRepository');

module.exports = {
    async get_experiments() {
        return repo.get_all_experiments();
    },

    async get_log() {
        return repo.get_log();
    },

    async get_all_experiment_files(experiment_name) {
        return repo.get_pre_and_post_processed_files(experiment_name);
    },

    async get_post_processed_data(experiment_name) {
        return repo.get_experiment_postprocessed_data(experiment_name);
    },

    async get_directory_content(dir_path, experiment_name) {
        return repo.get_directory_content(dir_path, experiment_name);
    },

    experiment_directory_exists(directory_name) {
        return repo.experiment_directory_exists(directory_name);
    },

    experiment_exists(experiment, activity, user) {
        return repo.experiment_exists(experiment, activity, user);
    },

    create_experiment(experiment, activity, user) {
        return repo.create_experiment(experiment, activity, user);
    },

    create_experiment_path(path) {
        return repo.create_experiment_path(path);
    },

    get_experiment_config(experiment, activity, user) {
        return repo.get_experiment_config(experiment, activity, user);
    },

    experiment_has_video(directory) {
        return repo.experiment_has_video(directory);
    }
}
