// src/config/database.js
require("dotenv").config();
const { Sequelize } = require("sequelize");
const path = require("path");

console.log("🔧 Configurando conexão com o banco de dados...");

let sequelize;

try {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não está configurada no arquivo .env");
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });

  console.log("✅ Sequelize configurado com sucesso");
} catch (error) {
  console.error("❌ Erro ao configurar Sequelize:", error.message);
  console.log("⚠️  Continuando sem banco de dados...");
  sequelize = null;
}

module.exports = { sequelize };
