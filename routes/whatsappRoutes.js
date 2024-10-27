// routes/whatsappRoutes.js
const express = require("express");
const { getApiKey, saveApiKey, sendMessage,getSavedMessages } = require("../controllers/whatsappController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.get("/api-key", authenticate, getApiKey);       // Fetch existing API key
router.post("/api-key", authenticate, saveApiKey);     // Save or update API key
router.post("/send-message", authenticate, sendMessage); // Send WhatsApp message
// router.get("/messages", authenticate, getSavedMessages);
module.exports = router;
