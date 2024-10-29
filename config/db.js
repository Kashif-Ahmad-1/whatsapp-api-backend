const mongoose = require("mongoose");
require("dotenv").config();
const startPeriodicUpdate = require('../controllers/startPeriodicUpdate');
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected");
    startPeriodicUpdate();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
