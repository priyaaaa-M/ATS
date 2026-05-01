const postgres = require('postgres');
const config = require('./dist/src/config/index.js');
const sql = postgres(config.config.supabase.dbUrl, { ssl: config.config.isDev ? { rejectUnauthorized: false } : 'require' });

async function migrate() {
  try {
    await sql`
      ALTER TABLE candidates
      ADD COLUMN IF NOT EXISTS current_stage text,
      ADD COLUMN IF NOT EXISTS stage_history jsonb,
      ADD COLUMN IF NOT EXISTS notes jsonb,
      ADD COLUMN IF NOT EXISTS screening_answers jsonb,
      ADD COLUMN IF NOT EXISTS match_score integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS match_breakdown jsonb;
    `;
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    process.exit(0);
  }
}
migrate();
