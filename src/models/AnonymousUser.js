const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

if (!sequelize) {
  module.exports = null;
} else {
  const AnonymousUser = sequelize.define(
    "AnonymousUser",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "anonymous_users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  module.exports = AnonymousUser;
}
