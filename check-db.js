require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  try {
    console.log("Ì¥ç Verificando institutions...");
    const result = await client.query("SELECT * FROM institutions");
    console.log(`Ì≥ä Total de institui√ß√µes: ${result.rows.length}`);
    result.rows.forEach(row => {
      console.log(`   ID: ${row.id}, Nome: ${row.nome}, Matr√≠cula: ${row.matricula}, Ativo: ${row.ativo}`);
    });
  } catch (error) {
    console.error("‚ùå Erro:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
