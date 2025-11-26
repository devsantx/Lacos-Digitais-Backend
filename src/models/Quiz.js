const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

if (!sequelize) {
  module.exports = null;
} else {
  const Quiz = sequelize.define(
    "Quiz",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      external_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "quizzes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  module.exports = Quiz;
}
