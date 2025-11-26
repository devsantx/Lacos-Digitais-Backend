const express = require("express");
const router = express.Router();
const quizzesController = require("../controllers/quizzesController");

router.get("/", quizzesController.getAll);

module.exports = router;
