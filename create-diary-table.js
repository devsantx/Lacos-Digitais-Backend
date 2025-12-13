// create-diary-table.js
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createDiaryTable() {
  const client = await pool.connect();

  try {
    console.log("🔧 Verificando/criando tabela diary_entries...\n");

    // 1. Verificar se a tabela já existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'diary_entries'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log("✅ Tabela diary_entries já existe");

      // Verificar colunas
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'diary_entries'
        ORDER BY ordinal_position
      `);

      console.log("📋 Colunas existentes:");
      columns.rows.forEach((col) => {
        console.log(
          `   - ${col.column_name} (${col.data_type}) ${
            col.is_nullable === "YES" ? "NULL" : "NOT NULL"
          }`
        );
      });
    } else {
      // 2. Criar tabela se não existir
      console.log("📦 Criando tabela diary_entries...");

      await client.query(`
        CREATE TABLE diary_entries (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          time_online INTEGER NOT NULL CHECK (time_online >= 0 AND time_online <= 24),
          mood VARCHAR(50) NOT NULL,
          triggers TEXT,
          activities JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, date)
        )
      `);

      console.log("✅ Tabela diary_entries criada com sucesso!");
    }

    // 3. Criar índices
    console.log("\n🔍 Criando/verificando índices...");

    const indexes = [
      {
        name: "idx_diary_entries_user_id",
        query:
          "CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id)",
      },
      {
        name: "idx_diary_entries_date",
        query:
          "CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries(date)",
      },
    ];

    for (const index of indexes) {
      await client.query(index.query);
      console.log(`   ✅ Índice ${index.name} verificado`);
    }

    // 4. Testar inserção
    console.log("\n🧪 Testando inserção...");
    const today = new Date().toISOString().split("T")[0];

    try {
      const testInsert = await client.query(
        `
        INSERT INTO diary_entries (user_id, date, time_online, mood, triggers)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, date) DO NOTHING
        RETURNING id
      `,
        [1, today, 5, "Feliz", "Teste de conexão"]
      );

      if (testInsert.rows[0]) {
        console.log("✅ Teste de inserção bem-sucedido!");
        console.log(`   ID criado: ${testInsert.rows[0].id}`);
      } else {
        console.log("⚠️  Registro já existia para hoje (user_id=1)");
      }
    } catch (insertError) {
      console.log(
        "⚠️  Não foi possível inserir registro de teste (pode ser normal se user_id=1 não existir)"
      );
    }

    // 5. Contar registros
    const count = await client.query(
      "SELECT COUNT(*) as total FROM diary_entries"
    );
    console.log(`\n📊 Total de registros na tabela: ${count.rows[0].total}`);
  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    console.error("📋 Stack:", error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createDiaryTable()
  .then(() => {
    console.log("\n🎉 Configuração da tabela diary_entries concluída!");
    console.log("\n🔗 Endpoints disponíveis:");
    console.log("   POST   /api/diary-entries");
    console.log("   GET    /api/diary-entries/user/:userId");
    console.log("   GET    /api/diary-entries/user/:userId/stats");
    console.log("   PUT    /api/diary-entries/:id");
    console.log("   DELETE /api/diary-entries/:id");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha na configuração:", error);
    process.exit(1);
  });
