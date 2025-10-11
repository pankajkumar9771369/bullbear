const router = require("express").Router();
const { Signup, Login, userVerification, Logout } = require("../controllers/AuthController");
router.post("/signup", Signup);
router.post("/login", Login);
router.get("/verify", userVerification);
router.post('/logout', Logout);
module.exports = router;
