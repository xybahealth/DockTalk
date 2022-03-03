const multer = require('multer');

var multerSettings = {
  userProfile: {
    myStorage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, './files/userProfiles');
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + '--' + file.originalname);
      },
    }),
  },
  chatMessages: {
    myStorage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, './files/chatImages');
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + '--' + file.originalname);
      },
    }),
  },
  patientFiles: {
    myStorage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, './files/patientFiles');
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + '--' + file.originalname);
      },
    }),
  },
};

module.exports = multerSettings;
