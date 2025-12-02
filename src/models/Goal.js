const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Goal = sequelize.define(
  "Goal",
  {
    user_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    target_value: DataTypes.INTEGER,
    current_value: DataTypes.INTEGER,
    frequency: DataTypes.STRING,
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    is_completed: DataTypes.BOOLEAN,
    completed_at: DataTypes.DATE,
  },
  {
    tableName: "goals",
    timestamps: true,
  }
);

module.exports = Goal;
