// models/ScheduledMessage.js
const mongoose = require('mongoose');

const scheduledMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverMobileNo: { type: String, required: true },
  message: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  sent: { type: Boolean, default: false }
});

module.exports = mongoose.model('ScheduledMessage', scheduledMessageSchema);
