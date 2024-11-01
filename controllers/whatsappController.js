const WhatsAppKey = require("../models/WhatsAppKey");
const axios = require("axios");
const Message = require('../models/Message');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const ScheduledMessage = require('../models/ScheduledMessage')
// Configure Cloudinary
cloudinary.config({
  cloud_name: 'diefvxqdv',
  api_key: '156887339719455',
  api_secret: 'klGS-0_rcHywWyApoOsoV4UhgNU',
});

exports.uploadImage  = async (req, res) => {
  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded." });
  }

  try {
    // Map through the files and upload to Cloudinary
    const filePathUrls = await Promise.all(req.files.map(file => {
      return new Promise((resolve, reject) => {
        // Determine the resource type based on the file extension
        let resourceType;
        if (file.mimetype.startsWith('image/')) {
          resourceType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          resourceType = 'video';
        } else if (file.mimetype === 'application/pdf') {
          resourceType = 'raw'; // Use 'raw' for PDFs in Cloudinary
        } else {
          return reject(new Error('Unsupported file type.'));
        }

        const stream = cloudinary.uploader.upload_stream({
          folder: 'uploads',
          resource_type: resourceType,
        }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url); // Get the secure URL from Cloudinary response
          }
        });

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null); // Signal the end of the stream
        bufferStream.pipe(stream);
      });
    }));

    // Send back the array of file URLs
    res.status(200).json({ filePathUrls });
  } catch (error) {
    res.status(500).json({ message: "Upload failed.", details: error });
  }
};


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
      // console.log("Incoming request body:", req.body);
  
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
 
  
  exports.scheduleMessage = async (req, res) => {
    const { receiverMobileNo, message, scheduledTime, filePathUrl } = req.body; 
    const userId = req.user.id; // Assuming you have user authentication
  
    const scheduledMessage = new ScheduledMessage({
      userId,
      receiverMobileNo,
      message,
      scheduledTime,
      filePathUrl, // Save the file URLs here
      sent: false
    });
  
    try {
      await scheduledMessage.save();
      res.status(201).json({ message: "Message scheduled successfully!", scheduledMessage });
    } catch (error) {
      console.error("Error scheduling message:", error);
      res.status(500).json({ message: "Failed to schedule message." });
    }
};
  

// Get Scheduled Messages Endpoint
exports.getScheduledMessages = async (req, res) => {
  try {
    const messages = await ScheduledMessage.find({ userId: req.user.id });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching scheduled messages:", error);
    res.status(500).json({ message: "Failed to fetch scheduled messages." });
  }
};


exports.deleteScheduledMessage = async (req, res) => {
  const { id } = req.params; // Assume the message ID is passed as a URL parameter

  try {
    const result = await ScheduledMessage.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!result) {
      return res.status(404).json({ message: "Message not found." });
    }
    res.status(200).json({ message: "Message deleted successfully." });
  } catch (error) {
    console.error("Error deleting scheduled message:", error);
    res.status(500).json({ message: "Failed to delete message." });
  }
};