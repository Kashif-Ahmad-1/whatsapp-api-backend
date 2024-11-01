const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mobileNo: String,
  name: String,
  message: String,
  filePathUrl: { type: [String], default: [] },
  status: { type: String, default: 'pending' },
});

const MessageStatus = mongoose.model('MessageStatus', messageSchema);

module.exports = MessageStatus;
