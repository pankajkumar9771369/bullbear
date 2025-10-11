const router = require("express").Router();
const { Signup, Login, userVerification } = require("../controllers/AuthController");
router.post("/signup", Signup);
router.post("/login", Login);
router.get("/verify", userVerification);
module.exports = router;
