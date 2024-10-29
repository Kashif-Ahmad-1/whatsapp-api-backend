const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const messageRoutes = require('./routes/messageRoutes')
const { authenticate, isAdmin } = require('./middleware/authenticate');
const Message = require('./models/Message');
const accountRoutes = require('./routes/accountRoutes');
const bodyParser = require('body-parser');
const whatsappKeyRoutes = require('./routes/whatsappKeyRoutes')
const ScheduledMessage = require('./models/ScheduledMessage');
const WhatsAppKey = require('./models/WhatsAppKey');
const User = require('./models/User')
const cron = require('node-cron');
const axios = require('axios');
require("dotenv").config();
// "multer-storage-cloudinary": "^4.0.0",
const mongoose = require('mongoose');

const sendScheduledMessages = async () => {
  const now = new Date();

  try {
    const messagesToSend = await ScheduledMessage.find({
      scheduledTime: { $lte: now },
      sent: false
    }).populate("userId");

    for (const message of messagesToSend) {
      const keyRecord = await WhatsAppKey.findOne({ userId: message.userId._id });

      if (!keyRecord) continue; // Skip if no API key

      const payload = {
        receiverMobileNo: message.receiverMobileNo,
        message: [message.message]
      };

      await axios.post("https://app.messageautosender.com/api/v1/message/create", payload, {
        headers: { "x-api-key": keyRecord.apiKey }
      });

      // Mark message as sent
      message.sent = true;
      await message.save();
    }
  } catch (error) {
    console.error("Error sending scheduled messages:", error);
  }
};

// Schedule the job to run every minute
cron.schedule("* * * * *", sendScheduledMessages);


const app = express();
connectDB();
app.use(bodyParser.json());
// Enable CORS for all routes
app.use(cors({
  origin: ['https://whatsappapi-sigma.vercel.app','http://localhost:3000'], // Allow both localhost and deployed frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE','OPTIONS'],
 
  
}));

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  mobileNo: String,
  name: String,
  message: String,
  status: { type: String, default: 'pending' }
});

const MessageStatus = mongoose.model('MessageStatus', messageSchema);

// Save extracted data
app.post('/api/whatsapp/save-extracted-data', authenticate, async (req, res) => {
  try {
    const { extractedData } = req.body;
    const userId = req.user.id; // Get userId from the authenticated user

    const savedData = await MessageStatus.insertMany(extractedData.map(item => ({
      userId, // Set userId here
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


// Update message status
app.post('/api/whatsapp/update-message-status', authenticate, async (req, res) => {
  const { mobileNo, message, status } = req.body;
  
  console.log("Received update request:", { mobileNo, message, status }); // Log the incoming data
  
  try {
    const result = await MessageStatus.updateMany(
      { mobileNo, message, userId: req.user.id },
      { status }
    );

    console.log("Update result:", result); // Log the result of the update operation

    if (result.nModified === 0) {
      return res.status(404).json({ success: false, message: "No messages found to update." });
    }

    res.status(200).json({ success: true, updatedCount: result.nModified });
  } catch (error) {
    console.error("Error updating message status:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});



// Get sent messages
app.get('/api/whatsapp/sent-messages', authenticate, async (req, res) => {
  try {
    const sentMessages = await MessageStatus.find({ userId: req.user.id }); // Filter by userId
    res.status(200).json({ success: true, data: sentMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/whatsapp", messageRoutes);
app.use('/api',authenticate, accountRoutes);
app.use('/api/admin', whatsappKeyRoutes)
app.get('/',(req,res)=>{
    res.json({message: "Hello this is kashif"})
  })

// app.post('/api/whatsapp/save', authenticate, async (req, res) => {
//     try {
//       const { apiKey, receiverMobileNo, message } = req.body;
//       const userId = req.user.id; // Get user ID from authenticated request
  
//       const newMessage = new Message({ userId, apiKey, receiverMobileNo, message });
//       await newMessage.save();
//       res.status(201).json({ message: 'Data saved successfully!' });
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to save data' });
//     }
//   });


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));