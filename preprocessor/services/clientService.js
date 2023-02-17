const repo = require('../repositories/experimentRepository');

module.exports = {
    async list_all_experiments() {
        return repo.list_all_experiments();
    },

    async list_experiment_files(query) {
        return repo.list_experiment_files(query);
    },

    async get_video_filename(query) {
        return repo.get_video_filename(query);
    }
}
