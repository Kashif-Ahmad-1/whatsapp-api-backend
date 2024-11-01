const express = require("express");
const {
  getApiKey,
  saveApiKey,
  sendMessage,
  uploadImage,
  scheduleMessage,
  getScheduledMessages,
  deleteScheduledMessage, // Import the delete function
} = require("../controllers/whatsappController");
const { authenticate, isAdmin } = require('../middleware/authenticate');
const multer = require('multer');

// Set up Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/api-key", authenticate, getApiKey);       // Fetch existing API key
router.post("/api-key", authenticate, saveApiKey);     // Save or update API key
router.post("/send-message", authenticate, sendMessage); // Send WhatsApp message
router.post("/upload", authenticate, upload.array('files'), uploadImage); 
router.post('/schedule-message', authenticate, scheduleMessage);
router.get('/scheduled-messages', authenticate, getScheduledMessages);

// Add the delete route for scheduled messages
router.delete('/scheduled-messages/:id', authenticate, deleteScheduledMessage);

module.exports = router;
