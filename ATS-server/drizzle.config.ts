import type { Config } from 'drizzle-kit'
import 'dotenv/config'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_POOLER_URL ||
  process.env.SUPABASE_DB_URL ||
  ''

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString,
  },
} satisfies Config
