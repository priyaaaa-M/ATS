const postgres = require('postgres');
const config = require('./dist/src/config/index.js');
const sql = postgres(config.config.supabase.dbUrl, { ssl: config.config.isDev ? { rejectUnauthorized: false } : 'require' });

async function migrate() {
  try {
    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS inbox_status text DEFAULT 'inbox';`;
    console.log("Migration 2 successful");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    process.exit(0);
  }
}
migrate();
