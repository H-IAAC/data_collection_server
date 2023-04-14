const service = require("../services/experimentService"),
      auth = require('../services/authenticationService'),
      multer = require("multer"),
      express = require('express'),
      expressLayouts = require('express-ejs-layouts');

const router = express.Router();
router.use(expressLayouts);

/* Login Page */
router.route('/login').get(function (req, res) { res.render("pages/login", {}); });

/* HOME Page */
router.route('/').get(function (req, res) {
    if (!auth.jwt_verify(req.cookies, req.originalUrl))
        return res.render("pages/login", {});

    service.get_experiments().then(exps =>
        res.render("pages/experimentos", { experimentos: exps }));
});

/* Upload Page */
router.route('/upload').get(function (req, res) {
    if (!auth.jwt_verify(req.cookies, req.originalUrl))
        return res.render("pages/login", {});

    res.render("pages/upload", {});
});

/* Experimentos Page */
router.route('/experimentos').get(async (req, res) => {
    if (!auth.jwt_verify(req.cookies, req.originalUrl))
        return res.render("pages/login", {});

    service.get_experiments().then(exps =>
        res.render("pages/experimentos", { experimentos: exps }));
});

/* Download Page */
router.route('/download').get(async (req, res) => {
    if (!auth.jwt_verify(req.cookies, req.originalUrl))
        return res.render("pages/login", {});

    service.get_all_experiment_files(req.query.experiment).then(files =>
        (files.length === 0) ?
            res.render("pages/error", { msg: "No files available." }) :
            res.render("pages/download", { files: files }));
});

/* Watch Page */
router.route('/experimentos/watch').get(async (req, res) => {
    if (!auth.jwt_verify(req.cookies, req.originalUrl))
        return res.render("pages/login", {});

    service.get_post_processed_data(req.query.experiment).then(files =>
        (Object.keys(files).length === 0) ?
            res.render("pages/error", { msg: "Files not found." }) :
            res.render("pages/watch", { data: files}));
});

/* SignIn API */
router.route('/in').post(multer().array(), async (req, res) => {
    const pass = await auth.check_passwd(req.body.password);
    if (pass) {
        res.cookie("JWT", auth.jwt_sign());
        res.status(200);
        res.send("OK");
    } else {
        res.status(200);
        res.send("Invalid password");
    }

});

/* SignOut API */
router.post("/out", (req, res) => {
    res.clearCookie("JWT");
    res.status(200);
    res.redirect('/login');
});

module.exports = router;