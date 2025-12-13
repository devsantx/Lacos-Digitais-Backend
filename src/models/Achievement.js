const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

if (!sequelize) {
  module.exports = null;
} else {
  const Achievement = sequelize.define(
    "Achievement",
    {
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      requirement: DataTypes.JSON,
    },
    {
      tableName: "achievements",
      timestamps: true,
    }
  );

  module.exports = Achievement;
}
