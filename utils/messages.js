const moment = require('moment');

function formatMessage(messageType, messageValue, email, name, userImg) {
  return {
    messageType: messageType,
    messageValue: messageValue,
    sender: {
      email: email,
      name: name,
      userImg: userImg,
    },
    timestamp: Date.now(),
  };
}

module.exports = formatMessage;
