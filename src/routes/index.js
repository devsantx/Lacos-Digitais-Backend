const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const articlesRoutes = require("./articles.routes");
const quizzesRoutes = require("./quizzes.routes");
const progressRoutes = require("./progress.routes"); // ← ADICIONAR ESTA LINHA

router.use("/auth", authRoutes);
router.use("/articles", articlesRoutes);
router.use("/quizzes", quizzesRoutes);
router.use("/", progressRoutes); // ← ADICIONAR ESTA LINHA

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API funcionando corretamente!",
    timestamp: new Date().toISOString(),
    routes: {
      auth: "/api/auth",
      articles: "/api/articles",
      quizzes: "/api/quizzes",
      progress: "/api/diary-entries, /api/goals, /api/user-achievements",
    },
  });
});

module.exports = router;
