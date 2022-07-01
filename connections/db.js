const mongoose = require('mongoose');

//database connection

const dbName = 'Doc_Talk';
const dbURL = 'mongodb://127.0.0.1:27017';
const newDbUrl='mongodb+srv://xybahealth:xyba123@cluster0.bddcv.mongodb.net/DoctalkData?retryWrites=true&w=majority';

mongoose.connect(
  newDbUrl,

  

  function (error, connected) {
    if (error) {
      console.log('Failed to connect with Message :', error);
    } else {
      console.log('Database Connection Success');
    }
  }
);
