// src/routes/diary.js
const express = require("express");
const router = express.Router();
const DiaryEntry = require("../models/DiaryEntry");

// @route   POST /api/diary-entries
// @desc    Criar uma nova entrada no diário
// @access  Private (mas sem auth para teste inicial)
router.post("/diary-entries", async (req, res) => {
  try {
    console.log("📥 Recebendo dados do diário:", req.body);

    const { user_id, date, time_online, mood, triggers, activities } = req.body;

    // Validação básica
    if (!user_id || !date || time_online === undefined || !mood) {
      return res.status(400).json({
        success: false,
        error:
          "Campos obrigatórios faltando: user_id, date, time_online e mood são obrigatórios",
      });
    }

    // Validar range das horas (0-24)
    const hours = parseInt(time_online);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      return res.status(400).json({
        success: false,
        error: "Horas online devem estar entre 0 e 24",
      });
    }

    // Mapeamento dos humores do frontend para o backend
    const moodMapping = {
      Feliz: "Feliz",
      Neutro: "Neutro",
      Triste: "Triste",
      Ansioso: "Ansioso",
    };

    // Converter o mood do frontend
    const backendMood = moodMapping[mood] || mood;

    const validMoods = ["Feliz", "Neutro", "Triste", "Ansioso", "Estressado"];
    if (!validMoods.includes(backendMood)) {
      return res.status(400).json({
        success: false,
        error: `Humor inválido. Valores aceitos: ${validMoods.join(", ")}`,
        received: mood,
        mapped: backendMood,
      });
    }

    // Verificar se já existe entrada para esta data
    const existingEntry = await DiaryEntry.findOne({
      where: {
        user_id,
        date,
      },
    });

    if (existingEntry) {
      // Atualizar entrada existente
      await existingEntry.update({
        time_online: hours,
        mood: backendMood,
        triggers: triggers || null,
        activities: activities || [],
      });

      return res.status(200).json({
        success: true,
        message: "Entrada atualizada com sucesso",
        data: existingEntry,
        updated: true,
      });
    }

    // Criar nova entrada
    const newEntry = await DiaryEntry.create({
      user_id,
      date,
      time_online: hours,
      mood: backendMood,
      triggers: triggers || null,
      activities: activities || [],
    });

    console.log("✅ Entrada criada com sucesso:", newEntry.id);

    return res.status(201).json({
      success: true,
      message: "Entrada salva com sucesso",
      data: newEntry,
      created: true,
    });
  } catch (error) {
    console.error("❌ Erro ao salvar entrada no diário:", error);

    // Erro de duplicidade (unique constraint)
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        error: "Já existe uma entrada para esta data",
      });
    }

    // Outros erros do Sequelize
    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: `Erro de validação: ${errors.join(", ")}`,
      });
    }

    // Erro de conexão com banco
    if (error.name === "SequelizeConnectionError") {
      return res.status(500).json({
        success: false,
        error: "Erro de conexão com o banco de dados",
      });
    }

    // Erro genérico
    return res.status(500).json({
      success: false,
      error: "Erro interno ao salvar entrada no diário",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// @route   GET /api/diary-entries/user/:userId
// @desc    Obter todas as entradas de um usuário
// @access  Private
router.get("/diary-entries/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const entries = await DiaryEntry.findAll({
      where: { user_id: userId },
      order: [["date", "DESC"]],
    });

    return res.json({
      success: true,
      data: entries,
      count: entries.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar entradas:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar entradas do diário",
    });
  }
});

// @route   GET /api/diary-entries/user/:userId/date/:date
// @desc    Obter entrada específica por data
// @access  Private
router.get("/diary-entries/user/:userId/date/:date", async (req, res) => {
  try {
    const { userId, date } = req.params;

    const entry = await DiaryEntry.findOne({
      where: {
        user_id: userId,
        date: date,
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: "Entrada não encontrada para esta data",
      });
    }

    return res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar entrada:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar entrada",
    });
  }
});

// @route   PUT /api/diary-entries/:id
// @desc    Atualizar uma entrada do diário
// @access  Private
router.put("/diary-entries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remover campos que não podem ser atualizados
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;

    const entry = await DiaryEntry.findByPk(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: "Entrada não encontrada",
      });
    }

    await entry.update(updates);

    return res.json({
      success: true,
      message: "Entrada atualizada com sucesso",
      data: entry,
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar entrada:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao atualizar entrada",
    });
  }
});

// @route   DELETE /api/diary-entries/:id
// @desc    Deletar uma entrada do diário
// @access  Private
router.delete("/diary-entries/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await DiaryEntry.findByPk(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: "Entrada não encontrada",
      });
    }

    await entry.destroy();

    return res.json({
      success: true,
      message: "Entrada deletada com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao deletar entrada:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao deletar entrada",
    });
  }
});

// @route   GET /api/diary-entries/user/:userId/stats
// @desc    Obter estatísticas do usuário
// @access  Private
router.get("/diary-entries/user/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;

    const entries = await DiaryEntry.findAll({
      where: { user_id: userId },
      attributes: ["date", "time_online", "mood"],
      order: [["date", "ASC"]],
    });

    if (entries.length === 0) {
      return res.json({
        success: true,
        data: {
          totalEntries: 0,
          avgTimeOnline: 0,
          moodDistribution: {},
          recentEntries: [],
        },
      });
    }

    // Calcular estatísticas
    const totalHours = entries.reduce(
      (sum, entry) => sum + entry.time_online,
      0
    );
    const avgTimeOnline = totalHours / entries.length;

    // Distribuição de humor
    const moodDistribution = {};
    entries.forEach((entry) => {
      moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
    });

    // Últimas 7 entradas
    const recentEntries = entries.slice(-7).reverse();

    return res.json({
      success: true,
      data: {
        totalEntries: entries.length,
        avgTimeOnline: parseFloat(avgTimeOnline.toFixed(2)),
        moodDistribution,
        recentEntries,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao calcular estatísticas:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao calcular estatísticas",
    });
  }
});

module.exports = router;
