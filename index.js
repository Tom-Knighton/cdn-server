var express = require("express"); //Express Web Server
var busboy = require("connect-busboy"); //middleware for form/file upload
var path = require("path"); //used for file path
var fs = require("fs-extra"); //File System - for file manipulation
var ffmpeg = require('fluent-ffmpeg');
var config = require('./config');

function auth(key, fn) {
  if (config.api_key === key) {
    fn(null, { id: "1", name: "GP_" });
  } else {
    fn(null, null);
  }
}
var app = express();
app.use(busboy());
app.use(express.static(path.join(__dirname, "public")));
app.use(require("apikey")(auth, "my realm"));

app.route("/gpchatfeed/:chatuuid").post(function (req, res, next) {
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on("file", function (fieldname, file, filename) {
    console.log("Uploading: " + filename);
    //Path where image will be uploaded
    fs.promises.mkdir(`/var/www/cdn/GaryPortal/Chat/${req.params.chatuuid}`, {
      recursive: true,
    });
    fstream = fs.createWriteStream(
      `/var/www/cdn/GaryPortal/Chat/${req.params.chatuuid}/${filename}`
    );
    file.pipe(fstream);
    fstream.on("close", function () {
      console.log("Upload Finished of " + filename);
      res.redirect(
        `https://cdn.tomk.online/GaryPortal/Chat/${req.params.chatuuid}/${filename}`
      );
    });
  });
});

app.route("/gpprofile/:uuid").post((req, res, next) => {
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on("file", function (fieldname, file, filename) {
    console.log("Uploading: " + filename);
    //Path where image will be uploaded
    fs.promises.mkdir(
      `/var/www/cdn/GaryPortal/ProfilePics/${req.params.uuid}`,
      { recursive: true }
    );
    fstream = fs.createWriteStream(
      `/var/www/cdn/GaryPortal/ProfilePics/${req.params.uuid}/${filename}`
    );
    file.pipe(fstream);
    fstream.on("close", function () {
      console.log("Upload Finished of " + filename);
      res.redirect(
        `https://cdn.tomk.online/GaryPortal/ProfilePics/${req.params.uuid}/${filename}`
      );
    });
  });
});

app.route("/gpfeed/media").post((req, res, next) => {
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on("file", function (fieldname, file, filename) {
    console.log("Uploading: " + filename);
    //Path where image will be uploaded
    fs.promises.mkdir(`/var/www/cdn/GaryPortal/Feed/Attachments/Media`, {
      recursive: true,
    });
    fstream = fs.createWriteStream(
      `/var/www/cdn/GaryPortal/Feed/Attachments/Media/${filename}`
    );
    file.pipe(fstream);
    fstream.on("close", function () {
      console.log("Upload Finished of " + filename);
      res.redirect(
        `https://cdn.tomk.online/GaryPortal/Feed/Attachments/Media/${filename}`
      );
    });
  });
});

app.route("/gpfeed/aditlog").post((req, res, next) => {
  var fstream;
  req.pipe(req.busboy);
  console.log("here");
  req.busboy.on("file", function (fieldname, file, filename) {
    console.log("Uploading: " + filename);
    //Path where image will be uploaded
    fs.promises.mkdir(`/var/www/cdn/GaryPortal/Feed/Attachments/AditLogs`, {
      recursive: true,
    });
    fstream = fs.createWriteStream(
      `/var/www/cdn/GaryPortal/Feed/Attachments/AditLogs/${filename}`
    );
    file.pipe(fstream);

    fstream.on("close", function () {
      console.log("Upload Finished of " + filename);
      var proc = new ffmpeg(`/var/www/cdn/GaryPortal/Feed/Attachments/AditLogs/${filename}`).takeScreenshots(
        {
          count: 1,
          timemarks: ["1"], // number of seconds
          filename: `${filename}.jpg`
        },
        "/var/www/cdn/GaryPortal/Feed/Attachments/AditLogs/Thumbs",
        function (err) {
          console.log("screenshots were saved");
        }
      );
      res.redirect(
        `https://cdn.tomk.online/GaryPortal/Feed/Attachments/AditLogs/${filename}`
      );
    });
  });
});

var server = app.listen(3030, function () {
  console.log("Listening on port %d", server.address().port);
});
