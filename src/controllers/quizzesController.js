const Quiz = require("../models/Quiz");

class QuizzesController {
  async getAll(req, res) {
    try {
      if (!Quiz) {
        return res.json({
          success: true,
          data: [
            {
              id: 1,
              title: "Teste de Dependência de Internet",
              description: "Responda e veja se você sofre com DI",
              external_url: "https://example.com/quiz1",
              source: "ALUNOS ETVC",
              category: "autoavaliacao",
            },
            {
              id: 2,
              title: "Quiz sobre Uso Consciente da Internet",
              description: "Teste seus conhecimentos",
              external_url: "https://example.com/quiz2",
              source: "Giulia Jacometo",
              category: "educativo",
            },
          ],
        });
      }

      const quizzes = await Quiz.findAll({
        where: { is_active: true },
        order: [["created_at", "DESC"]],
      });

      res.json({
        success: true,
        data: quizzes,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar quizzes:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar quizzes",
      });
    }
  }
}

module.exports = new QuizzesController();
