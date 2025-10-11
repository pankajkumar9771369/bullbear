const router = require("express").Router();
const { getAllWatchlist, addToWatchlist } = require("../controllers/WatchlistController");

router.get("/", getAllWatchlist);
router.post("/add", addToWatchlist); // Allow POST for testing via Postman
module.exports = router;
