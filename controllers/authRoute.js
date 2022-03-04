var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
var multer = require('multer');
const jwt = require('jsonwebtoken');

const axios = require('axios');
const { jwtSecret } = require('../configs/secrets');
const auth = require('../middlewares/auth');
const userModel = require('../models/userModel');
const multerSettings = require('../configs/multerSetup');
const { generateOTP } = require('../utils/otpGenerator');
const { default: Axios } = require('axios');

require('dotenv').config();

// Multer Storage Setup
var upload = multer({
  storage: multerSettings.userProfile.myStorage,
});

router.get('/', function (req, res, next) {
  res.send('User/ route');
});

//Register Users

router.post('/register', upload.single('img'), function (req, res, next) {
  
  userModel
    .findOne({
      $or: [
        { email: req.body.email },
        { contact_number: req.body.contact_number },
      ],
    })
    .exec(function (err, done) {
      
      if (err) console.log("Error occured");
      if (done)
        return res.json({
          msg: 'User already exists',
          isOTPSent: false,
        });
      else {
        
        //encrypting the password
        var password1;
        const salt = bcrypt.genSalt(10);
        salt.then((salty) => {
          const hashedPW = bcrypt.hash(req.body.password, salty);

          hashedPW.then((password) => {
            //Generating 4 Digit OTP for SMS Verification

            var newOTP = generateOTP();

            //Creating a new User
            const newUser = new userModel({
              name: req.body.name,
              email: req.body.email,
              qualification: req.body.qualification,

              contact_number: req.body.contact_number,
              password: password,
              role: req.body.role,

              speciality: req.body.speciality,

              isNumberVerified: false,
              phoneNumberOTP: newOTP,
            });

            if (req.file) {
              newUser.img = process.env.API_ORIGIN + req.file.path;
            } else {
              newUser.img =
                process.env.API_ORIGIN + 'images/defaultProfile.png';
            }

            //saving the user
            newUser.save(function (error, user) {
              if (error) return res.json({ msg: 'Server Error', error: error });
              else {
                // //my own code
                // res.status(200).json({"msg":"New User created"});
                // return;
                //https://aakashsms.com/admin/public/sms/v3/send

                // Sending OTP to Contact Number
               axios.post(process.env.AAKASH_SMS_API, {
                    auth_token: process.env.AAKASH_SMS_AUTH_TOKEN,
                    to: req.body.contact_number,
                    text: `Your Mobile Verification Code for DocTalk App is ${newOTP}`,
                  })
                  .then((response) => {
                    //If error occurs
                    if (response.error) {
                      return res.json({
                        msg: response.message,
                      });
                    } else {
                      res.json({
                        isOTPSent: true,
                        msg: 'Verfication Code Sent to Your Mobile Number',
                        user_id: user._id,
                      });
                    }
                  });
              }
            });
          });
        });
      }
    });

}

);

//Verify Contact Number while registration
router.post('/verify/contact/otp/:id', function (req, res, next) {
  const { otp, device_id } = req.body;

  userModel.findById({ _id: req.params.id }).exec((err, user) => {
    if (err)
      return res.json({
        msg: 'Server Error',
        error: err,
      });
    else if (!user) {
      return res.json({
        msg: 'No User Found',
      });
    } else {
      // Check if otp matches
      if (user.phoneNumberOTP == otp) {
        //generating token

        //payload for jwt
        const payload = {
          user: {
            id: user._id,
          },
        };
        //jwt sign
        jwt.sign(payload, jwtSecret, function (error, token) {
          if (error) res.json({ msg: 'Server Error', error: error });
          else {
            var update = {
              token: token,
              device_id: req.body.device_id,
            };

            //Updating the device id and token

            userModel.update(
              { email: user.email },
              {
                $push: { device_id: update },
                $set: { isNumberVerified: true, phoneNumberOTP: null },
              },
              { new: true },
              function (err, done) {
                if (err)
                  return res.json({
                    msg: 'Server Error While updating device Id',
                  });
                else {
                  res.json({
                    msg: 'Contact Number Verified successfully',
                    token: token,
                    user: user,
                  });
                }
              }
            );
          }
        });
      } else {
        return res.json({ msg: 'Invalid OTP' });
      }
    }
  });
});

//LOGIN ROUTE
router.post('/login', function (req, res, next) {
  //finding the user
  userModel
    .findOne({
      $or: [{ email: req.body.email }, { contact_number: req.body.email }],
    })
    .exec(function (error, user) {
      if (error) return res.json({ msg: 'Server Error' });
      if (!user) return res.json({ msg: 'Invalid Credentials' });
      else {
        const isMatch = bcrypt.compare(
          req.body.password,
          user.password,
          function (error, done) {
            if (error) next(error);
            if (done == true) {
              if (user.isNumberVerified == true) {
                const payload = {
                  user: {
                    id: user._id,
                  },
                };

                jwt.sign(payload, jwtSecret, function (error, token) {
                  if (error) next(error);
                  else {
                    //Push device id object
                    var update = {
                      token: token,
                      device_id: req.body.device_id,
                    };

                    userModel.update(
                      { email: user.email },
                      { $push: { device_id: update } },
                      function (err, done) {
                        if (err)
                          return res.json({
                            msg: 'Server Error While updating device Id',
                          });
                        else {
                          res.json({
                            token: token,
                            user: user._id,
                            email: user.email,
                            contactNumber: user.contact_number,
                            isNumberVerified: user.isNumberVerified,
                          });
                        }
                      }
                    );
                    //todo
                  }
                });
              } else {
                return res.json({
                  isNumberVerified: user.isNumberVerified,
                  msg: 'Phone Number not verified',
                  user: user._id,
                  contactNumber: user.contact_number,
                });
              }
            } else {
              res.status(401).json({
                msg: 'Invalid Credentials',
              });
            }
          }
        );
      }
    });
});

//Generates OTP for Forgot password
router.post('/forgot-password/generate/otp', function (req, res, next) {
  userModel
    .findOne({ contact_number: req.body.contact_number })
    .exec((error, user) => {
      if (error) return res.json({ msg: 'Server Error', error: error });
      else if (!user) {
        return res.json({
          msg: 'Contact Number not registered',
          isOTPSent: false,
        });
      } else {
        var newOTP = generateOTP();
        //adding otp to user Detail
        userModel.update(
          { contact_number: req.body.contact_number },
          { $set: { forgotPasswordOTP: newOTP } },
          function (err, done) {
            if (err)
              return res.json({
                msg: 'Server Error',
                error: err,
              });
            else {
              //Sending OTP to user
              axios
                .post(process.env.AAKASH_SMS_API, {
                  auth_token: process.env.AAKASH_SMS_AUTH_TOKEN,
                  to: user.contact_number,
                  text: `Your forgot password verfication Code for DocTalk App is ${newOTP}`,
                })
                .then((response) => {
                  //If error occurs
                  if (response.error == true) {
                    return res.json({
                      msg: response.message,
                    });
                  } else {
                    res.json({
                      isOTPSent: true,
                      msg: 'Forgot Password OTP Sent to Your Mobile Number',
                      user_id: user._id,
                    });
                  }
                });
            }
          }
        );
      }
    });
});

//Resend OTP for Registration
router.post('/user/registration/otp/resend', function (req, res, next) {
  const { contact_number } = req.body;
  var newOTP = generateOTP();
  //updating new otp to db
  userModel.update(
    { contact_number: contact_number },
    { $set: { phoneNumberOTP: newOTP } },
    function (err, done) {
      if (err)
        return res.json({
          msg: 'Server Error ',
          error: err,
        });
      else {
        //Sending OTP to user
        axios
          .post(process.env.AAKASH_SMS_API, {
            auth_token: process.env.AAKASH_SMS_AUTH_TOKEN,
            to: contact_number,
            text: `Your Mobile verification Code for DocTalk App is ${newOTP}`,
          })
          .then((response) => {
            //If error occurs
            if (response.error == true) {
              return res.json({
                msg: response.message,
              });
            } else {
              res.json({
                isOTPSent: true,
                msg: 'User Registration OTP Sent to Your Mobile Number',
              });
            }
          });
      }
    }
  );
});

//Change Password from Forgot password
router.post('/forgot-password/change-password', function (req, res, next) {
  const { newPassword, confirmPassword, otp, id } = req.body;
  if (newPassword === confirmPassword) {
    //Finding user
    userModel.findById({ _id: id }).exec((error, user) => {
      if (error)
        return res.json({
          msg: 'Server Error',
          error: error,
        });
      else {
        if (user.forgotPasswordOTP === otp) {
          //Change user Password
          //encrypting the password

          const salt = bcrypt.genSalt(10);
          salt.then((salty) => {
            const hashedPW = bcrypt.hash(confirmPassword, salty);

            hashedPW.then((changed_pw) => {
              //updating hashed password to db
              userModel.update(
                { _id: id },
                { $set: { password: changed_pw, forgotPasswordOTP: null } },
                function (err, done) {
                  if (err)
                    return res.json({
                      msg: 'Server Error',
                    });
                  else {
                    res.json({ msg: 'Password Changed !' });
                  }
                }
              );
            });
          });
        } else {
          return res.json({
            msg: 'Wrong OTP',
          });
        }
      }
    });
  } else {
    return res.json({ msg: 'Password doesnot match' });
  }
});

//LOGOUT ROUTE
router.post('/logout', auth, function (req, res, next) {
  //Finding the user and updating
  userModel.update(
    { _id: req.user.user.id },
    { $pull: { device_id: { token: req.header('x-access-token') } } },
    { safe: true, multi: true },
    function (err, obj) {
      if (err) return res.json({ msg: 'Error While Logging Out ' });
      else {
        res.json({
          msg: 'Logged Out',
        });
      }
    }
  );
});

module.exports = router;
