// server.js (na raiz do projeto)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

console.log("🚀 Iniciando API Laços Digitais...");
console.log("🌍 Ambiente:", process.env.NODE_ENV);

// Configurar caminhos base
const srcPath = path.join(__dirname, "src");

// Função helper para carregar módulos de src/
function requireFromSrc(modulePath) {
  return require(path.join(srcPath, modulePath));
}

// Tentar carregar models
let models;
try {
  console.log("📦 Carregando models de src/models...");
  models = requireFromSrc("models");
  console.log("✅ Models carregados com sucesso");
} catch (error) {
  console.error("❌ Erro ao carregar models:", error.message);
  console.warn("⚠️  Continuando sem models...");
  models = {
    sequelize: null,
    AnonymousUser: null,
  };
}

// Carregar roteador principal (que inclui todas as rotas)
let apiRouter;
try {
  console.log("📦 Carregando roteador principal...");
  apiRouter = requireFromSrc("routes/index");
  console.log("✅ Roteador principal carregado");
} catch (error) {
  console.error("❌ Erro ao carregar roteador principal:", error.message);
  console.error("📋 Tentando carregar rotas individuais...");

  // Fallback: carregar rotas individualmente
  try {
    const authRoutes = requireFromSrc("routes/authRoutes");
    const institutionalRoutes = requireFromSrc("routes/institutionalRoutes");

    apiRouter = express.Router();
    apiRouter.use("/auth", authRoutes);
    apiRouter.use("/institutional", institutionalRoutes);

    console.log("✅ Rotas carregadas individualmente");
  } catch (fallbackError) {
    console.error(
      "❌ Falha ao carregar rotas individuais:",
      fallbackError.message
    );
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:19000",
      "http://localhost:8081",
      "http://localhost:3000",
    ];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requisições sem origem (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        console.warn(`⚠️  CORS bloqueado: ${origin}`);
        return callback(new Error("Origem não permitida"), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  next();
});

// Rota principal
app.get("/", (req, res) => {
  res.json({
    message: "API Laços Digitais",
    version: "1.0.0",
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: models.sequelize ? "Conectado" : "Modo de desenvolvimento",
    rotas: {
      auth: "/api/auth",
      institutional: "/api/institutional",
      articles: "/api/articles",
      quizzes: "/api/quizzes",
      progress: "/api",
    },
  });
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    if (models.sequelize) {
      await models.sequelize.authenticate();
      res.json({
        status: "healthy",
        database: "PostgreSQL (via Sequelize)",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        models: "Carregados",
      });
    } else {
      res.status(503).json({
        status: "degraded",
        database: "Modo de desenvolvimento",
        environment: process.env.NODE_ENV,
        warning: "Banco de dados não disponível",
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      environment: process.env.NODE_ENV,
    });
  }
});

// Usar roteador principal para todas as rotas da API
app.use("/api", apiRouter);

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
    path: req.path,
    method: req.method,
    availableRoutes: [
      "/api/auth",
      "/api/institutional",
      "/api/articles",
      "/api/quizzes",
      "/api/progress",
      "/api/health",
      "/api/test",
    ],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Erro:", err.message);

  // Se for erro de CORS
  if (err.message === "Origem não permitida") {
    return res.status(403).json({
      success: false,
      error: "Acesso não permitido para esta origem",
      allowedOrigins,
    });
  }

  res.status(500).json({
    success: false,
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
🚀  Servidor Laços Digitais iniciado!
📍  URL: http://localhost:${PORT}
📁  Estrutura: src/
🌍  Ambiente: ${process.env.NODE_ENV}
📊  Banco: ${models.sequelize ? "PostgreSQL" : "Modo de desenvolvimento"}
🔐  JWT: ${process.env.JWT_SECRET ? "Configurado" : "NÃO CONFIGURADO"}
📋  Rotas: /api/*
  `);
});
