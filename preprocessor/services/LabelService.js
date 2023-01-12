const repo = require('../repositories/LabelRepository');

module.exports = {
    async get_labels() {
        return repo.get_all_labels();
    },

    async get_all_label_files(label) {
        return repo.get_pre_and_post_processed_files(label);
    },

    async get_post_processed_data(label) {
        return repo.get_label_postprocessed_data(label);
    },

    async get_directory_content(dir_path, label) {
        return repo.get_directory_content(dir_path, label);
    },

    create_label(label) {
        return repo.create_label(label);
    }
}
