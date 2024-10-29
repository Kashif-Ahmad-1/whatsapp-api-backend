const jwt = require("jsonwebtoken");

const activeTokens = new Set(); // For demonstration purposes; consider using a better storage method for production

const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

  if (activeTokens.has(token)) { // Check if the token is in the invalid tokens set
    return res.status(401).json({ message: "Invalid token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Set the user ID in the request object
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = authenticate;
