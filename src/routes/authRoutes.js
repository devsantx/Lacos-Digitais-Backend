// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth"); // ← Note o "s"

// Rotas públicas
router.post("/register", authController.register);
router.post("/login", authController.login);

// Rotas protegidas
router.get("/verify", authMiddleware, authController.verifyToken);
router.get("/profile", authMiddleware, authController.getProfile);

// Rota para testar sem autenticação
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Rota de teste funcionando!",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
