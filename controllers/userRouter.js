var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');

var axios = require('axios');

const { default: Axios } = require('axios');
var multer = require('multer');
var path = require('path');
const groupModel = require('../models/chatroom');
const multerSettings = require('../configs/multerSetup');
var userModel = require('../models/userModel');
const auth = require('../middlewares/auth');
const { response, json } = require('express');

require('dotenv').config();

// Multer Storage Setup
var upload = multer({
  storage: multerSettings.userProfile.myStorage,
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

//Get All users
router.get('/', auth, function (req, res, next) {

  userModel.find().exec((err, users) => {
    if (err)
      return res.json({
        msg: 'Server Error',
      });
    else {
      return res.json({
        msg: 'User Fetched !',
        data: users,
      });
    }
  });
});

//Sends Push Notification to Group Users When Message Is Emitted
router.post('/send/notification/group_users/', function (req, res, next) {
  const { room, email, name, messageValue, messageType, roomName } = req.body;
  groupModel
    .findById({ _id: room })
    .select('users')
    .exec((err, data) => {
      if (err) return res.json({ isSuccess: false, msg: 'Serve Error' });
      else {
        //filter email
        var emails = [];
        data.users.forEach((user) => {
          if (user !== email) emails.push(user);
        });

        userModel
          .find({
            email: { $in: emails },
          })
          // .select('device_id')
          .exec((error, userProfiles) => {
            if (error)
              return res.json({ isSuccess: false, msg: 'Server Error' });
            else {
              //filtering the device id
              var devices_id = [];
              userProfiles.forEach((profile) => {
                profile.device_id.forEach((tok_id) => {
                  devices_id.push(tok_id.device_id);
                });
              });
              //Configuring Notification
              const headers = {
                'Content-Type': 'application/json',
                Authorization: process.env.PUSH_NOTIFICATION_AUTHORIZATION_KEY,
              };

              devices_id.forEach((id) => {
                switch (messageType) {
                  case 'text':
                    axios
                      .post(
                        process.env.PUSH_NOTIFICATION_URL,
                        {
                          to: id,
                          notification: {
                            body: `${name} :: ${messageValue}`,
                            title: roomName,
                            content_available: true,
                            priority: 'high',
                          },
                          data: {
                            body: messageValue,
                            title: roomName,
                            content_available: true,
                            priority: 'high',
                          },
                        },
                        {
                          headers: headers,
                        }
                      )
                      .then((done) => {
                        //something
                      })
                      .catch((err) => {
                        //Handle error
                      });
                    break;

                  case 'img':
                    axios
                      .post(
                        process.env.PUSH_NOTIFICATION_URL,
                        {
                          to: id,
                          notification: {
                            body: `${name} sent a photo`,
                            title: roomName,
                            content_available: true,
                            priority: 'high',
                          },
                          data: {
                            body: `${name} sent a photo`,
                            title: roomName,
                            content_available: true,
                            priority: 'high',
                          },
                        },
                        {
                          headers: headers,
                        }
                      )
                      .then((done) => {
                        //something
                      })
                      .catch((err) => {
                        //Handle error
                      });
                    break;
                  case 'patient':
                    axios
                      .post(
                        process.env.PUSH_NOTIFICATION_URL,
                        {
                          to: id,
                          notification: {
                            body: JSON.parse(messageValue).message,
                            title: roomName,
                            content_available: true,
                            priority: 'high',
                          },
                          data: {
                            body: JSON.parse(messageValue).message,
                            title: roomName,
                            content_available: true,
                            priority: 'high',
                          },
                        },
                        {
                          headers: headers,
                        }
                      )
                      .then((done) => {
                        //something
                      })
                      .catch((err) => {
                        //Handle error
                      });
                    break;

                  default:
                  // Do Something
                }
              });

              res.json({
                isSuccess: true,
                msg: 'Notification Sent',
              });
            }
          });
      }
    });
});

//Returns Associated user Profiles that matches numbers
router.post('/numbers/associated', auth, function (req, res, next) {
  const { numbers } = req.body;
  console.log(numbers);
  if (numbers) {
    userModel.find().exec(function (err, users) {
      if (err) return res.status(500).json({ msg: 'Server Error' });
      if (!users) return res.json({ msg: 'No users Found' });
      else {
        var relatedUsers = [];
        numbers.forEach((number) => {
          users.forEach((user) => {
            if (number == user.contact_number) relatedUsers.push(user);
          });
        });

        res.status(200).json({
          msg: 'Associated Users Profiles Fetched',
          data: relatedUsers,
        });
      }
    });
  }
});

//Returns Associated user Profile that matches email
router.post('/email/associated', auth, function (req, res, next) {
  const { email } = req.body;

  if (email) {
    userModel.findOne({ email: email }).exec(function (err, user) {
      if (err) return res.status(500).json({ msg: 'Server Error' });
      if (!user) return res.json({ msg: 'No user Found' });
      else {
        res.status(200).json({
          msg: 'Associated User Profile Fetched',
          data: user,
        });
      }
    });
  }
});

//Change User Details
router.put('/user/change/profile/details', auth, function (req, res, next) {
  userModel
    .findByIdAndUpdate({ _id: req.user.user.id }, req.body)
    .exec((error, done) => {
      if (error)
        return res.json({
          isSuccess: false,
          msg: 'Server Error',
        });
      else {
        res.json({
          isSuccess: true,
          msg: 'User detail Changed',
          data: done,
        });
      }
    });
});

//Change User Profile Image
router.put('/user/change/profile-image', auth, upload.single('img'), function (
  req,
  res,
  next
) {
  if (req.file) {
    var secure_url = process.env.API_ORIGIN + req.file.path;
    //updating the user image to db
    userModel.update(
      { _id: req.user.user.id },
      { $set: { img: secure_url } },
      function (err, done) {
        if (err)
          return res.json({
            isSuccess: false,
            msg: 'Server Error',
            response: err,
          });
        else {
          return res.json({
            isSuccess: true,
            msg: 'Profile Image Changed !',
            response: done,
          });
        }
      }
    );
  } else {
    return res.json({
      isSuccess: false,
      msg: 'No Image Selected',
    });
  }
});

//Change User Password
router.put('/user/change-password', auth, function (req, res, next) {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  //check if user oldpassword is correct
  userModel.findById({ _id: req.user.user.id }).exec((error, user) => {
    if (error) return res.json({ msg: 'Server Error' });
    else {
      const isMatch = bcrypt.compare(oldPassword, user.password, function (
        error,
        done
      ) {
        if (error) return res.json({ msg: 'Server Error' });
        else if (done == true) {
          //Check if newpassword and confirm password matches
          if (newPassword === confirmPassword) {
            //Encrypting the Password
            const salt = bcrypt.genSalt(10);
            salt.then((salty) => {
              const hashedPW = bcrypt.hash(confirmPassword, salty);

              hashedPW.then((changed_pw) => {
                //updating hashed password to db
                userModel.update(
                  { _id: req.user.user.id },
                  { $set: { password: changed_pw } },
                  function (err, done) {
                    if (err)
                      return res.json({
                        msg: 'Server Error',
                      });
                    else {
                      res.json({ isSuccess: true, msg: 'Password Changed !' });
                    }
                  }
                );
              });
            });
          } else {
            return res.json({
              isSuccess: false,
              msg: 'New Password and Confirm-Password doesnot Match',
            });
          }
        } else {
          res.json({
            isSuccess: false,
            msg: 'Old Password doesnot Match',
          });
        }
      });
    }
  });
});

//modify user role to provide access
router.post('/acceptuser/:id', auth, function (req, res, next) {
  var update = { role: 2 };
  //finding the user
  userModel
    .findByIdAndUpdate({ _id: req.params.id }, update)
    .exec((err, user) => {
      if (err) return res.json({ msg: 'server error' });
      if (user) {
        res.json({ msg: 'User Role Changed !' });
      }
    });
});

//Get User by id
router.get('/user/:id', auth, function (req, res, next) {
  userModel.findById({ _id: req.params.id }).exec((err, user) => {
    if (err)
      return res.json({
        msg: 'Server Error',
      });
    else {
      return res.json({
        msg: 'User Fetched !',
        data: user,
      });
    }
  });
});
module.exports = router;
