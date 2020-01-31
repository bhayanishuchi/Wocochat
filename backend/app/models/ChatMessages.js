const mongoose = require('mongoose');

const schemaOptions = {
  timestamps: {createdAt: 'created_at', updatedAt: 'last_updated'},
};

const chatMessagesSchema = mongoose.Schema({
  msg_id: String,
  nick: String,
  to: String,
  msg: String,
  flag: Boolean,
  date: String,
  time: String,
  offline: Boolean,
  counter: Number
}, schemaOptions);

var ChatMessages = mongoose.model('ChatMessages', chatMessagesSchema);
module.exports = ChatMessages;
