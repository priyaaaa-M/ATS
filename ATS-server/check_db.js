const postgres = require('postgres');
const config = require('./dist/src/config/index.js');
const sql = postgres(config.config.supabase.dbUrl, { ssl: config.config.isDev ? { rejectUnauthorized: false } : 'require' });
async function check() {
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'candidates'`;
  console.log(cols.map(c => c.column_name).join(', '));
  process.exit(0);
}
check();
