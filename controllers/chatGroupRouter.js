var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');

const multerSettings = require('../configs/multerSetup');
var groupModel = require('../models/chatroom');
var userModel = require('../models/userModel');
const auth = require('../middlewares/auth');

//dotENV
require('dotenv').config();

// Multer Storage Setup
var upload = multer({
  storage: multerSettings.chatMessages.myStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return callback(new Error('Only images and pdf are allowed'));
    }
    callback(null, true);
  },
});

// Returns Group Members Details takes group_id as a parameter
router.post('/group/members', auth, function (req, res, next) {
  const { group_id } = req.body;
  groupModel.findById({ _id: group_id }).exec((err, group) => {
    if (err) return res.json({ msg: 'Server Error' });
    else {
      console.log(group.users);
      userModel.find().exec((error, users) => {
        if (error) return res.status(500).json({ msg: 'Server Error' });
        else {
          var group_users = [];
          //LOGIC
          group.users.forEach((groupUser) => {
            users.forEach((user) => {
              if (groupUser == user.email) group_users.push(user);
            });
          });
          res.json({
            msg: 'Group Users Profiles Fetched',
            data: group_users,
          });
        }
      });
    }
  });
});

// create a chat group
router.post('/add', auth, upload.single('img'), function (req, res, next) {
  //Creating New Object of Group
  var newGroup = new groupModel({
    group_name: req.body.group_name,
    users: [req.body.admin],
    admin: req.body.admin,
  });

  userModel.findOne({ email: req.body.admin }).exec((er, userobj) => {
    if (er) return res.json({ msg: 'Server Error' });
    else {
      //append group created message
      var groupCreatedMsg = {
        messageType: 'text',
        messageValue: `${userobj.name} created ${req.body.group_name}`,
        sender: {
          email: 'BOT',
          name: 'BOT',
          userImg: 'BOT',
        },
        timestamp: Date.now(),
      };
      //appending the message
      newGroup.messages.push(groupCreatedMsg);
      newGroup.lastMessageValue = groupCreatedMsg;

      //Handling the Image
      if (req.file) {
        var secure_url = process.env.API_ORIGIN + req.file.path; //image url

        newGroup.img = secure_url;

        //Saving the Group
        newGroup.save((err, group) => {
          if (err) return res.json({ msg: 'Error while Saving the Group' });
          else {
            res.json({
              msg: 'Group Created',
              data: group,
              group_id: group._id,
            });
          }
        });
      }
      //If there is no image file
      else {
        //Saving the Group
        newGroup.save((err, group) => {
          if (err) return res.json({ msg: 'Error while Saving the Group' });
          else {
            res.json({
              msg: 'Group Created',
              data: group,
              group_id: group._id,
            });
          }
        });
      }
    }
  });
});

// Returns Paginated api for chat group messages
router.post('/group/messages', auth, function (req, res, next) {
  const { group_id } = req.body;
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  //fetching the messages
  groupModel.findById({ _id: group_id }).exec((error, group) => {
    if (error) return res.json({ msg: 'Server Error' });
    else {
      var fetchedMessages = group.messages;
      fetchedMessages.reverse();
      var result = {};

      if (endIndex < fetchedMessages.length) {
        result.next = {
          page: page + 1,
          limit: limit,
        };
      }

      if (startIndex > 0) {
        result.previous = {
          page: page - 1,
          limit: limit,
        };
      }

      result.resultMessages = fetchedMessages.slice(startIndex, endIndex);
      res.json({ data: result });
    }
  });
});

//USER LEAVE API REMOVES USER FROM GROUP
router.post('/member/leave', auth, function (req, res, next) {
  const { email, group_id } = req.body;

  groupModel.update(
    { _id: group_id },
    { $pull: { users: email } },
    { safe: true, multi: true },
    function (err, obj) {
      if (err) return res.json({ msg: 'Error While User Leaves ' });
      else {
        res.json({
          msg: 'Success',
        });
      }
    }
  );
});

//add user to group
router.put('/add', auth, function (req, res, next) {
  const update = req.body.user;
  groupModel.findOne({ _id: req.body.group_id }).exec((error, group) => {
    if (error) return res.json({ msg: 'Server Error' });
    else {
      //check if user already exists in group
      if (group.users.indexOf(req.body.user) == -1) {
        //if user doesnot exists add user
        groupModel.update(
          { _id: req.body.group_id },
          { $push: { users: update } },
          function (err, done) {
            if (err) console.log(err);
            if (done) {
              res.json({ msg: 'User Added' });
            }
          }
        );
      } else {
        return res.json({
          msg: 'User already added to group',
        });
      }
    }
  });
});

//Change Group Image (DAILY ROOSTER)
router.put('/add/dailyrooster', auth, upload.single('img'), function (
  req,
  res,
  next
) {
  const { group_id } = req.body;

  groupModel.findById({ _id: group_id }).exec((error, group) => {
    if (error) return res.status(500).json({ msg: 'Server Error' });
    if (!group) return res.status(300).json({ msg: 'Group Doesnot Exist' });
    else {
      if (req.file) {
        //updating db
        var secure_url = process.env.API_ORIGIN + req.file.path; //image Url

        groupModel
          .findByIdAndUpdate({ _id: group_id }, { img: secure_url })
          .exec((err, group) => {
            if (err) return res.json({ msg: 'server error' });
            if (group) {
              res.json({ msg: 'Success' });
            }
          });
      }
    }
  });
});

//Image upload for chat message

router.post('/image/upload', auth, upload.single('img'), function (
  req,
  res,
  next
) {
  if (req.file) {
    var secure_url = process.env.API_ORIGIN + req.file.path;
    return res.json({
      msg: 'Image Uploaded',
      imgUrl: secure_url,
    });
  }
});

// //Get all groups where user is a member
router.get('/filter/:username', auth, function (req, res, next) {
  groupModel
    .find()
    .select('-messages')
    .exec((err, groups) => {
      if (err) res.json({ msg: 'Server Error' });
      if (!groups) res.json({ msg: 'No groups found' });
      else {
        var filtered = groups.filter((group, i) => {
          return group.users.indexOf(req.params.username) !== -1;
        });

        //Sorting according to latest send message

        filtered.sort(function (x, y) {
          return y.lastMessageValue.timestamp - x.lastMessageValue.timestamp;
        });

        res.json({
          msg: 'Filterd groups',
          data: filtered,
        });
      }
    });
});

module.exports = router;
