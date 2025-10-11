const router = require("express").Router();
const { getSummary } = require("../controllers/SummaryController");

router.get("/", getSummary);

module.exports = router;
