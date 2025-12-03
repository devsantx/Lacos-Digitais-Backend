const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

const DiaryEntry = require("../models/DiaryEntry");
const UserAchievement = require("../models/UserAchievement");
const Achievement = require("../models/Achievement");

/**
 * ============================================================
 * DIÁRIO – Criar entrada
 * ============================================================
 */
router.post("/diary-entries", authMiddleware, async (req, res) => {
  try {
    const { date, time_online, mood, triggers, activities } = req.body;
    const userId = req.userId;

    if (!date || time_online === undefined || !mood) {
      return res.status(400).json({
        success: false,
        error: "Data, horas e humor são obrigatórios",
      });
    }

    const entry = await DiaryEntry.create({
      user_id: userId,
      date,
      time_online: parseInt(time_online),
      mood,
      triggers: triggers || "",
      activities: activities || [],
    });

    await checkAndUnlockAchievements(userId);

    res.status(201).json({
      success: true,
      message: "Entrada salva com sucesso",
      data: entry,
    });
  } catch (error) {
    console.error("❌ Erro ao criar entrada:", error);
    res.status(500).json({ success: false, error: "Erro ao salvar entrada" });
  }
});

/**
 * ============================================================
 * DIÁRIO – Obter entradas do usuário
 * ============================================================
 */
router.get("/diary-entries/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const entries = await DiaryEntry.findAll({
      where: { user_id: userId },
      order: [["date", "DESC"]],
      limit: 30,
    });

    res.json({ success: true, data: entries || [] });
  } catch (error) {
    console.error("❌ Erro ao buscar entradas do diário:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar entradas" });
  }
});

/**
 * ============================================================
 * CONQUISTAS – Obter conquistas do usuário
 * ============================================================
 */
router.get("/user-achievements/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const achievements = await UserAchievement.findAll({
      where: { user_id: userId },
      include: [Achievement],
      order: [["unlocked_at", "DESC"]],
    });

    res.json({ success: true, data: achievements || [] });
  } catch (error) {
    console.error("❌ Erro ao buscar conquistas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar conquistas",
    });
  }
});

/**
 * ============================================================
 * CONQUISTAS – Verificar e desbloquear
 * (somente conquistas baseadas em diário)
 * ============================================================
 */
router.post("/user-achievements/check", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

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

/**
 * ============================================================
 * FUNÇÃO AUXILIAR – Verifica conquistas do diário
 * ============================================================
 */
async function checkAndUnlockAchievements(userId) {
  try {
    const unlocked = [];

    const allAchievements = await Achievement.findAll();

    for (const achievement of allAchievements) {
      const requirement = achievement.requirement;

      // se não for conquista baseada em diário, pula
      if (
        requirement.type !== "diary_entries" &&
        requirement.type !== "consecutive_days" &&
        requirement.type !== "total_days"
      ) {
        continue;
      }

      const already = await UserAchievement.findOne({
        where: { user_id: userId, achievement_id: achievement.id },
      });

      if (already) continue;

      // -------- diary_entries --------
      if (requirement.type === "diary_entries") {
        const count = await DiaryEntry.count({ where: { user_id: userId } });

        if (count >= requirement.value) {
          await UserAchievement.create({
            user_id: userId,
            achievement_id: achievement.id,
          });
          unlocked.push(achievement);
        }
      }

      // -------- consecutive_days --------
      if (requirement.type === "consecutive_days") {
        const entries = await DiaryEntry.findAll({
          where: { user_id: userId },
          order: [["date", "DESC"]],
          limit: requirement.value + 3,
        });

        if (entries.length >= requirement.value) {
          await UserAchievement.create({
            user_id: userId,
            achievement_id: achievement.id,
          });
          unlocked.push(achievement);
        }
      }

      // -------- total_days --------
      if (requirement.type === "total_days") {
        const count = await DiaryEntry.count({ where: { user_id: userId } });

        if (count >= requirement.value) {
          await UserAchievement.create({
            user_id: userId,
            achievement_id: achievement.id,
          });
          unlocked.push(achievement);
        }
      }
    }

    return unlocked;
  } catch (err) {
    console.error("❌ Erro ao verificar conquistas:", err);
    return [];
  }
}

module.exports = router;
