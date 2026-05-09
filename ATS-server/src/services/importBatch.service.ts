import { sql } from 'drizzle-orm'
import { db } from '../db'

let importBatchTableReady: Promise<void> | null = null

async function ensureImportBatchTable() {
  if (!importBatchTableReady) {
    importBatchTableReady = (async () => {
      await db.execute(sql`create extension if not exists pgcrypto`)
      await db.execute(sql`
        create table if not exists import_batches (
          id uuid primary key default gen_random_uuid(),
          company_id uuid references companies(id),
          user_id uuid references users(id) not null,
          role_name text,
          source_name text,
          campaign_name text,
          import_method text not null,
          status text default 'draft' not null,
          total_files integer default 0,
          successful_count integer default 0,
          failed_count integer default 0,
          duplicate_count integer default 0,
          created_at timestamp default now() not null,
          updated_at timestamp default now() not null
        )
      `)
      await db.execute(sql`
        create index if not exists import_batches_user_created_idx
        on import_batches (user_id, created_at desc)
      `)
    })()
  }

  await importBatchTableReady
}

export type ImportBatchRow = {
  id: string
  companyId: string | null
  userId: string
  roleName: string | null
  sourceName: string | null
  campaignName: string | null
  importMethod: string
  status: string
  totalFiles: number
  successfulCount: number
  failedCount: number
  duplicateCount: number
  createdAt: Date
  updatedAt: Date
}

const returning = sql`
  id,
  company_id as "companyId",
  user_id as "userId",
  role_name as "roleName",
  source_name as "sourceName",
  campaign_name as "campaignName",
  import_method as "importMethod",
  status,
  total_files as "totalFiles",
  successful_count as "successfulCount",
  failed_count as "failedCount",
  duplicate_count as "duplicateCount",
  created_at as "createdAt",
  updated_at as "updatedAt"
`

export const importBatchService = {
  create: async (input: {
    companyId?: string | null
    userId: string
    roleName?: string | null
    sourceName?: string | null
    campaignName?: string | null
    importMethod: 'manual' | 'google_drive'
    totalFiles?: number
    status?: string
  }) => {
    await ensureImportBatchTable()
    const [created] = await db.execute(sql`
      insert into import_batches (
        company_id,
        user_id,
        role_name,
        source_name,
        campaign_name,
        import_method,
        status,
        total_files
      )
      values (
        ${input.companyId ?? null},
        ${input.userId},
        ${input.roleName ?? null},
        ${input.sourceName ?? null},
        ${input.campaignName ?? null},
        ${input.importMethod},
        ${input.status ?? 'validating'},
        ${input.totalFiles ?? 0}
      )
      returning ${returning}
    `) as ImportBatchRow[]

    return created
  },

  update: async (
    id: string,
    values: {
      status?: string
      totalFiles?: number
      successfulCount?: number
      failedCount?: number
      duplicateCount?: number
    }
  ) => {
    await ensureImportBatchTable()
    const [updated] = await db.execute(sql`
      update import_batches
      set
        status = coalesce(${values.status ?? null}, status),
        total_files = coalesce(${values.totalFiles ?? null}, total_files),
        successful_count = coalesce(${values.successfulCount ?? null}, successful_count),
        failed_count = coalesce(${values.failedCount ?? null}, failed_count),
        duplicate_count = coalesce(${values.duplicateCount ?? null}, duplicate_count),
        updated_at = now()
      where id = ${id}
      returning ${returning}
    `) as ImportBatchRow[]

    return updated
  },

  listByUser: async (userId: string) => {
    await ensureImportBatchTable()
    return db.execute(sql`
      select ${returning}
      from import_batches
      where user_id = ${userId}
      order by created_at desc
      limit 25
    `) as Promise<ImportBatchRow[]>
  },
}
