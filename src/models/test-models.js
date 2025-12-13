// test-models.js
console.log("Testando carregamento de models...");
try {
  const models = require("./models");
  console.log("✅ Models carregados com sucesso!");
  console.log("Models disponíveis:", Object.keys(models).filter(key => key !== 'sequelize'));
} catch (error) {
  console.error("❌ Erro ao carregar models:", error.message);
}