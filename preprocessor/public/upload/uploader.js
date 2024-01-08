var progress;

const message = document.getElementById('message');
const progressUpload = document.getElementsByClassName("progressUpload")[0];
const duration = document.getElementById('duration');
const video = document.createElement('video');
const directory = getUrlParameter('directory');

addProgressBar();

function videoSelected() {
    const file = document.getElementById('file').files[0];

    // Clean up UI
    showMessage("");

    // Load video metadata
    video.preload = 'metadata';

    video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        var minutes = Math.floor(video.duration / 60);
        var seconds = Math.round(video.duration - minutes * 60);
        duration.innerHTML = "Video: " + minutes + " min " + seconds + " seg";
    }

    video.src = URL.createObjectURL(file);
}

function getUrlParameter(param) {
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
}

function upload() {
    const file = document.getElementById('file').files[0];

    resetProgressBar();
    var form = new FormData();
    var req = new XMLHttpRequest();

    let endTimestamp = getFileModifiedTimestamp(file);

    req.upload.addEventListener("progress", updateProgress);
    req.open("POST", "/api/video", true);
    form.append("directory", (directory) ? directory : "");
    form.append("file", file);
    form.append("videoduration", video.duration);
    form.append("startTimestamp", (Date.parse(endTimestamp) - (Math.floor(video.duration * 1000))));
    form.append("endTimestamp", Date.parse(endTimestamp));
    form.append("overwrite", false);

    console.log('duration: ' + video.duration);
    console.log('startTimestamp: ' + (Date.parse(endTimestamp) - (Math.floor(video.duration * 1000))));
    console.log('endTimestamp: ' + Date.parse(endTimestamp));

    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            var res = JSON.parse(req.response);
            showMessage(res.status);
        }
    };

    req.send(form);
}

function updateProgress(e) {
    progress.style.width = (((e.loaded / e.total) * 100)) + "%";
}

function resetProgressBar() {
    progress.style.width = "0%";
}

function addProgressBar() {
    var progressBar = document.createElement("div");
    progressBar.className = "progressBar";
    progressUpload.appendChild(progressBar);
    var innerDIV = document.createElement("div");
    innerDIV.className = "progress";
    progressBar.appendChild(innerDIV);
    progress = document.getElementsByClassName("progress")[0];
}

function getFileModifiedTimestamp(file) {

    // Testing for 'function' is more specific and correct, but doesn't work with Safari 6.x
    if (typeof window.FileReader !== 'function' &&
        typeof window.FileReader !== 'object') {
        showMessage("Browser not supported");
        return;
    }

    showMessage("");

    return new Date(file.lastModified);
}

function showMessage(text) {
    message.innerText = text;
}
