// create-articles-table.js
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createArticlesTables() {
  const client = await pool.connect();

  try {
    console.log("🔧 Criando tabelas para artigos institucionais...");

    // 1. Tabela institutional_articles
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

    // 2. Tabela article_views
    await client.query(`
      CREATE TABLE IF NOT EXISTS article_views (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES institutional_articles(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela article_views criada");

    // 3. Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_institutional_articles_institution
      ON institutional_articles(institution_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_institutional_articles_status
      ON institutional_articles(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_institutional_articles_category
      ON institutional_articles(category)
    `);
    console.log("✅ Índices criados");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createArticlesTables()
  .then(() => {
    console.log("\n🎉 Tabelas de artigos configuradas!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha:", error);
    process.exit(1);
  });
