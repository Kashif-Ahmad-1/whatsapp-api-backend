// const express = require("express");
// const { getApiKey, saveApiKey, sendMessage, getSavedMessages, uploadImage } = require("../controllers/whatsappController");
// const authenticate = require("../middleware/authenticate");
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('cloudinary').v2;

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: 'diefvxqdv',
//   api_key: '156887339719455',
//   api_secret: 'klGS-0_rcHywWyApoOsoV4UhgNU',
// });

// // Set up Cloudinary storage
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'uploads',
//     allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
//   },
// });

// const upload = multer({ storage: storage });

// const router = express.Router();

// router.get("/api-key", authenticate, getApiKey);       // Fetch existing API key
// router.post("/api-key", authenticate, saveApiKey);     // Save or update API key
// router.post("/send-message", authenticate, sendMessage); // Send WhatsApp message
// router.post("/upload", authenticate, upload.array('image'), uploadImage); // Change to upload.array

// module.exports = router;



const express = require("express");
const { getApiKey, saveApiKey, sendMessage, uploadImage } = require("../controllers/whatsappController");
const authenticate = require("../middleware/authenticate");
const multer = require('multer');

// Set up Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/api-key", authenticate, getApiKey);       // Fetch existing API key
router.post("/api-key", authenticate, saveApiKey);     // Save or update API key
router.post("/send-message", authenticate, sendMessage); // Send WhatsApp message
router.post("/upload", authenticate, upload.array('image'), uploadImage); // Upload images

module.exports = router;
