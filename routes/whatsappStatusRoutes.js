const express = require('express');
const router = express.Router();
const MessageStatus = require('../models/MessageStatus');
const { authenticate } = require('../middleware/authenticate'); // Assuming you have an auth middleware

// Save extracted data
router.post('/save-extracted-data', authenticate, async (req, res) => {
  try {
    const { extractedData } = req.body;
    const userId = req.user.id; // Get userId from the authenticated user

    const savedData = await MessageStatus.insertMany(extractedData.map(item => ({
      userId,
      mobileNo: item[0],
      name: item[1],
      message: item[2],
    })));

    res.status(201).json({ success: true, data: savedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/save-message', authenticate, async (req, res) => {
  try {
      const { message, extractedData, filePathUrl } = req.body;
      const userId = req.user.id;

      // Validate incoming data
      if (!Array.isArray(extractedData) || typeof message !== 'string') {
          return res.status(400).json({ success: false, message: 'Invalid data format' });
      }

      // Save messages
      const savedData = await MessageStatus.insertMany(
          extractedData.map(item => ({
              userId,
              mobileNo: item[0],
              name: item[1],
              message,
              filePathUrl, // Ensure it's an array
              status: 'pending', // Set default status
          }))
      );

      res.status(201).json({ success: true, data: savedData });
  } catch (error) {
      console.error("Error saving message:", error);
      res.status(500).json({ success: false, message: error.message });
  }
});

  

// Update message status
router.post('/update-message-status', authenticate, async (req, res) => {
  const { mobileNo, message,status } = req.body;
  try {
    await MessageStatus.updateOne({ mobileNo, message,userId: req.user.id }, { status }); // Ensure only the user's message can be updated
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get sent messages
router.get('/sent-messages', authenticate, async (req, res) => {
  try {
    const sentMessages = await MessageStatus.find({ userId: req.user.id }); // Filter by userId
    res.status(200).json({ success: true, data: sentMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
