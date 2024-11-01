const express = require("express");
const { register, login,forgotPassword,resetPassword,logout,getUserProfile } = require("../controllers/authController");
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/authenticate');
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post('/logout', authenticate,logout);
router.get('/profile', authenticate, getUserProfile);
module.exports = router;
