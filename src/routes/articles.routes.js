const express = require("express");
const router = express.Router();
const articlesController = require("../controllers/articlesController");

router.get("/", articlesController.getAll);
router.get("/:id", articlesController.getOne);

module.exports = router;
