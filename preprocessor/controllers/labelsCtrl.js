const service = require("../services/LabelService");;

module.exports = {
    /**
     * Get
     * 
     * Returns a list with all 'coletas'.
     */
    get: function (req, res) {
        service.get_labels().then(directories => res.json({ labels: directories }));
    },

    /**
     * Post
     * 
     * Create a new label/coleta.
     */
    create: function (req, res) {
        if (req.body.label === undefined) {
            return res.status(400).json({ status: "Invalid request. Missing 'label' value." });
        }
        
        if (service.label_exists(req.body.label)) {
            return res.status(409).json({ status: "Label not created, label already exists." });
        }

        service.create_label(req.body.label)

        return res.json({ status: "success" });
    },
}