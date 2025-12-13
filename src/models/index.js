// src/models/index.js
const path = require("path");

// Importar database.js do diretório config (um nível acima)
const { sequelize } = require("../config/database");

// Verificar se sequelize está configurado
if (!sequelize) {
  console.warn(
    "⚠️  Sequelize não está configurado. Usando modo sem banco de dados."
  );

  // Exportar objetos vazios para evitar crash
  const emptyModel = {
    findOne: () => Promise.resolve(null),
    findAll: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: 1 }),
    findByPk: () => Promise.resolve(null),
    count: () => Promise.resolve(0),
    update: () => Promise.resolve([1]),
    destroy: () => Promise.resolve(1),
  };

  module.exports = {
    sequelize: null,
    AnonymousUser: emptyModel,
    Achievement: emptyModel,
    Article: emptyModel,
    DiaryEntry: emptyModel,
    Goal: emptyModel,
    Quiz: emptyModel,
    UserAchievement: emptyModel,
  };
  return;
}

// Importar todos os models
let AnonymousUser,
  Achievement,
  Article,
  DiaryEntry,
  Goal,
  Quiz,
  UserAchievement;

try {
  AnonymousUser = require("./AnonymousUser");
  Achievement = require("./Achievement");
  Article = require("./Article");
  DiaryEntry = require("./DiaryEntry");
  Goal = require("./Goal");
  Quiz = require("./Quiz");
  UserAchievement = require("./UserAchievement");

  console.log("✅ Todos os models importados com sucesso");
} catch (error) {
  console.error("❌ Erro ao importar models:", error.message);

  // Se algum model falhar, usar objeto vazio
  const emptyModel = {
    findOne: () => Promise.resolve(null),
    findAll: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: 1 }),
    findByPk: () => Promise.resolve(null),
    count: () => Promise.resolve(0),
    update: () => Promise.resolve([1]),
    destroy: () => Promise.resolve(1),
  };

  AnonymousUser = AnonymousUser || emptyModel;
  Achievement = Achievement || emptyModel;
  Article = Article || emptyModel;
  DiaryEntry = DiaryEntry || emptyModel;
  Goal = Goal || emptyModel;
  Quiz = Quiz || emptyModel;
  UserAchievement = UserAchievement || emptyModel;
}

const models = {
  sequelize,
  AnonymousUser,
  Achievement,
  Article,
  DiaryEntry,
  Goal,
  Quiz,
  UserAchievement,
};

console.log("✅ Models index.js carregado com sucesso");

// Tentar sincronizar modelos de forma segura
if (sequelize) {
  setTimeout(async () => {
    try {
      await sequelize.authenticate();
      console.log("✅ Conexão com banco de dados estabelecida");

      // Sincronizar modelos com segurança
      await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
      console.log("✅ Tabelas sincronizadas");
    } catch (error) {
      console.error("❌ Erro ao sincronizar modelos:", error.message);
    }
  }, 2000);
}

module.exports = models;
