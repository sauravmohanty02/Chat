const moment = require('moment');

function formatMessage_usr(username, text,time,status) {
  return {
    username,
    text,
    time,
    status
  };
}

function formatMessage(username, text,time) {
  return {
    username,
    text,
    time,
  };
}

module.exports = {formatMessage,formatMessage_usr};
