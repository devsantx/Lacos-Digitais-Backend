// src/routes/institutionalRoutes.js
const express = require("express");
const router = express.Router();
const institutionalController = require("../controllers/institutionalController");
const institutionalAuth = require("../middlewares/institutionalAuth"); // ← CORRIGIDO

// ============================================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================================

// Login
router.post("/login", institutionalController.login);

// Listar artigos aprovados (para área pública do app)
router.get("/articles/public", institutionalController.getPublicArticles);

// Incrementar visualização de artigo
router.post("/articles/:id/view", institutionalController.incrementViews);

// ============================================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================================

// Criar artigo
router.post(
  "/articles",
  institutionalAuth,
  institutionalController.createArticle
);

// Listar artigos da instituição
router.get("/articles", institutionalAuth, institutionalController.getArticles);

// Buscar artigo específico
router.get(
  "/articles/:id",
  institutionalAuth,
  institutionalController.getArticleById
);

// Atualizar artigo
router.put(
  "/articles/:id",
  institutionalAuth,
  institutionalController.updateArticle
);

// Deletar artigo
router.delete(
  "/articles/:id",
  institutionalAuth,
  institutionalController.deleteArticle
);

// Estatísticas da instituição
router.get("/stats", institutionalAuth, institutionalController.getStats);

module.exports = router;
