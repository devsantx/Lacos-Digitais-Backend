const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

if (!sequelize) {
  module.exports = null;
} else {
  const DiaryEntry = sequelize.define(
    "DiaryEntry",
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      time_online: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      mood: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      triggers: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      activities: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "diary_entries",
      timestamps: true,
    }
  );

  module.exports = DiaryEntry;
}
