const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const DiaryEntry = sequelize.define(
  "DiaryEntry",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "O ID do usuário é obrigatório",
        },
        isInt: {
          msg: "O ID do usuário deve ser um número inteiro",
        },
        min: {
          args: [1],
          msg: "ID do usuário inválido",
        },
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A data é obrigatória",
        },
        isDate: {
          msg: "Data inválida",
        },
      },
    },
    time_online: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "O tempo online é obrigatório",
        },
        min: {
          args: [0],
          msg: "O tempo online não pode ser negativo",
        },
        max: {
          args: [24],
          msg: "O tempo online não pode ser maior que 24 horas",
        },
      },
    },
    mood: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "O humor é obrigatório",
        },
        isIn: {
          args: [["Feliz", "Neutro", "Triste", "Ansioso", "Estressado"]],
          msg: "Humor inválido",
        },
      },
    },
    triggers: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activities: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: "diary_entries",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["user_id", "date"],
        name: "unique_user_date",
      },
      {
        fields: ["user_id"],
        name: "idx_user_id",
      },
      {
        fields: ["date"],
        name: "idx_date",
      },
    ],
    hooks: {
      beforeValidate: (entry) => {
        // Garantir que activities seja um array
        if (entry.activities && !Array.isArray(entry.activities)) {
          entry.activities = [entry.activities];
        }
      },
    },
  }
);

module.exports = DiaryEntry;
