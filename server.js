const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const routes = require("./src/routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "🚀 API Laços Digitais - Online",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      test: "/api/test",
      auth: "/api/auth",
      articles: "/api/articles",
      quizzes: "/api/quizzes",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Erro:", err);
  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   🚀 LAÇOS DIGITAIS API - ONLINE     ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`📡 Servidor na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🕐 ${new Date().toLocaleString("pt-BR")}`);
  console.log("════════════════════════════════════════");
  console.log("📍 Endpoints disponíveis:");
  console.log("   GET  /");
  console.log("   GET  /health");
  console.log("   GET  /api/test");
  console.log("   POST /api/auth/register");
  console.log("   POST /api/auth/login");
  console.log("   GET  /api/articles");
  console.log("   GET  /api/quizzes");
  console.log("════════════════════════════════════════");
});

module.exports = app;
