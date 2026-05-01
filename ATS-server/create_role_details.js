const postgres = require('postgres');
const config = require('./dist/src/config/index.js');
const sql = postgres(config.config.supabase.dbUrl, { ssl: config.config.isDev ? { rejectUnauthorized: false } : 'require' });

async function migrate() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS role_details (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid REFERENCES companies(id),
        user_id uuid REFERENCES users(id),
        name text NOT NULL,
        title text,
        description text,
        hiring_goals text,
        salary_min integer,
        salary_max integer,
        salary_currency text DEFAULT 'INR',
        expectations text,
        activities text,
        work_tags jsonb,
        selling_points text,
        screening_guide text,
        outreach_template text,
        screening_questions jsonb,
        interview_stages jsonb,
        status text DEFAULT 'open',
        hiring_manager_id uuid REFERENCES users(id),
        assigned_recruiter_ids jsonb,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `;
    console.log("Table role_details created successfully");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    process.exit(0);
  }
}
migrate();
