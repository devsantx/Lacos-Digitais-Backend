const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

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
