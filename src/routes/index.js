// src/routes/index.js
const express = require("express");
const router = express.Router();

// Importar todas as rotas
const authRoutes = require("./authRoutes");
const institutionalRoutes = require("./institutionalRoutes");
const articlesRoutes = require("./articles.routes");
const quizzesRoutes = require("./quizzes.routes");
const progressRoutes = require("./progress.routes");
// ADICIONE ESTA LINHA:
const diaryRoutes = require("./diary");

// Montar rotas
router.use("/auth", authRoutes);
router.use("/institutional", institutionalRoutes);
router.use("/articles", articlesRoutes);
router.use("/quizzes", quizzesRoutes);
router.use("/", progressRoutes); // Progresso fica na raiz do /api
// ADICIONE ESTA LINHA:
router.use("/", diaryRoutes); // Rotas do diário (ficarão em /api/diary-entries)

// Rota de teste para verificar se a API está funcionando
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API funcionando corretamente!",
    timestamp: new Date().toISOString(),
    rotas: {
      auth: "/api/auth",
      institutional: "/api/institutional",
      articles: "/api/articles",
      quizzes: "/api/quizzes",
      diary: "/api/diary-entries", // ← ADICIONE ESTA LINHA
      progress: {
        diary: "/api/diary-entries",
        goals: "/api/goals",
        achievements: "/api/user-achievements",
      },
    },
  });
});

module.exports = router;
