// fix-institutions-complete.js
require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixInstitutions() {
  const client = await pool.connect();

  try {
    console.log("🔧 Verificando e corrigindo tabela institutions...\n");

    // 1. Verificar se a tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'institutions'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log("📦 Criando tabela institutions...");

      await client.query(`
        CREATE TABLE institutions (
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

      console.log("✅ Tabela institutions criada!");
    } else {
      console.log("✅ Tabela institutions já existe");
    }

    // 2. Verificar se já existe a instituição de teste
    const testInst = await client.query(
      "SELECT * FROM institutions WHERE matricula = $1",
      ["20231234"]
    );

    const senhaHash = await bcrypt.hash("teste123", 10);

    if (testInst.rows.length === 0) {
      console.log("\n📝 Inserindo instituição de teste...");

      const result = await client.query(
        `INSERT INTO institutions
         (nome, matricula, senha, email, telefone, ativo)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          "Instituição de Teste - UNINASSAU",
          "20231234",
          senhaHash,
          "teste@uninassau.edu.br",
          "(11) 99999-9999",
          true,
        ]
      );

      console.log("✅ Instituição de teste inserida!");
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Nome: ${result.rows[0].nome}`);
    } else {
      console.log("\n🔄 Instituição de teste já existe, atualizando...");

      await client.query(
        `UPDATE institutions
         SET nome = $1, senha = $2, email = $3, ativo = $4
         WHERE matricula = $5`,
        [
          "Instituição de Teste - UNINASSAU",
          senhaHash,
          "teste@uninassau.edu.br",
          true,
          "20231234",
        ]
      );

      console.log("✅ Instituição de teste atualizada!");
      console.log(`   ID: ${testInst.rows[0].id}`);
      console.log(`   Nome: ${testInst.rows[0].nome}`);
    }

    // 3. Listar todas as instituições
    const allInstitutions = await client.query(
      "SELECT id, nome, matricula, email, ativo FROM institutions ORDER BY id"
    );

    console.log("\n📋 Todas as instituições:");
    if (allInstitutions.rows.length === 0) {
      console.log("   ⚠️  Nenhuma instituição encontrada");
    } else {
      allInstitutions.rows.forEach((inst) => {
        console.log(
          `   - ID: ${inst.id}, Nome: ${inst.nome}, Matrícula: ${inst.matricula}, Ativo: ${inst.ativo}`
        );
      });
    }

    // 4. Testar login diretamente no banco
    console.log("\n🧪 Testando login no banco...");

    const loginTest = await client.query(
      "SELECT id, nome, senha FROM institutions WHERE matricula = $1",
      ["20231234"]
    );

    if (loginTest.rows.length > 0) {
      const inst = loginTest.rows[0];
      console.log(`   ✅ Instituição encontrada: ${inst.nome}`);
      console.log(`   🔑 Senha hash: ${inst.senha.substring(0, 30)}...`);

      // Testar senha
      const passwordMatch = await bcrypt.compare("teste123", inst.senha);
      console.log(
        `   🧪 Teste de senha (teste123): ${
          passwordMatch ? "✅ CORRETA" : "❌ INCORRETA"
        }`
      );
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
    console.error("📋 Stack:", error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixInstitutions()
  .then(() => {
    console.log("\n🎉 Tabela institutions verificada e corrigida!");
    console.log("\n🔑 Credenciais de teste:");
    console.log("   Matrícula: 20231234");
    console.log("   Senha: teste123");
    console.log("\n🌐 Teste o login com:");
    console.log(
      "   curl -X POST https://lacos-digitais-api.onrender.com/api/institutional/login \\"
    );
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"matricula":"20231234","senha":"teste123"}\'');
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha:", error);
    process.exit(1);
  });
