const User = require("../model/UserModel");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const userVerification = (req, res, next) => {
  let token = req.cookies.token; // Check cookies first
  
  // If no token in cookies, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      console.log("🔐 Token found in Authorization header");
    }
  }
  
  if (!token) {
    console.log("❌ No token found in cookies or headers");
    return res.status(401).json({ status: false, message: "No token provided" });
  }
  
  console.log("🔐 Verifying token:", token.substring(0, 20) + "...");
  
  jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
    if (err) {
      console.log("❌ Token verification failed:", err.message);
      return res.status(401).json({ status: false, message: "Invalid token" });
    } else {
      try {
        console.log("🔍 Token decoded data:", data);
        const user = await User.findById(data.id);
        if (user) {
          req.user = user;
          req.userId = data.id; // Make sure userId is available
          console.log("✅ User verified:", user.username);
          console.log("✅ User ID attached to request:", data.id);
          next();
        } else {
          console.log("❌ User not found in database");
          return res.status(401).json({ status: false, message: "User not found" });
        }
      } catch (error) {
        console.error("❌ Database error:", error);
        return res.status(500).json({ status: false, message: "Server error" });
      }
    }
  });
};

module.exports = userVerification;