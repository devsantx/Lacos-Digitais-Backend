require("dotenv").config();
const { Sequelize } = require("sequelize");

// Conexão Sequelize para models
let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
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

  sequelize
    .authenticate()
    .then(() => console.log("✅ Conexão com PostgreSQL estabelecida!"))
    .catch((err) => console.log("⚠️  Erro ao conectar no banco:", err.message));
} else {
  console.log(
    "⚠️  DATABASE_URL não configurada — CRIANDO sequelize local SQLITE para evitar erros"
  );
  sequelize = new Sequelize("sqlite::memory:", { logging: false });
}

module.exports = { sequelize };
