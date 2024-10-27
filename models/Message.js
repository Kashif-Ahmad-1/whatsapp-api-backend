// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // userId: { type: String, required: true },
  apiKey: { type: String, required: true },
  receiverMobileNo: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
