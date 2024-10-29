const WhatsAppKey = require('../models/WhatsAppKey');
const User = require('../models/User');

// Get all users along with their WhatsApp API keys
exports.getAllUsersWithApiKeys = async (req, res) => {
  try {
    // Fetch all users
    const users = await User.find().select('-password'); // Exclude password from user details

    // Fetch API keys for all users
    const apiKeys = await WhatsAppKey.find();

    // Map API keys to users
    const userDetails = users.map(user => {
      const key = apiKeys.find(apiKey => apiKey.userId.toString() === user._id.toString());
      return {
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        accountType: user.accountType || 'No data', // Default value
        activeUpto: user.activeUpto || 'No data', // Default value
        roles: user.roles.length > 0 ? user.roles : 'No data', // Default value
        apiKey: key ? key.apiKey : 'No API key available', // Default value if no API key
      };
    });

    res.json({
      message: "All user details retrieved successfully",
      users: userDetails,
    });
  } catch (error) {
    console.error("Error fetching all users with API keys:", error);
    res.status(500).json({ message: "Failed to retrieve user details", error: error.message });
  }
};
