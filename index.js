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
  req.pipe(req.busboy);
  req.busboy.on("file", function (fieldname, file, filename) {
    writeToLocation(file, filename, `/var/www/cdn/GaryPortal/Chat/${req.params.chatuuid}/Attachments`, `GaryPortal/Chat/${req.params.chatuuid}/Attachments`)
      .then(url => res.redirect(url))
      .catch(error => res.send(error, 404));
  });
});

app.route("/gpprofile/:uuid").post((req, res, next) => {
  req.pipe(req.busboy);
  req.busboy.on("file", function (fieldname, file, filename) {
    writeToLocation(file, filename, `/var/www/cdn/GaryPortal/ProfilePics/${req.params.uuid}`, `GaryPortal/ProfilePics/${req.params.uuid}`)
      .then(url => res.redirect(url))
      .catch(error => res.send(error, 404));
  });
});

app.route("/gpfeed/media").post((req, res, next) => {
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on("file", function (fieldname, file, filename) {
    writeToLocation(file, filename, `/var/www/cdn/GaryPortal/Feed/Attachments/Media`, `GaryPortal/Feed/Attachments/Media`)
      .then(url => res.redirect(url))
      .catch(error => res.send(error, 404));
  });
});

app.route("/gpfeed/aditlog").post((req, res, next) => {
  var fstream;
  req.pipe(req.busboy);
  console.log("here");
  req.busboy.on("file", function (fieldname, file, filename) {
    writeToLocation(file, filename, `/var/www/cdn/GaryPortal/Feed/Attachments/AditLogs`, `GaryPortal/Feed/Attachments/AditLogs`)
      .then(url => {
        var proc = new ffmpeg(`/var/www/cdn/GaryPortal/Feed/Attachments/AditLogs/${filename}`).takeScreenshots(
          {
            count: 1,
            timemarks: ["1"],
            filename: `${filename}.jpg`
          },
          "/var/www/cdn/GaryPortal/Feed/Attachments/AditLogs/Thumbs", function(err) {
            console.log("Thumbnails saved for AditLog");
          }
        );
        res.redirect(url);
      })
      .catch(error => res.send(error, 404));
  });
});

function writeToLocation(file, fileName, location, urlLocation) {
  return new Promise((resolve, reject) => {
    try {
      fs.promises.mkdir(location, {
        recursive: true
      });
      let fstream = fs.createWriteStream(`${location}/${fileName}`);
      file.pipe(fstream);
      fstream.on("close", function() {
        console.log(`Upload finished of ${fileName}`);
        resolve(`https://cdn.tomk.online/${urlLocation}/${fileName}`);
      });
    }
    catch(error) {
      console.log(error);
      reject(error);
      return;
    }
  });
};

app.use('/', function (req, res, next) {
  console.log("received request: " + req.originalUrl + "" + req.method);
  next();
});

var server = app.listen(3030, function () {
  console.log("Listening on port %d", server.address().port);
});
