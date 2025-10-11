// util/SecretToken.js
require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.createSecretToken = (id, username) => {
  return jwt.sign({ 
    id, 
    username // Include username in the token payload
  }, process.env.TOKEN_KEY, {
    expiresIn: 3 * 24 * 60 * 60, // 3 days
  });
};