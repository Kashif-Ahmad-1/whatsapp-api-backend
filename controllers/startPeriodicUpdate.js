const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path as needed
const { updateUserData } = require('./authController');// Adjust path as needed

const startPeriodicUpdate = () => {
  setInterval(async () => {
    try {
      // console.log("Starting periodic user data update...");

      const users = await User.find({}); // Fetch all users or filter as needed
      // console.log(`Found ${users.length} user(s) to update.`);

      for (const user of users) {
        // console.log(`Updating data for user ID: ${user._id}`);
        await updateUserData(user._id);
      }

      console.log("Periodic update completed.");
    } catch (error) {
      console.error("Error during periodic update:", error.message);
    }
  }, 20 * 60 * 1000); // 5 minutes in milliseconds
};

// Export the function
module.exports = startPeriodicUpdate;
