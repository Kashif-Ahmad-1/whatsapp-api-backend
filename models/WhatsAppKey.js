const mongoose = require("mongoose");

const whatsappKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  apiKey: { type: String, required: true },
});

module.exports = mongoose.model("WhatsAppKey", whatsappKeySchema);
