// controllers/authController.js
const User = require("../model/UserModel");
const bcrypt = require("bcryptjs");
const { createSecretToken } = require("../util/SecretToken");
const jwt = require("jsonwebtoken");

module.exports.Signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if(!email || !password || !username) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if(existingUser) {
      return res.status(400).json({ message: "User exists" });
    }

    const user = await User.create({ email, password, username });
    
    // Include username in the token
    const token = createSecretToken(user._id, user.username);
    console.log("Signup token:", token);
    
    res.cookie("token", token, { 
      httpOnly: true, 
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000 
    });
    
    res.status(201).json({
      success: true, 
      message: "User signed up", 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      },
      token: token
    });
  } catch(err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

module.exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const user = await User.findOne({ email });
    if(!user) {
      return res.status(400).json({ success: false, message: "Incorrect email/password" });
    }

    const auth = await bcrypt.compare(password, user.password);
    if(!auth) {
      return res.status(400).json({ success: false, message: "Incorrect email/password" });
    }

    // Include username in the token
    const token = createSecretToken(user._id, user.username);
    console.log("Login token:", token);
    
    res.cookie("token", token, { 
      httpOnly: true, 
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000 
    });
    
    res.status(200).json({
      success: true, 
      message: "Logged in", 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      },
      token: token
    });
  } catch(err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

// Keep only one userVerification function
module.exports.userVerification = async (req, res) => {
  const token = req.cookies.token;
  if(!token) {
    return res.json({ status: false });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    const user = await User.findById(decoded.id);
    
    if(user) {
      res.json({ 
        status: true, 
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
    } else {
      res.json({ status: false });
    }
  } catch(err) {
    console.error("Token verification error:", err);
    res.json({ status: false });
  }
};