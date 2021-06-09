var express = require("express"); //Express Web Server
var busboy = require("connect-busboy"); //middleware for form/file upload
var path = require("path"); //used for file path
var fs = require("fs-extra"); //File System - for file manipulation
var ffmpeg = require('fluent-ffmpeg');
const exiftool = require('node-exiftool');
const ep = new exiftool.ExiftoolProcess();
var config = require('./config');
const tesseract = require('node-tesseract-ocr');

function auth(key, fn) {
  if (config.api_key === key) {
    fn(null, { id: "1", name: "GP_" });
  } else {
    fn(null, null);
  }
}

const tesseractConfig = {
  lang: "eng",
  oem: 1,
  psm: 3
};

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
        recogniseText(`${location}/${fileName}`);
      });
    }
    catch(error) {
      console.log(error);
      reject(error);
      return;
    }
  });
};

async function recogniseText(imgLoc) {
  let keywords = ['Gary Portal'];
  tesseract.recognize(imgLoc, tesseractConfig)
    .then(text => {
      text = text.toLowerCase();
      const covidWords = ["covid", "c0vid", "c0v1d", "cov1d", "covid-19", "covid 19", "coronavirus", "coronavirus 19", "cov-sars-2", "cov-sars", "cov sars", "cov sars 2", "virus"];
      const vaccineWords = ["vaccine", "covid vaccine", "covid jab", "vax", "anti-vax", "anti vax", "vaxcine"];
      if (covidWords.some(word => text.includes(word))) {
        keywords.push('detectedCovid');
      }
      if (vaccineWords.some(word => text.includes(word))) {
        keywords.push('detectedVaccine');
      }
    })
    .catch(error => {
      console.log(error);
    })
    .finally(() => {
      ep
      .open()
      .then(() => ep.writeMetadata(imgLoc, {
        all: '',
        comment: 'Gary Portal',
        'Keywords+': keywords,
      }, ['overwrite_original']))
      .then(console.log, console.error)
      .then(() => ep.close())
      .catch(console.error);
    });
}

app.use('/', function (req, res, next) {
  console.log("received request: " + req.originalUrl + "" + req.method);
  next();
});

var server = app.listen(3030, function () {
  console.log("Listening on port %d", server.address().port);
});
