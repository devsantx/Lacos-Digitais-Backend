/// src/controllers/institutionalController.js
const pool = require("../config/pool");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ============================================================
// AUTENTICAÇÃO
// ============================================================

// Login de Instituição
exports.login = async (req, res) => {
  const client = await pool.connect();

  try {
    const { matricula, senha } = req.body;

    console.log("🔐 Tentativa de login institucional:", {
      matricula,
      senha: senha ? "***" : "missing",
    });

    if (!matricula || !senha) {
      console.warn("❌ Login falhou: Matrícula ou senha faltando");
      return res.status(400).json({
        success: false,
        error: "Matrícula e senha são obrigatórios",
      });
    }

    // Buscar instituição usando pool do PostgreSQL
    console.log(`🔍 Buscando instituição com matrícula: ${matricula}`);
    const result = await client.query(
      "SELECT * FROM institutions WHERE matricula = $1",
      [matricula]
    );

    const institution = result.rows[0];

    if (!institution) {
      console.warn(`❌ Instituição não encontrada: ${matricula}`);
      return res.status(401).json({
        success: false,
        error: "Matrícula ou senha incorretos",
      });
    }

    console.log(
      `✅ Instituição encontrada: ${institution.nome} (ID: ${institution.id})`
    );
    console.log(`🔐 Verificando senha...`);

    if (!institution.ativo) {
      console.warn(`⚠️  Instituição inativa: ${matricula}`);
      return res.status(401).json({
        success: false,
        error: "Instituição inativa",
      });
    }

    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, institution.senha);

    if (!senhaCorreta) {
      console.warn(`❌ Senha incorreta para: ${matricula}`);
      return res.status(401).json({
        success: false,
        error: "Matrícula ou senha incorretos",
      });
    }

    // Gerar token JWT
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET não configurado no ambiente");
      throw new Error("JWT_SECRET não configurado");
    }

    const token = jwt.sign(
      {
        institutionId: institution.id,
        type: "institution",
        nome: institution.nome,
        matricula: institution.matricula,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Não retornar senha
    delete institution.senha;

    console.log(`✅ Login bem-sucedido para: ${institution.nome}`);
    console.log(`🔑 Token JWT gerado: ${token.substring(0, 20)}...`);

    res.json({
      success: true,
      message: "Login realizado com sucesso",
      token,
      institution,
    });
  } catch (error) {
    console.error("❌ Erro no login institucional:", error);
    console.error("📋 Stack:", error.stack);

    res.status(500).json({
      success: false,
      error: "Erro ao fazer login",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

// ============================================================
// ARTIGOS
// ============================================================

// Criar novo artigo
exports.createArticle = async (req, res) => {
  const client = await pool.connect();

  try {
    const { title, authors, summary, category, url, keywords } = req.body;
    const institutionId = req.institutionId;

    // Validações
    if (!title || !authors || !summary || !category || !url) {
      return res.status(400).json({
        success: false,
        error: "Campos obrigatórios faltando",
      });
    }

    // Validar URL
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({
        success: false,
        error: "URL inválida",
      });
    }

    // Inserir artigo
    const result = await client.query(
      `INSERT INTO institutional_articles
       (institution_id, title, authors, summary, category, url, keywords, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [institutionId, title, authors, summary, category, url, keywords || null]
    );

    res.status(201).json({
      success: true,
      message: "Artigo enviado para análise",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao criar artigo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar artigo",
    });
  } finally {
    client.release();
  }
};

// Listar artigos da instituição
exports.getArticles = async (req, res) => {
  const client = await pool.connect();

  try {
    const institutionId = req.institutionId;
    const { status } = req.query;

    let query = `
      SELECT * FROM institutional_articles
      WHERE institution_id = $1
    `;
    const params = [institutionId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar artigos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar artigos",
    });
  } finally {
    client.release();
  }
};

// Buscar artigo específico
exports.getArticleById = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const institutionId = req.institutionId;

    const result = await client.query(
      `SELECT * FROM institutional_articles
       WHERE id = $1 AND institution_id = $2`,
      [id, institutionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Artigo não encontrado",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao buscar artigo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar artigo",
    });
  } finally {
    client.release();
  }
};

// Atualizar artigo (somente se status = pending)
exports.updateArticle = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const institutionId = req.institutionId;
    const { title, authors, summary, category, url, keywords } = req.body;

    // Verificar se artigo existe e pertence à instituição
    const checkResult = await client.query(
      `SELECT status FROM institutional_articles
       WHERE id = $1 AND institution_id = $2`,
      [id, institutionId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Artigo não encontrado",
      });
    }

    // Só permite editar se estiver pendente
    if (checkResult.rows[0].status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Apenas artigos pendentes podem ser editados",
      });
    }

    // Atualizar
    const result = await client.query(
      `UPDATE institutional_articles
       SET title = $1, authors = $2, summary = $3,
           category = $4, url = $5, keywords = $6
       WHERE id = $7 AND institution_id = $8
       RETURNING *`,
      [title, authors, summary, category, url, keywords, id, institutionId]
    );

    res.json({
      success: true,
      message: "Artigo atualizado com sucesso",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar artigo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar artigo",
    });
  } finally {
    client.release();
  }
};

// Deletar artigo
exports.deleteArticle = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const institutionId = req.institutionId;

    const result = await client.query(
      `DELETE FROM institutional_articles
       WHERE id = $1 AND institution_id = $2
       RETURNING *`,
      [id, institutionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Artigo não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Artigo excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar artigo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar artigo",
    });
  } finally {
    client.release();
  }
};

// ============================================================
// ESTATÍSTICAS
// ============================================================

exports.getStats = async (req, res) => {
  const client = await pool.connect();

  try {
    const institutionId = req.institutionId;

    // Total de artigos
    const totalResult = await client.query(
      `SELECT COUNT(*) as total FROM institutional_articles
       WHERE institution_id = $1`,
      [institutionId]
    );

    // Total de visualizações
    const viewsResult = await client.query(
      `SELECT SUM(views) as total_views
       FROM institutional_articles
       WHERE institution_id = $1`,
      [institutionId]
    );

    // Artigos por categoria
    const categoryResult = await client.query(
      `SELECT category, COUNT(*) as count, SUM(views) as views
       FROM institutional_articles
       WHERE institution_id = $1
       GROUP BY category
       ORDER BY views DESC`,
      [institutionId]
    );

    // Top 3 artigos mais vistos
    const topResult = await client.query(
      `SELECT title, category, views
       FROM institutional_articles
       WHERE institution_id = $1
       ORDER BY views DESC
       LIMIT 3`,
      [institutionId]
    );

    // Visualizações por mês (últimos 4 meses)
    const monthlyResult = await client.query(
      `SELECT
         TO_CHAR(created_at, 'Mon') as month,
         SUM(views) as views
       FROM institutional_articles
       WHERE institution_id = $1
         AND created_at >= NOW() - INTERVAL '4 months'
       GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) ASC`,
      [institutionId]
    );

    const totalArticles = parseInt(totalResult.rows[0].total);
    const totalViews = parseInt(viewsResult.rows[0].total_views || 0);

    res.json({
      success: true,
      data: {
        overview: {
          totalArticles,
          totalViews,
          avgViewsPerArticle:
            totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0,
        },
        articlesByCategory: categoryResult.rows,
        topArticles: topResult.rows,
        monthlyViews: monthlyResult.rows,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar estatísticas",
    });
  } finally {
    client.release();
  }
};

// ============================================================
// ARTIGOS PÚBLICOS (sem autenticação)
// ============================================================

// Listar artigos aprovados (para área pública)
exports.getPublicArticles = async (req, res) => {
  const client = await pool.connect();

  try {
    const { category, limit = 50 } = req.query;

    let query = `
      SELECT
        ia.*,
        i.nome as institution_name
      FROM institutional_articles ia
      LEFT JOIN institutions i ON ia.institution_id = i.id
      WHERE ia.status = 'approved'
    `;

    const params = [];

    if (category) {
      params.push(category);
      query += ` AND ia.category = $${params.length}`;
    }

    query += ` ORDER BY ia.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar artigos públicos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar artigos",
    });
  } finally {
    client.release();
  }
};

// Incrementar visualizações
exports.incrementViews = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    // Incrementar contador de views
    await client.query(
      `UPDATE institutional_articles
       SET views = views + 1
       WHERE id = $1`,
      [id]
    );

    // Registrar visualização
    await client.query(`INSERT INTO article_views (article_id) VALUES ($1)`, [
      id,
    ]);

    res.json({
      success: true,
      message: "Visualização registrada",
    });
  } catch (error) {
    console.error("Erro ao registrar visualização:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao registrar visualização",
    });
  } finally {
    client.release();
  }
};
