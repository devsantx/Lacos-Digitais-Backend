// server.js (na raiz do projeto)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

console.log("🚀 Iniciando API Laços Digitais...");
console.log("🌍 Ambiente:", process.env.NODE_ENV);
console.log(
  "🔐 JWT Secret:",
  process.env.JWT_SECRET ? "Configurado" : "NÃO CONFIGURADO"
);
console.log(
  "🗄️  Database URL:",
  process.env.DATABASE_URL ? "Configurado" : "NÃO CONFIGURADO"
);

// ============================================================
// CONFIGURAÇÃO CORS - PERMITE TUDO
// ============================================================

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE CORS - DEVE SER O PRIMEIRO
app.use(
  cors({
    origin: "*", // PERMITE TODAS AS ORIGENS
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Lidar com preflight requests
app.options("*", cors());

// ============================================================
// MIDDLEWARES
// ============================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`🌐 Origin: ${req.headers.origin || "none"}`);

  if (req.method === "POST" || req.method === "PUT") {
    const logBody = { ...req.body };
    if (logBody.senha) logBody.senha = "***HIDDEN***";
    if (logBody.password) logBody.password = "***HIDDEN***";
    console.log("📦 Body:", logBody);
  }

  next();
});

// ============================================================
// ROTAS BÁSICAS (ANTES DO ROTEADOR PRINCIPAL)
// ============================================================

app.get("/", (req, res) => {
  res.json({
    message: "API Laços Digitais",
    version: "2.0.0",
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: "enabled (all origins)",
    endpoints: {
      auth: "/api/auth",
      institutional: "/api/institutional",
      articles: "/api/articles",
      quizzes: "/api/quizzes",
      diary: "/api/diary-entries",
      test: "/api/test",
      health: "/api/health",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: "enabled",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API funcionando!",
    timestamp: new Date().toISOString(),
    cors: "enabled",
  });
});

app.post("/api/debug/login", (req, res) => {
  console.log("🧪 Debug endpoint chamado");
  res.json({
    success: true,
    message: "Debug endpoint funcionando",
    body_received: req.body,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// CARREGAR ROTAS DA API
// ============================================================

const srcPath = path.join(__dirname, "src");

function requireFromSrc(modulePath) {
  return require(path.join(srcPath, modulePath));
}

// Tentar carregar o roteador principal
try {
  console.log("📦 Tentando carregar roteador principal...");
  const apiRouter = requireFromSrc("routes/index");
  app.use("/api", apiRouter);
  console.log("✅ Roteador principal carregado");
} catch (error) {
  console.error("❌ Erro ao carregar roteador principal:", error.message);

  // Carregar rotas manualmente
  console.log("📋 Carregando rotas manualmente...");

  try {
    // Auth routes
    const authRoutes = requireFromSrc("routes/authRoutes");
    app.use("/api/auth", authRoutes);
    console.log("✅ Rotas de auth carregadas");

    // Institutional routes
    const institutionalRoutes = requireFromSrc("routes/institutionalRoutes");
    app.use("/api/institutional", institutionalRoutes);
    console.log("✅ Rotas institucionais carregadas");

    // Diary routes
    const diaryRoutes = requireFromSrc("routes/diary");
    app.use("/api", diaryRoutes);
    console.log("✅ Rotas de diário carregadas");

    // Articles routes
    const articlesRoutes = requireFromSrc("routes/articles.routes");
    app.use("/api/articles", articlesRoutes);
    console.log("✅ Rotas de artigos carregadas");

    // Quizzes routes
    const quizzesRoutes = requireFromSrc("routes/quizzes.routes");
    app.use("/api/quizzes", quizzesRoutes);
    console.log("✅ Rotas de quizzes carregadas");

    // Progress routes
    const progressRoutes = requireFromSrc("routes/progress.routes");
    app.use("/api", progressRoutes);
    console.log("✅ Rotas de progresso carregadas");
  } catch (loadError) {
    console.error("❌ Erro ao carregar rotas individuais:", loadError.message);
  }
}

// ============================================================
// ENDPOINTS DE FALLBACK PARA TESTE
// ============================================================

// Endpoint institucional de fallback (para teste)
app.post("/api/institutional/test-login", (req, res) => {
  console.log("🧪 Test login endpoint chamado");
  const { matricula, senha } = req.body;

  if (!matricula || !senha) {
    return res.status(400).json({
      success: false,
      error: "Matrícula e senha são obrigatórios",
    });
  }

  // Mock response
  res.json({
    success: true,
    message: "Login de teste bem-sucedido",
    token: "test-jwt-token-12345",
    institution: {
      id: 1,
      nome: "Instituição de Teste",
      matricula: matricula,
      email: "teste@uninassau.edu.br",
    },
    debug: true,
  });
});

// ============================================================
// ROTA 404
// ============================================================

app.use((req, res) => {
  console.error(`❌ Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error("❌ Erro:", err.message);
  console.error("📋 Stack:", err.stack);

  res.status(500).json({
    success: false,
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`
🚀  Servidor Laços Digitais iniciado!
📍  URL Local: http://localhost:${PORT}
🌍  URL Externa: https://lacos-digitais-api.onrender.com
📁  Ambiente: ${process.env.NODE_ENV}
🔐  JWT: ${process.env.JWT_SECRET ? "Configurado" : "NÃO CONFIGURADO"}
🛡️  CORS: PERMITINDO TODAS AS ORIGENS (*)
📡  Pronto para receber requisições...
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM recebido. Desligando servidor...");
  server.close(() => {
    console.log("✅ Servidor desligado");
    process.exit(0);
  });
});
