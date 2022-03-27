var createError = require('http-errors');
var express = require('express');
var path = require('path');
const http = require('http');
var cookieParser = require('cookie-parser');
var axios = require('axios');
var logger = require('morgan');
var cors = require('cors');
const groupModel = require('./models/chatroom');
const patientsRouter = require('./controllers/patientRoute');
var cloudinary = require('cloudinary');
var authRouter = require('./controllers/authRoute');
var userRouter = require('./controllers/userRouter');
var reportsRouter = require('./controllers/labReportRoute');
var {deleteRoute}=require("./router/deleteRoute");
const socketio = require('socket.io');
const chatGroupRouter = require('./controllers/chatGroupRouter.js');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllRooms,
} = require('./utils/users');

require('dotenv').config();
const PORT = 4000;
var app = express();

const server = http.createServer(app);
const io = socketio(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static('files')); // internal ususage
app.use('/files', express.static(path.join(__dirname, 'files')));

//Database Connection
require('./connections/db');

//Routes
app.get('/',(req,res)=>{
  res.status(200).json({"msg":"This is docktalk api"});
	//res.sendFile(path.join(__dirname, '/public/site', 'index.html'));
});
app.get('/privacy',(req,res)=>{

	res.sendFile(path.join(__dirname, '/public/site', 'privacy.html'));

});
app.get('/disclaimer',(req,res)=>{

	res.sendFile(path.join(__dirname, '/public/site', 'disclaimer.html'));

});
app.get('/terms',(req,res)=>{

	res.sendFile(path.join(__dirname, '/public/site', 'terms.html'));

});
app.get('/support',(req,res)=>{

	res.sendFile(path.join(__dirname, '/public/site', 'support.html'));

});
app.use('/api/users', userRouter);
app.use('/api/chatgroup', chatGroupRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/reports', reportsRouter);
app.use('/auth', authRouter);
app.use('/delete',deleteRoute);
//To get PORT number for heroku hosted website
app.get("/port",(req,res)=>{
  res.status(200).json({"heroku port":process.env.PORT,"localport":PORT});
})


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
const botName = 'BOT';
const botEmail = 'BOT';
const botImg = 'BOT';

// Run when client connects
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    groupModel.findOne({ _id: room }).exec(function (error, group) {
      if (error)
        socket.emit('custom_msg', 'Server Error while creating a group');
      if (group) {
        //check if user is a memeber of group
        if (group.users.indexOf(username) == -1) {
          socket.emit('custom_msg', 'Access Denied !');
        } else {
          //run if user is part of group
          const user = userJoin(socket.id, username, room);
          console.log(user);
          socket.join(user.room);

          // // Welcome current user
          // socket.emit('message', formatMessage(botName, 'Welcome to Room!'));

          // Broadcast when a user connects
          // socket.broadcast
          //   .to(user.room)
          //   .emit(
          //     'message',
          //     formatMessage(
          //       'text',
          //       `${user.username} has joined the chat`,
          //       botEmail,
          //       botName,
          //       botImg
          //     )
          //   );

          // Send users and room info
          io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room),
          });
        }
      }
    });
  });

  // Listen for chatMessage
  socket.on(
    'chatMessage',
    ({ messageType, messageValue, email, name, userImg, room, roomName }) => {
      const user = getCurrentUser(socket.id);
      if (user) {
        var update = formatMessage(
          messageType,
          messageValue,
          email,
          name,
          userImg
        );
        //adding messages to database
        groupModel.update(
          { _id: room },
          { $push: { messages: update } },
          function (err, done) {
            if (err) socket.emit('custom_msg', 'Server Error');
            else {
              // handle
            }
          }
        );
        //adding currentmsg to last message value
        groupModel
          .findByIdAndUpdate({ _id: room }, { lastMessageValue: update })
          .exec((err, group) => {
            if (err) console.log('server Error');
            if (group) {
              console.log('Saved');
            }
          });

        io.to(room).emit(
          'message',
          formatMessage(messageType, messageValue, email, name, userImg)
        );

        //Sending Push Notification to Other Room Users

        axios
          .post(
            'https://www.doctalk.health/api/users/send/notification/group_users/',
            {
              room: room,
              email: email,
              name: name,
              messageValue: messageValue,
              messageType: messageType,
              roomName: roomName,
            }
          )
          .then((data) => {
            //handle Success
          })
          .catch((error_err) => {
            //handle Error
          });
      }
    }
  );

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      // io.to(user.room).emit(
      //   'message',
      //   formatMessage(
      //     'text',
      //     `${user.username} has gone offline`,
      //     botEmail,
      //     botName,
      //     botImg
      //   )
      // );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(process.env.PORT || PORT, function (error, done) {
  if (error) console.log('Server Listening Failed');
  else console.log('Server Listening to port ', process.env.PORT+"localhost port:"+PORT);
});
