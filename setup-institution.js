// setup-institution.js
// Execute este arquivo na raiz do projeto backend: node setup-institution.js

require("dotenv").config();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function setupInstitution() {
  const client = await pool.connect();

  try {
    console.log("🔧 Configurando instituição de teste...");

    // 1. Criar tabela institutions
    console.log("📋 Criando tabela institutions...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS institutions (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        matricula VARCHAR(50) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefone VARCHAR(50),
        endereco TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela institutions criada");

    // 2. Criar tabela institutional_articles
    console.log("📋 Criando tabela institutional_articles...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS institutional_articles (
        id SERIAL PRIMARY KEY,
        institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        authors TEXT NOT NULL,
        summary TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        url VARCHAR(500) NOT NULL,
        keywords TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        rejection_reason TEXT,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela institutional_articles criada");

    // 3. Criar tabela article_views
    console.log("📋 Criando tabela article_views...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS article_views (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES institutional_articles(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela article_views criada");

    // 4. Criar índices
    console.log("📋 Criando índices...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_institutional_articles_institution
      ON institutional_articles(institution_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_institutional_articles_status
      ON institutional_articles(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_article_views_article
      ON article_views(article_id)
    `);
    console.log("✅ Índices criados");

    // 5. Gerar hash da senha
    console.log("🔐 Gerando hash da senha...");
    const senhaHash = await bcrypt.hash("teste123", 10);
    console.log("✅ Hash gerado:", senhaHash);

    // 6. Inserir instituição de teste
    console.log("📝 Inserindo instituição de teste...");
    const result = await client.query(
      `INSERT INTO institutions (nome, matricula, senha, email, ativo)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (matricula)
       DO UPDATE SET senha = $3
       RETURNING *`,
      [
        "Instituição de Teste - UNINASSAU",
        "20231234",
        senhaHash,
        "teste@uninassau.edu.br",
        true,
      ]
    );

    console.log("✅ Instituição criada/atualizada:");
    console.log("   ID:", result.rows[0].id);
    console.log("   Nome:", result.rows[0].nome);
    console.log("   Matrícula:", result.rows[0].matricula);
    console.log("   Email:", result.rows[0].email);

    console.log("\n🎉 Setup concluído com sucesso!");
    console.log("\n📋 Credenciais de teste:");
    console.log("   Matrícula: 20231234");
    console.log("   Senha: teste123");
  } catch (error) {
    console.error("❌ Erro durante setup:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar setup
setupInstitution()
  .then(() => {
    console.log("\n✅ Processo finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha no processo:", error);
    process.exit(1);
  });
