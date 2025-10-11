const router = require("express").Router();
const { getIndices } = require("../controllers/IndicesController");

router.get("/", getIndices);

module.exports = router;
