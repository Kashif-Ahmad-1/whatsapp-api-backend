const jwt = require("jsonwebtoken");

const activeTokens = new Set(); // For demonstration; consider a better storage solution for production

const authenticate = (req, res, next) => {
  if (req.path === '/api/sendMessages') {
    return next();
}

  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

  if (activeTokens.has(token)) { // Check if the token is in the invalid tokens set
    return res.status(401).json({ message: "Invalid token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, isAdmin: decoded.isAdmin }; // Set user ID and role in the request object
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access Denied. Not an admin." });
  }
  next();
};

module.exports = { authenticate, isAdmin };


// const jwt = require("jsonwebtoken");

// const activeTokens = new Set(); // For demonstration; consider a better storage solution for production

// const authenticate = (req, res, next) => {
//   const token = req.header("Authorization")?.replace("Bearer ", "");

//   if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

//   if (activeTokens.has(token)) { // Check if the token is in the invalid tokens set
//     return res.status(401).json({ message: "Invalid token." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = { userId: decoded.id, isAdmin: decoded.isAdmin }; // Set userId here
//     next();
//   } catch (error) {
//     res.status(400).json({ message: "Invalid token." });
//   }
// };

// const isAdmin = (req, res, next) => {
//   if (!req.user.isAdmin) {
//     return res.status(403).json({ message: "Access Denied. Not an admin." });
//   }
//   next();
// };

// module.exports = { authenticate, isAdmin };
