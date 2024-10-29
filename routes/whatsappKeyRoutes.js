const express = require('express');
const { getAllUsersWithApiKeys } = require('../controllers/whatsappKeyController');
const { authenticate, isAdmin } = require('../middleware/authenticate');
const router = express.Router();

// Route to get all user details with API keys
router.get('/users', isAdmin, getAllUsersWithApiKeys);

module.exports = router;
