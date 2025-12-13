// check-institutions.js
// Execute: node check-institutions.js

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkInstitutions() {
  const client = await pool.connect();

  try {
    console.log("🔍 Verificando estrutura da tabela institutions...\n");

    // Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'institutions'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("❌ Tabela 'institutions' não existe!");
      return;
    }

    console.log("✅ Tabela 'institutions' existe\n");

    // Listar todas as colunas
    const columns = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'institutions'
      ORDER BY ordinal_position;
    `);

    console.log("📋 Colunas atuais da tabela 'institutions':");
    console.log("================================================");
    columns.rows.forEach((col) => {
      const maxLength = col.character_maximum_length
        ? `(${col.character_maximum_length})`
        : "";
      const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL";
      console.log(
        `  ${col.column_name.padEnd(25)} ${col.data_type}${maxLength.padEnd(
          10
        )} ${nullable}`
      );
    });

    console.log("\n");

    // Verificar dados existentes
    const count = await client.query("SELECT COUNT(*) FROM institutions");
    console.log(`📊 Total de registros: ${count.rows[0].count}`);

    if (parseInt(count.rows[0].count) > 0) {
      const data = await client.query("SELECT * FROM institutions LIMIT 5");
      console.log("\n📄 Primeiros registros:");
      console.log(data.rows);
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkInstitutions();
