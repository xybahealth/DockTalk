const mongoose = require('mongoose');

//database connection

const dbName = 'Doc_Talk';
const dbURL = 'mongodb://127.0.0.1:27017';

mongoose.connect(
  "mongodb+srv://gsd:gsd1234@nodejsexample.waqmn.mongodb.net/DocTalkDatabase?retryWrites=true&w=majority",

  

  function (error, connected) {
    if (error) {
      console.log('Failed to connect with Message :', error);
    } else {
      console.log('Database Connection Success');
    }
  }
);
