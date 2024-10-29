const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const activeTokens = new Set(); 
const WhatsAppKey = require('../models/WhatsAppKey'); 
const nodemailer = require("nodemailer");
const axios = require('axios');
const https = require('https');
// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // You can use any service you want
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your email password
  }
});

exports.register = async (req, res) => {
  const { name, username, email, password, phone, role } = req.body; // Get role from request body
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = role === "admin"; // Set isAdmin based on role
    const user = new User({name, username, email, password: hashedPassword, phone, isAdmin });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  try {
      const user = await User.findOne({
          $or: [{ email: identifier }, { username: identifier }]
      });
      if (!user) return res.status(400).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "999h" });
      res.json({ token, isAdmin: user.isAdmin });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};



  exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "User not found" });
  
      // Generate a reset token
      const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      // Create reset URL
      const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
  
      // Send email
      const mailOptions = {
        to: email,
        subject: 'Password Reset',
        html: `<p>You requested for a password reset</p><p>Click this <a href="${resetUrl}">link</a> to reset your password</p>`
      };
  
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.resetPassword = async (req, res) => {
    const { token } = req.params; // Extract token from URL
    const { newPassword } = req.body;

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(400).json({ message: "Invalid token" });

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.logout = (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    activeTokens.add(token); // Add the token to the blacklist
    res.status(200).json({ message: "Logged out successfully" });
  } else {
    res.status(400).json({ message: "No token provided" });
  }
};



exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Get the user ID from the authenticated request
    const user = await User.findById(userId).select('-password'); // Exclude the password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User profile retrieved successfully",
      result: user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to retrieve user profile", error: error.message });
  }
};


exports.updateUserData = async (userId) => {
  try {
    // Fetch user details
    console.log(`Fetching user details for user ID: ${userId}`);
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found.`);
      return;
    }

    // console.log(`User found: ${user.username}`);

    // Fetch WhatsApp API key
    // console.log(`Fetching WhatsApp API key for user ID: ${userId}`);
    const whatsappKeyDoc = await WhatsAppKey.findOne({ userId: userId });
    if (!whatsappKeyDoc) {
      console.error(`API key for user ID ${userId} not found.`);
      return;
    }

    const { apiKey } = whatsappKeyDoc;
    const token = user.authtoken; // Assuming you have a token stored in the User model

    // console.log(`Fetching data from external API using API key: ${apiKey}`);
    
    // Fetch data from external API
    const response = await axios.get('https://app.smartitbox.in/api/v1/account/detail', {
      headers: {
        'x-api-key': apiKey,
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Disable SSL verification
      })
    });

    if (response.data.status === 200) {
      const { accountType, activeUpto, roles } = response.data.result;

      // Update the user document
      // console.log(`Updating user ${userId} with new data:`, { accountType, activeUpto, roles });
      await User.findByIdAndUpdate(userId, {
        accountType,
        activeUpto,
        roles,
      });
      console.log(`User ${userId} updated successfully.`);
    } else {
      console.error('Failed to fetch account details:', response.data.message);
    }
  } catch (error) {
    console.error('Error fetching account details:', error.message);
  }
};


