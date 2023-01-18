const repo = require('../repositories/experimentRepository');

module.exports = {
    async get_experiments() {
        return repo.get_all_experiments();
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

    experiment_exists(experiment_name) {
        return repo.experiment_exists(experiment_name);
    },

    create_experiment(experiment_name) {
        return repo.create_experiment(experiment_name);
    }
}
