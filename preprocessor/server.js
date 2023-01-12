// app dependencies
const express = require('express'),
    routes = require('./routes/route'),
    views = require('./routes/views'),
    logger = require('./utils/logger'),
    utils = require('./utils/utils'),
    consts = require('./utils/consts'),
    bodyParser = require('body-parser'),
    path = require('path'),
    favicon = require('serve-favicon');

var serverPort = 3000;

// app setup
const app = express();

// parse command line args
const args = process.argv.slice(2);

if (args[0] && args[1] && args[2]) {
    serverPort = args[0];
    consts.PREPROCESSING_DIR = args[1];
    consts.POSTPROCESSING_DIR = args[2];

    utils.create_directory(consts.PREPROCESSING_DIR);
} else {
    console.log("Usage:");
    console.log("  node server.js [PORT] [PRE_PROCESSING_DIR] [POST_PROCESSING_DIR]");
    console.log("");
    return;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', routes);
app.use('/', views);

// Static Files
app.use(express.static(path.join(__dirname + path.sep + 'public')));
app.use(express.static(path.join(__dirname + path.sep + path.basename(consts.PREPROCESSING_DIR))));
app.use(express.static(path.join(__dirname + path.sep + path.basename(consts.POSTPROCESSING_DIR))));
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

// Set views directory path
app.set('views', path.join(__dirname, 'views'));

// Set Templating Engine
app.set('view engine', 'ejs');

/**
 * set app to listen on port 'serverPort'
 */
app.listen(serverPort, function () {
    console.log("--- H-IAAC - Viewer Tool ---");
    logger.info("server is running on port " + serverPort);

    logger.info("  preprocessor_path: " + consts.PREPROCESSING_DIR);
    logger.info("  postprocessor_path: " + consts.POSTPROCESSING_DIR);
});

