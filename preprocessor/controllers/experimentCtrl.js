const service = require("../services/experimentService");;

module.exports = {
    /**
     * Get
     * 
     * Returns a list with all 'experimentos'.
     */
    get: function (req, res) {
        service.get_experiments().then(directories => res.json({ experiment: directories }));
    },

    /**
     * Post
     * 
     * Create a new experiment.
     */
    create: function (req, res) {
        if (req.body.experiment === undefined) {
            return res.status(400).json({ status: "Invalid request. Missing 'experiment' value." });
        }
        
        if (service.experiment_exists(req.body.experiment)) {
            return res.status(409).json({ status: "Experiment not created, experiment already exists." });
        }

        service.create_experiment(req.body.experiment)

        return res.json({ status: "success" });
    },
}