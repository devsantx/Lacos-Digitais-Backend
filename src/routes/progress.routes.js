const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const DiaryEntry = require("../models/DiaryEntry");
const Goal = require("../models/Goal");
const UserAchievement = require("../models/UserAchievement");
const Achievement = require("../models/Achievement");

// ============================================================
// DIÁRIO - Criar entrada
// ============================================================
router.post("/diary-entries", authMiddleware, async (req, res) => {
  try {
    const { date, time_online, mood, triggers, activities } = req.body;
    const userId = req.userId;

    // Validação
    if (!date || time_online === undefined || !mood) {
      return res.status(400).json({
        success: false,
        error: "Data, horas e humor são obrigatórios",
      });
    }

    console.log(`📓 Criando entrada no diário para usuário ${userId}`);

    // Criar entrada
    const entry = await DiaryEntry.create({
      user_id: userId,
      date,
      time_online: parseInt(time_online),
      mood,
      triggers: triggers || "",
      activities: activities || [],
    });

    // Verificar conquistas após salvar
    await checkAndUnlockAchievements(userId);

    res.status(201).json({
      success: true,
      message: "Entrada salva com sucesso",
      data: entry,
    });
  } catch (error) {
    console.error("❌ Erro ao criar entrada no diário:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao salvar entrada",
    });
  }
});

// ============================================================
// DIÁRIO - Obter entradas do usuário
// ============================================================
router.get("/diary-entries/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`📚 Buscando entradas do diário de ${userId}`);

    const entries = await DiaryEntry.findAll({
      where: { user_id: userId },
      order: [["date", "DESC"]],
      limit: 30,
    });

    res.json({
      success: true,
      data: entries || [],
    });
  } catch (error) {
    console.error("❌ Erro ao buscar entradas do diário:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar entradas",
    });
  }
});

// ============================================================
// METAS - Criar meta
// ============================================================
router.post("/goals", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      target_value,
      frequency,
      start_date,
      end_date,
    } = req.body;
    const userId = req.userId;

    // Validação
    if (!title || !target_value || !frequency || !start_date) {
      return res.status(400).json({
        success: false,
        error:
          "Título, valor alvo, frequência e data de início são obrigatórios",
      });
    }

    console.log(`🎯 Criando meta para usuário ${userId}: ${title}`);

    const goal = await Goal.create({
      user_id: userId,
      title,
      description: description || "",
      target_value: parseInt(target_value),
      current_value: 0,
      frequency,
      start_date,
      end_date: end_date || null,
    });

    res.status(201).json({
      success: true,
      message: "Meta criada com sucesso",
      data: goal,
    });
  } catch (error) {
    console.error("❌ Erro ao criar meta:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar meta",
    });
  }
});

// ============================================================
// METAS - Obter metas do usuário
// ============================================================
router.get("/goals/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🎯 Buscando metas de ${userId}`);

    const goals = await Goal.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: goals || [],
    });
  } catch (error) {
    console.error("❌ Erro ao buscar metas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar metas",
    });
  }
});

// ============================================================
// METAS - Atualizar progresso da meta
// ============================================================
router.put("/goals/:goalId", authMiddleware, async (req, res) => {
  try {
    const { goalId } = req.params;
    const { current_value } = req.body;

    if (current_value === undefined) {
      return res.status(400).json({
        success: false,
        error: "Valor atual é obrigatório",
      });
    }

    console.log(`📈 Atualizando meta ${goalId}`);

    const goal = await Goal.findByPk(goalId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        error: "Meta não encontrada",
      });
    }

    // Verificar se atingiu o alvo
    const isCompleted = parseInt(current_value) >= goal.target_value;

    await goal.update({
      current_value: parseInt(current_value),
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date() : null,
    });

    // Verificar conquistas
    await checkAndUnlockAchievements(goal.user_id);

    res.json({
      success: true,
      message: "Meta atualizada com sucesso",
      data: goal,
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar meta:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar meta",
    });
  }
});

// ============================================================
// CONQUISTAS - Obter conquistas do usuário
// ============================================================
router.get("/user-achievements/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🏆 Buscando conquistas de ${userId}`);

    const achievements = await UserAchievement.findAll({
      where: { user_id: userId },
      include: [Achievement],
      order: [["unlocked_at", "DESC"]],
    });

    res.json({
      success: true,
      data: achievements || [],
    });
  } catch (error) {
    console.error("❌ Erro ao buscar conquistas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar conquistas",
    });
  }
});

// ============================================================
// CONQUISTAS - Verificar e desbloquear novas conquistas
// ============================================================
router.post("/user-achievements/check", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    console.log(`🔓 Verificando conquistas para usuário ${userId}`);

    const unlockedAchievements = await checkAndUnlockAchievements(userId);

    res.json({
      success: true,
      message: "Conquistas verificadas",
      data: unlockedAchievements || [],
    });
  } catch (error) {
    console.error("❌ Erro ao verificar conquistas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao verificar conquistas",
    });
  }
});

// ============================================================
// FUNÇÃO AUXILIAR: Verificar e desbloquear conquistas
// ============================================================
async function checkAndUnlockAchievements(userId) {
  try {
    const unlockedAchievements = [];

    // Buscar todas as conquistas
    const allAchievements = await Achievement.findAll();

    for (const achievement of allAchievements) {
      // Verificar se já foi desbloqueada
      const alreadyUnlocked = await UserAchievement.findOne({
        where: { user_id: userId, achievement_id: achievement.id },
      });

      if (alreadyUnlocked) {
        continue; // Já desbloqueada, pula
      }

      // Verificar se atende aos requisitos
      const requirement = achievement.requirement;

      if (requirement.type === "diary_entries") {
        // Contar entradas no diário
        const entriesCount = await DiaryEntry.count({
          where: { user_id: userId },
        });

        if (entriesCount >= requirement.value) {
          // Desbloquear!
          await UserAchievement.create({
            user_id: userId,
            achievement_id: achievement.id,
          });
          unlockedAchievements.push(achievement);
          console.log(`🏆 Conquista desbloqueada: ${achievement.name}`);
        }
      }

      if (requirement.type === "consecutive_days") {
        // Verificar dias consecutivos
        const entries = await DiaryEntry.findAll({
          where: { user_id: userId },
          order: [["date", "DESC"]],
          limit: requirement.value + 5,
        });

        if (entries.length >= requirement.value) {
          // Simplificado: apenas verificar se tem X entradas
          await UserAchievement.create({
            user_id: userId,
            achievement_id: achievement.id,
          });
          unlockedAchievements.push(achievement);
          console.log(`🏆 Conquista desbloqueada: ${achievement.name}`);
        }
      }

      if (requirement.type === "total_days") {
        // Contar dias totais
        const entriesCount = await DiaryEntry.count({
          where: { user_id: userId },
        });

        if (entriesCount >= requirement.value) {
          await UserAchievement.create({
            user_id: userId,
            achievement_id: achievement.id,
          });
          unlockedAchievements.push(achievement);
          console.log(`🏆 Conquista desbloqueada: ${achievement.name}`);
          api;
        }
      }

      if (requirement.type === "weekly_goals") {
        // Contar metas concluídas
        const completedGoals = await Goal.count({
          where: { user_id: userId, is_completed: true },
        });

        if (completedGoals >= requirement.value) {
          await UserAchievement.create({
            user_id: userId,
            achievement_id: achievement.id,
          });
          unlockedAchievements.push(achievement);
          console.log(`🏆 Conquista desbloqueada: ${achievement.name}`);
        }
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error("❌ Erro ao verificar conquistas:", error);
    return [];
  }
}

module.exports = router;
