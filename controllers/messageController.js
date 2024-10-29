const Message = require('../models/Message');
const User = require('../models/User'); // Import the User model

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id; // Get the authenticated user's ID from the request

    // Fetch messages for the authenticated user and populate user information
    const messages = await Message.find({ userId }).populate('userId', 'username email'); // Filter messages by userId

    res.json({
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to retrieve messages", error: error.message });
  }
};
