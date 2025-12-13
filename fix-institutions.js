// fix-institutions.js
// Execute: node fix-institutions.js

require("dotenv").config();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixInstitutions() {
  const client = await pool.connect();

  try {
    console.log("🔧 Corrigindo tabela institutions...\n");

    // 1. Verificar colunas existentes
    const columns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'institutions'
    `);

    const existingColumns = columns.rows.map((row) => row.column_name);
    console.log("📋 Colunas existentes:", existingColumns.join(", "));

    // 2. Adicionar colunas que faltam
    const columnsToAdd = {
      nome: "VARCHAR(255)",
      matricula: "VARCHAR(50) UNIQUE",
      senha: "VARCHAR(255)",
      email: "VARCHAR(255)",
      telefone: "VARCHAR(50)",
      endereco: "TEXT",
      ativo: "BOOLEAN DEFAULT true",
      created_at: "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",
      updated_at: "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",
    };

    for (const [columnName, columnType] of Object.entries(columnsToAdd)) {
      if (!existingColumns.includes(columnName)) {
        console.log(`➕ Adicionando coluna: ${columnName}`);
        try {
          await client.query(`
            ALTER TABLE institutions
            ADD COLUMN IF NOT EXISTS ${columnName} ${columnType}
          `);
          console.log(`   ✅ Coluna ${columnName} adicionada`);
        } catch (error) {
          console.log(
            `   ⚠️  Erro ao adicionar ${columnName}: ${error.message}`
          );
        }
      } else {
        console.log(`   ✓ Coluna ${columnName} já existe`);
      }
    }

    // 3. Verificar se já existe alguma instituição com matrícula 20231234
    const existingInst = await client.query(
      "SELECT * FROM institutions WHERE matricula = $1",
      ["20231234"]
    );

    if (existingInst.rows.length > 0) {
      console.log("\n⚠️  Instituição com matrícula 20231234 já existe");
      console.log("🔐 Atualizando senha...");

      const senhaHash = await bcrypt.hash("teste123", 10);

      await client.query(
        `UPDATE institutions
         SET senha = $1, nome = $2, email = $3, ativo = $4
         WHERE matricula = $5`,
        [
          senhaHash,
          "Instituição de Teste - UNINASSAU",
          "teste@uninassau.edu.br",
          true,
          "20231234",
        ]
      );

      console.log("✅ Instituição atualizada!");
    } else {
      console.log("\n📝 Inserindo instituição de teste...");

      const senhaHash = await bcrypt.hash("teste123", 10);

      const result = await client.query(
        `INSERT INTO institutions
         (nome, matricula, senha, email, ativo)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          "Instituição de Teste - UNINASSAU",
          "20231234",
          senhaHash,
          "teste@uninassau.edu.br",
          true,
        ]
      );

      console.log("✅ Instituição criada!");
      console.log("   ID:", result.rows[0].id);
    }

    console.log("\n🎉 Tabela institutions corrigida com sucesso!");
    console.log("\n📋 Credenciais de teste:");
    console.log("   Matrícula: 20231234");
    console.log("   Senha: teste123");

    // 4. Criar tabelas relacionadas se não existirem
    console.log("\n📋 Criando tabelas relacionadas...");

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
    console.log("✅ Tabela institutional_articles verificada");

    await client.query(`
      CREATE TABLE IF NOT EXISTS article_views (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES institutional_articles(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela article_views verificada");
  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixInstitutions()
  .then(() => {
    console.log("\n✅ Processo finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha:", error);
    process.exit(1);
  });
