// check-database.js
require("dotenv").config();
const { Pool } = require("pg");

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const client = await pool.connect();

  try {
    console.log("🔍 Verificando conexão com o banco de dados...");

    // Testar conexão
    await client.query("SELECT NOW()");
    console.log("✅ Conexão com PostgreSQL estabelecida");

    // Verificar tabela institutions
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    console.log("\n📋 Tabelas existentes:");
    tables.rows.forEach((table) => {
      console.log(`   - ${table.table_name}`);
    });

    // Verificar dados na tabela institutions
    const institutions = await client.query(
      "SELECT id, nome, matricula, ativo FROM institutions"
    );
    console.log("\n👥 Instituições cadastradas:");
    if (institutions.rows.length === 0) {
      console.log("   ⚠️  Nenhuma instituição encontrada");
    } else {
      institutions.rows.forEach((inst) => {
        console.log(
          `   - ID: ${inst.id}, Nome: ${inst.nome}, Matrícula: ${inst.matricula}, Ativo: ${inst.ativo}`
        );
      });
    }

    // Verificar instituição de teste
    const testInst = await client.query(
      "SELECT * FROM institutions WHERE matricula = $1",
      ["20231234"]
    );

    if (testInst.rows.length > 0) {
      console.log("\n✅ Instituição de teste encontrada:");
      console.log(`   ID: ${testInst.rows[0].id}`);
      console.log(`   Nome: ${testInst.rows[0].nome}`);
      console.log(`   Email: ${testInst.rows[0].email}`);
      console.log(`   Ativo: ${testInst.rows[0].ativo}`);
    } else {
      console.log("\n❌ Instituição de teste NÃO encontrada!");
    }
  } catch (error) {
    console.error("❌ Erro ao verificar banco de dados:", error.message);
    console.error("📋 Stack:", error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
