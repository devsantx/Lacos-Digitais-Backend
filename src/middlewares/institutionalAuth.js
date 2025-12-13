const jwt = require("jsonwebtoken");

// Middleware de autenticação para instituições
const institutionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token não fornecido",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se é token institucional
    if (decoded.type !== "institution") {
      return res.status(403).json({
        success: false,
        error: "Acesso negado. Token institucional necessário.",
      });
    }

    req.institutionId = decoded.institutionId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Token inválido ou expirado",
    });
  }
};

module.exports = institutionalAuth;
