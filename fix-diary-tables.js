// fix-diary-tables.js
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixDiaryTables() {
  const client = await pool.connect();

  try {
    console.log("🔧 Criando/verificando tabela diary_entries...\n");

    // 1. Criar tabela diary_entries se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS diary_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        date DATE NOT NULL,
        time_online INTEGER NOT NULL CHECK (time_online >= 0 AND time_online <= 24),
        mood VARCHAR(50) NOT NULL,
        triggers TEXT,
        activities JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )
    `);
    console.log("✅ Tabela diary_entries verificada/criada");

    // 2. Criar índice para melhor performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id
      ON diary_entries(user_id)
    `);
    console.log("✅ Índice user_id criado");

    // 3. Criar índice para data
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_diary_entries_date
      ON diary_entries(date)
    `);
    console.log("✅ Índice date criado");

    // 4. Verificar se há dados de teste para o usuário ID 1
    const today = new Date().toISOString().split("T")[0];

    const existingEntry = await client.query(
      "SELECT * FROM diary_entries WHERE user_id = $1 AND date = $2",
      [1, today]
    );

    if (existingEntry.rows.length === 0) {
      console.log("\n📝 Inserindo entrada de teste para hoje...");

      await client.query(
        `INSERT INTO diary_entries
         (user_id, date, time_online, mood, triggers, activities)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          1,
          today,
          5,
          "Feliz",
          "Testando o aplicativo",
          JSON.stringify(["Redes sociais", "Estudos", "Trabalho"]),
        ]
      );
      console.log("✅ Entrada de teste inserida");
    } else {
      console.log("\n⚠️  Entrada para hoje já existe para o usuário ID 1");
    }

    // 5. Mostrar estatísticas
    const stats = await client.query(`
      SELECT
        COUNT(*) as total_entries,
        COUNT(DISTINCT user_id) as total_users,
        MIN(date) as oldest_entry,
        MAX(date) as newest_entry
      FROM diary_entries
    `);

    console.log("\n📊 Estatísticas da tabela diary_entries:");
    console.log("   Total de entradas:", stats.rows[0].total_entries);
    console.log("   Total de usuários:", stats.rows[0].total_users);
    console.log("   Entrada mais antiga:", stats.rows[0].oldest_entry);
    console.log("   Entrada mais recente:", stats.rows[0].newest_entry);
  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDiaryTables()
  .then(() => {
    console.log("\n✅ Tabela diary_entries corrigida com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha:", error);
    process.exit(1);
  });
