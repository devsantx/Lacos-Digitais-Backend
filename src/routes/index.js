const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const articlesRoutes = require("./articles.routes");
const quizzesRoutes = require("./quizzes.routes");

router.use("/auth", authRoutes);
router.use("/articles", articlesRoutes);
router.use("/quizzes", quizzesRoutes);

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API funcionando corretamente!",
    timestamp: new Date().toISOString(),
    routes: {
      auth: "/api/auth",
      articles: "/api/articles",
      quizzes: "/api/quizzes",
    },
  });
});

module.exports = router;
