const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messageController'); // Update the path as necessary
const authenticate = require('../middleware/authenticate');
// Route to get all messages
router.get('/messages', getMessages); // Use your authentication middleware

module.exports = router;
