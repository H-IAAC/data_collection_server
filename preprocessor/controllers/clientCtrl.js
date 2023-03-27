const service = require("../services/clientService");
const converter = require('json-2-csv');

module.exports = {
    /**
     * API: /list_all_experiments
     * 
     * Get a csv with data from all experiments available.
     * Note: It returns an CSV, instead of JSON, to turn it easier for
     *       python library to parse it.
     */
    async list_experiments (req, res) {
        converter.json2csv(await service.list_all_experiments(), (err, csv) => {
            if (err) {
              throw err
            }
            res.send(csv);
          })       
    },

    /**
     * API: /list_experiment_files
     * 
     * Get a JSON with list of files related to an experiment.
     * 
     */
    async list_experiment_files (req, res) {
        var files = await service.list_experiment_files(req.query);
        res.json(files);
    },

    /**
     * API: /get_video_filename
     * 
     * Get a JSON with the video file name related to an experiment.
     * 
     */
    async get_video_filename (req, res) {
        var video = await service.get_video_filename(req.query);
        res.json(video);
    }
}