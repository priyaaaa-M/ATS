import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'
import { config } from '../config'
import * as schema from './schema'

const client = postgres(config.supabase.dbUrl, {
  ssl: config.isDev ? false : 'require',
  max: 10,
})

export const db = drizzle(client, { schema })
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey
)
export type DB = typeof db
