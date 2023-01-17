const service = require("../services/LabelService");

const express = require('express'),
    expressLayouts = require('express-ejs-layouts')

const router = express.Router();
router.use(expressLayouts);

/* HOME Page */
router.route('/').get(function (req, res) { res.render("pages/home", {}); });

/* Upload Page */
router.route('/upload').get(function (req, res) { res.render("pages/upload", {}); });

/* Experimentos Page */
router.route('/experimentos').get(async (req, res) => {
    service.get_labels().then(labels =>
        res.render("pages/experimentos", { experimentos: labels }));
});

/* Download Page */
router.route('/experimentos/download').get(async (req, res) => {
    service.get_all_label_files(req.query.label).then(files =>
        (files.length === 0) ?
            res.render("pages/error", { msg: "No files available." }) :
            res.render("pages/download", { files: files }));
});

/* Watch Page */
router.route('/experimentos/watch').get(async (req, res) => {
    service.get_post_processed_data(req.query.label).then(files =>
        (Object.keys(files).length === 0) ?
            res.render("pages/error", { msg: "Files not found." }) :
            res.render("pages/watch", { data: files}));
});

module.exports = router;