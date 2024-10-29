const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {type: String, required: true},
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }, // Add isAdmin field,
  accountType: { type: String, default: null },
  activeUpto: { type: Date, default: null },
  roles: { type: [Object], default: [] },
});

module.exports = mongoose.model("User", userSchema);
