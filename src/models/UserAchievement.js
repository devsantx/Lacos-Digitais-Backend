const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

if (!sequelize) {
  module.exports = null;
} else {
  const UserAchievement = sequelize.define(
    "UserAchievement",
    {
      user_id: DataTypes.INTEGER,
      achievement_id: DataTypes.INTEGER,
      unlocked_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "user_achievements",
      timestamps: true,
    }
  );

  module.exports = UserAchievement;
}
