import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { AppError } from '../types'

const defaultSources = [
  'On Campus',
  'Off Campus',
  'Referral',
  'LinkedIn',
  'Agency',
  'Career Page',
  'Manual Upload',
]

const sourceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().default(''),
})

let sourceTableReady: Promise<void> | null = null

function normalizeSourceName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function ensureSourceTable() {
  if (!sourceTableReady) {
    sourceTableReady = (async () => {
      await db.execute(sql`create extension if not exists pgcrypto`)
      await db.execute(sql`
        create table if not exists candidate_sources (
          id uuid primary key default gen_random_uuid(),
          company_id uuid references companies(id),
          user_id uuid references users(id),
          name text not null,
          normalized_name text not null,
          description text,
          active boolean default true,
          created_at timestamp default now() not null,
          updated_at timestamp default now() not null
        )
      `)
      await db.execute(sql`
        create unique index if not exists candidate_sources_company_name_idx
        on candidate_sources (company_id, normalized_name)
      `)
    })()
  }

  await sourceTableReady
}

type SourceRow = {
  id: string
  companyId: string | null
  userId: string | null
  name: string
  normalizedName: string
  description: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

async function listRows(companyId: string) {
  return db.execute(sql`
    select
      id,
      company_id as "companyId",
      user_id as "userId",
      name,
      normalized_name as "normalizedName",
      description,
      active,
      created_at as "createdAt",
      updated_at as "updatedAt"
    from candidate_sources
    where company_id = ${companyId}
    order by active desc, name asc
  `) as Promise<SourceRow[]>
}

async function seedDefaults(companyId: string, userId: string) {
  for (const name of defaultSources) {
    const normalized = normalizeSourceName(name)
    await db.execute(sql`
      insert into candidate_sources (
        company_id,
        user_id,
        name,
        normalized_name,
        description
      )
      values (
        ${companyId},
        ${userId},
        ${name},
        ${normalized},
        ''
      )
      on conflict (company_id, normalized_name) do nothing
    `)
  }
}

export const sourceService = {
  normalizeSourceName,

  list: async (companyId: string, userId: string) => {
    await ensureSourceTable()
    let rows = await listRows(companyId)

    if (rows.length === 0) {
      await seedDefaults(companyId, userId)
      rows = await listRows(companyId)
    }

    return rows
  },

  create: async (companyId: string, userId: string, input: unknown) => {
    await ensureSourceTable()
    const payload = sourceSchema.parse(input)
    const normalized = normalizeSourceName(payload.name)

    if (!normalized) {
      throw new AppError('Source name is required', 400)
    }

    const [created] = await db.execute(sql`
      insert into candidate_sources (
        company_id,
        user_id,
        name,
        normalized_name,
        description
      )
      values (
        ${companyId},
        ${userId},
        ${payload.name},
        ${normalized},
        ${payload.description}
      )
      on conflict (company_id, normalized_name)
      do update set
        name = excluded.name,
        description = excluded.description,
        active = true,
        updated_at = now()
      returning
        id,
        company_id as "companyId",
        user_id as "userId",
        name,
        normalized_name as "normalizedName",
        description,
        active,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `) as SourceRow[]

    return created
  },

  update: async (companyId: string, sourceId: string, input: unknown) => {
    await ensureSourceTable()
    const payload = z
      .object({
        name: z.string().trim().min(2).max(80).optional(),
        description: z.string().trim().max(240).optional(),
        active: z.boolean().optional(),
      })
      .parse(input)

    const name = payload.name
    const normalized = name ? normalizeSourceName(name) : undefined

    const [updated] = await db.execute(sql`
      update candidate_sources
      set
        name = coalesce(${name ?? null}, name),
        normalized_name = coalesce(${normalized ?? null}, normalized_name),
        description = coalesce(${payload.description ?? null}, description),
        active = coalesce(${payload.active ?? null}, active),
        updated_at = now()
      where id = ${sourceId} and company_id = ${companyId}
      returning
        id,
        company_id as "companyId",
        user_id as "userId",
        name,
        normalized_name as "normalizedName",
        description,
        active,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `) as SourceRow[]

    if (!updated) {
      throw new AppError('Source not found', 404)
    }

    return updated
  },

  deactivate: async (companyId: string, sourceId: string) =>
    sourceService.update(companyId, sourceId, { active: false }),
}
