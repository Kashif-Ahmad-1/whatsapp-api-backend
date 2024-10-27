const Message = require('../models/Message');
const User = require('../models/User'); // Import the User model

exports.getMessages = async (req, res) => {
  try {
    // Fetch all messages and populate user information
    const messages = await Message.find().populate('userId', 'username email'); // Adjust fields as necessary

    res.json({
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to retrieve messages", error: error.message });
  }
};
