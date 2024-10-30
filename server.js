const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const messageRoutes = require('./routes/messageRoutes')
const { authenticate, isAdmin } = require('./middleware/authenticate');
const accountRoutes = require('./routes/accountRoutes');
const bodyParser = require('body-parser');
const whatsappKeyRoutes = require('./routes/whatsappKeyRoutes')
const whatsappStatusRoutes = require('./routes/whatsappStatusRoutes')
const ScheduledMessage = require('./models/ScheduledMessage');
const WhatsAppKey = require('./models/WhatsAppKey');
const cron = require('node-cron');
const axios = require('axios');
const MessageStatus = require('./models/MessageStatus');
require("dotenv").config();
// "multer-storage-cloudinary": "^4.0.0",
const mongoose = require('mongoose');
// Function to delete sent messages


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

const deleteSentMessages = async () => {
  try {
    const result = await MessageStatus.deleteMany({ status: 'sent' });
    console.log(`${result.deletedCount} sent messages deleted.`);
  } catch (error) {
    console.error("Error deleting sent messages:", error);
  }
};

// Schedule the job to run every 2 minutes
cron.schedule("*/5 * * * *", deleteSentMessages);


const app = express();
connectDB();
app.use(bodyParser.json());
// Enable CORS for all routes
app.use(cors({
  origin: ['https://whatsappapi-sigma.vercel.app','http://localhost:3000'], // Allow both localhost and deployed frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE','OPTIONS'],
 
  
}));

app.post('/api/sendScheduledMessages', async (req, res) => {
  try {
      await sendScheduledMessages();
      await deleteSentMessages();
      res.status(200).json({ message: 'Scheduled messages sent successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Error sending scheduled messages', error });
  }
});


app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use('/api/whatsapp', whatsappStatusRoutes);
app.use("/api/whatsapp", messageRoutes);
app.use('/api',authenticate, accountRoutes);
app.use('/api/admin', whatsappKeyRoutes)
app.get('/',(req,res)=>{
    res.json({message: "Hello this is kashif"})
  })



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));