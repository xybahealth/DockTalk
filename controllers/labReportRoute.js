var express = require('express');
var router = express.Router();
var cloudinary = require('cloudinary');
var multer = require('multer');
var path = require('path');
const myStorage = require('../configs/multerSetup');
var reportModel = require('../models/labReports');

require('dotenv').config();

// CLoudinary Config
require('../configs/cloudinary');

// Multer Storage Setup
var upload = multer({
  storage: myStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (
      ext !== '.png' &&
      ext !== '.jpg' &&
      ext !== '.gif' &&
      ext !== '.jpeg' &&
      ext !== '.pdf' &&
      ext !== '.docx'
    ) {
      return callback(new Error('Only images and pdf are allowed'));
    }
    callback(null, true);
  },
});

//get am or pm
function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

//find all reports
router.get('/reports/all', function (req, res, next) {
  reportModel.find().exec((error, reports) => {
    if (error) return res.json({ msg: 'Server Error' });
    else {
      res.json({ msg: 'Lab Reports Fetched', data: reports });
    }
  });
});
//find by id
router.get('/report/:id', function (req, res, next) {
  reportModel.findById({ _id: req.params.id }).exec((error, result) => {
    if (error) res.json({ msg: 'Server Error' });
    else {
      res.json({ msg: 'Reports Fetched', data: result });
    }
  });
});

//add report by id
router.post('/add', upload.single('report'), function (req, res, next) {
  var newReport = new reportModel({
    patient_bed_no: req.body.patient_bed_no,
    report_title: req.body.report_title,
    uploaded_by: req.body.uploaded_by,
  });
  //last updated
  var dateObj = new Date();
  var month = dateObj.getUTCMonth() + 1;
  var day = dateObj.getUTCDate();
  var year = dateObj.getUTCFullYear();

  var uploadedDateTime =
    formatAMPM(new Date()) + year + '/' + month + '/' + day;

  //CLoudinary upload
  const result = cloudinary.v2.uploader.upload(req.file.path, {
    folder: 'medical-reports',
    use_filename: true,
  });
  result.then((success) => {
    newReport.uploaded_at = uploadedDateTime;
    //Report File Object
    var reportFile = {
      url: success.secure_url,
      public_id: success.public_id,
    };
    newReport.lab_report = reportFile;

    //Saving the report
    newReport.save((err, done) => {
      if (err) return res.json({ msg: 'Cloudinary error' });
      else {
        res.json({
          msg: 'Report Added',
          data: done,
        });
      }
    });
  });
  result.catch((error) => {
    return res.json({
      msg: 'Error',
      data: error,
    });
  });
});

module.exports = router;
