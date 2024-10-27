const WhatsAppKey = require("../models/WhatsAppKey");
const axios = require("axios");
const Message = require('../models/Message')
// Get WhatsApp API key for the logged-in user
exports.getApiKey = async (req, res) => {
  try {
    const keyRecord = await WhatsAppKey.findOne({ userId: req.user.id });
    res.json({ apiKey: keyRecord ? keyRecord.apiKey : null });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// Save or update WhatsApp API key for the user
exports.saveApiKey = async (req, res) => {
    const { apiKey } = req.body;
    try {
      let keyRecord = await WhatsAppKey.findOne({ userId: req.user.id });
  
      if (keyRecord) {
        keyRecord.apiKey = apiKey;
        await keyRecord.save();
      } else {
        keyRecord = new WhatsAppKey({ userId: req.user.id, apiKey });
        await keyRecord.save();
      }
  
      res.json({ message: "API key saved successfully" });
    } catch (error) {
      console.error("Error saving API key:", error); // Add logging
      res.status(500).json({ message: "Server error" });
    }
  };
 
  exports.sendMessage = async (req, res) => {
    let { receiverMobileNo, message, filePathUrl } = req.body;
  
    try {
      // Log incoming request
      console.log("Incoming request body:", req.body);
  
      // Validate inputs
      if (!receiverMobileNo || (message && !Array.isArray(message)) || (message && message.length === 0) || (message && typeof message[0] !== 'string')) {
        return res.status(400).json({ message: "Receiver mobile number must be a string and message must be a non-empty array of strings." });
      }
  
      // Validate filePathUrl if provided
      if (filePathUrl && !Array.isArray(filePathUrl)) {
        return res.status(400).json({ message: "filePathUrl must be an array." });
      }
  
      if (filePathUrl && filePathUrl.length > 0 && !filePathUrl.every(url => typeof url === 'string')) {
        return res.status(400).json({ message: "Each filePathUrl must be a string." });
      }
  
      const keyRecord = await WhatsAppKey.findOne({ userId: req.user.id });
  
      if (!keyRecord) {
        return res.status(400).json({ message: "API key not found. Please set your API key." });
      }
  
      // Prepare the payload
      const payload = {
        receiverMobileNo,
        ...(message && { message }), // Include message array if provided
        ...(filePathUrl && { filePathUrl }), // Include filePathUrl if provided
      };
  
      // Send the request to the WhatsApp API
      const response = await axios.post(
        "https://app.messageautosender.com/api/v1/message/create",
        payload,
        { headers: { "x-api-key": keyRecord.apiKey } }
      );
  
      // Convert message array to a string for saving in the database if applicable
      const messageString = message ? message.join(' ') : ''; // Join array elements into a single string if message exists
  
      // Save to database
      const newMessage = new Message({
        userId: req.user.id,
        apiKey: keyRecord.apiKey,
        receiverMobileNo,
        message: messageString, // Save as a string
        filePathUrl: filePathUrl ? filePathUrl.join(',') : null // Save filePathUrl as a string if provided
      });
  
      await newMessage.save();
      const populatedMessage = await Message.findById(newMessage._id).populate('userId', 'name email'); // Adjust fields as necessary
  
      res.json({
        message: "Message sent successfully and saved!",
        response: response.data,
        savedMessageId: newMessage._id,
        user: populatedMessage.userId,
      });
    } catch (error) {
      console.error("Error details:", error);
      if (error.response) {
        console.error("Axios error response:", error.response.data);
        return res.status(error.response.status).json({ message: error.response.data });
      }
      res.status(500).json({ message: "Failed to send message or save it to the database.", error: error.message });
    }
  };
 
  

  


// exports.sendMessage = async (req, res) => {
//   let { receiverMobileNo, message } = req.body;

//   try {
//     // console.log("Incoming request data:", req.body);

//     // Check if receiverMobileNo is a string and message is an array
//     if (!receiverMobileNo || !Array.isArray(message) || message.length === 0 || typeof message[0] !== 'string') {
//       return res.status(400).json({ message: "Receiver mobile number must be a string and message must be a non-empty array of strings." });
//     }

//     const keyRecord = await WhatsAppKey.findOne({ userId: req.user.id });

//     if (!keyRecord) {
//       return res.status(400).json({ message: "API key not found. Please set your API key." });
//     }

//     const response = await axios.post(
//       "https://app.messageautosender.com/api/v1/message/create",
//       { receiverMobileNo, message }, // Send message as an array
//       { headers: { "x-api-key": keyRecord.apiKey } }
//     );

//     // Convert message array to a string for saving in the database
//     const messageString = message.join(' '); // Join array elements into a single string
    
//     // Save to database
//     const newMessage = new Message({
//       userId: req.user.id,
//       apiKey: keyRecord.apiKey,
//       receiverMobileNo,
//       message: messageString, // Save as a string
//     });

//     await newMessage.save();
//     const populatedMessage = await Message.findById(newMessage._id).populate('userId', 'name email'); // Adjust fields as necessary
//     res.json({
//       message: "Message sent successfully and saved!",
//       response: response.data,
//       savedMessageId: newMessage._id,
//       user: populatedMessage.userId,
//     });
//   } catch (error) {
//     console.error("Error details:", error);
//     if (error.response) {
//       console.error("Axios error response:", error.response.data);
//       return res.status(error.response.status).json({ message: error.response.data });
//     }
//     res.status(500).json({ message: "Failed to send message or save it to the database.", error: error.message });
//   }
// };
