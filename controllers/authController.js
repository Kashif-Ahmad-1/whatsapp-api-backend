const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


const nodemailer = require("nodemailer");

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // You can use any service you want
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your email password
  }
});

exports.register = async (req, res) => {
  const { username, email, password, phone, role } = req.body; // Get role from request body
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = role === "admin"; // Set isAdmin based on role
    const user = new User({ username, email, password: hashedPassword, phone, isAdmin });

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
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ token });
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