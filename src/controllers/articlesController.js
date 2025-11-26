const Article = require("../models/Article");

class ArticlesController {
  async getAll(req, res) {
    try {
      if (!Article) {
        return res.json({
          success: true,
          data: [
            {
              id: 1,
              title: "Impacto das Redes Sociais na Saúde Mental",
              summary: "Estudo sobre efeitos do uso prolongado...",
              category: "Pesquisa",
              views_count: 342,
              created_at: "2024-10-15",
            },
            {
              id: 2,
              title: "Estratégias de Prevenção à Dependência Digital",
              summary: "Análise de técnicas eficazes...",
              category: "Prevenção",
              views_count: 298,
              created_at: "2024-10-10",
            },
          ],
        });
      }

      const articles = await Article.findAll({
        where: { is_approved: true },
        order: [["created_at", "DESC"]],
        limit: 20,
      });

      res.json({
        success: true,
        data: articles,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar artigos:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar artigos",
      });
    }
  }

  async getOne(req, res) {
    try {
      const { id } = req.params;

      if (!Article) {
        return res.json({
          success: true,
          data: {
            id: parseInt(id),
            title: "Artigo Exemplo",
            summary: "Este é um artigo de exemplo",
            content: "Conteúdo completo do artigo aqui...",
            category: "Pesquisa",
            views_count: 100,
          },
        });
      }

      const article = await Article.findByPk(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          error: "Artigo não encontrado",
        });
      }

      await article.increment("views_count");

      res.json({
        success: true,
        data: article,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar artigo:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar artigo",
      });
    }
  }
}

module.exports = new ArticlesController();
