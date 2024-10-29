const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const messageRoutes = require('./routes/messageRoutes')
const authenticate = require('./middleware/authenticate');
const Message = require('./models/Message');
const accountRoutes = require('./routes/accountRoutes');
const bodyParser = require('body-parser');

require("dotenv").config();
// "multer-storage-cloudinary": "^4.0.0",
const app = express();
connectDB();
app.use(bodyParser.json());
// Enable CORS for all routes
app.use(cors({ origin: "http://localhost:3000" })); // Allow only the React app origin

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/whatsapp", messageRoutes);
app.use('/api',authenticate, accountRoutes);

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