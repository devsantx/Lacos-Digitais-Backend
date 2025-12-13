// create-institutions-table.js
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createInstitutionsTable() {
  const client = await pool.connect();

  try {
    console.log("🔧 Verificando tabela institutions...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS institutions (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        matricula VARCHAR(50) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(50),
        endereco TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tabela institutions verificada/criada");

    // Inserir dados de teste
    const bcrypt = require("bcrypt");
    const senhaHash = await bcrypt.hash("teste123", 10);

    await client.query(
      `
      INSERT INTO institutions (nome, matricula, senha, email, ativo)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (matricula) DO UPDATE
      SET senha = EXCLUDED.senha,
          nome = EXCLUDED.nome,
          email = EXCLUDED.email
      RETURNING id
    `,
      [
        "Instituição de Teste - UNINASSAU",
        "20231234",
        senhaHash,
        "teste@uninassau.edu.br",
        true,
      ]
    );

    console.log("✅ Dados de teste inseridos/atualizados");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createInstitutionsTable()
  .then(() => {
    console.log("\n🎉 Tabela institutions configurada!");
    console.log("\n🔑 Credenciais de teste:");
    console.log("   Matrícula: 20231234");
    console.log("   Senha: teste123");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha:", error);
    process.exit(1);
  });
