import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  brandColor: text('brand_color').default('#6366F1'),
  slackWebhookUrl: text('slack_webhook_url'),
  industry: text('industry'),
  size: text('size'),
  description: text('description'),
  website: text('website'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  name: text('name'),
  email: text('email').notNull().unique(),
  role: text('role').default('hr').notNull(),
  googleAccessToken: text('google_access_token'),
  googleRefreshToken: text('google_refresh_token'),
  googleEmail: text('google_email'),
  invitedByUserId: uuid('invited_by_user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const driveConfigs = pgTable(
  'drive_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    companyId: uuid('company_id').references(() => companies.id),
    driveFolderLink: text('drive_folder_link').notNull(),
    driveFolderId: text('drive_folder_id'),
    lastSyncAt: timestamp('last_sync_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex('drive_configs_user_id_idx').on(table.userId),
  })
)

export const syncStates = pgTable(
  'sync_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    companyId: uuid('company_id').references(() => companies.id),
    isSyncRunning: boolean('is_sync_running').default(false),
    lastSyncStartedAt: timestamp('last_sync_started_at'),
    lastSyncCompletedAt: timestamp('last_sync_completed_at'),
    lastSyncError: text('last_sync_error'),
    totalProcessed: integer('total_processed').default(0),
    totalFailed: integer('total_failed').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex('sync_states_user_id_idx').on(table.userId),
  })
)

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').references(() => companies.id),
    userId: uuid('user_id').references(() => users.id),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    companyRoleIdx: uniqueIndex('roles_company_role_idx').on(
      table.companyId,
      table.name
    ),
  })
)

export const interviewRounds = pgTable(
  'interview_rounds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    companyId: uuid('company_id').references(() => companies.id),
    roleName: text('role_name').notNull(),
    roundNumber: integer('round_number').notNull(),
    interviewerName: text('interviewer_name').notNull(),
    interviewerGmail: text('interviewer_gmail').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userRoleRoundIdx: uniqueIndex('rounds_user_role_round_idx').on(
      table.userId,
      table.roleName,
      table.roundNumber
    ),
  })
)

export const candidates = pgTable(
  'candidates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').references(() => companies.id),
    userId: uuid('user_id').references(() => users.id).notNull(),
    name: text('name'),
    candidateEmail: text('candidate_email'),
    phone: text('phone'),
    role: text('role').notNull(),
    resumeUrl: text('resume_url'),
    driveFileId: text('drive_file_id'),
    status: text('status').default('pending'),
    currentRound: integer('current_round').default(1),
    totalRounds: integer('total_rounds').default(1),
    assignedInterviewerEmail: text('assigned_interviewer_email'),
    roundStatus: text('round_status').default('pending'),
    parsedData: jsonb('parsed_data'),
    atsScore: integer('ats_score'),
    parsedSkills: jsonb('parsed_skills'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    driveFileIdx: uniqueIndex('candidates_drive_file_idx').on(
      table.userId,
      table.driveFileId
    ),
  })
)

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  roleName: text('role_name').notNull(),
  roundNumber: integer('round_number').notNull(),
  used: boolean('used').default(false),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const scheduledInterviews = pgTable('scheduled_interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  interviewerEmail: text('interviewer_email').notNull(),
  roundNumber: integer('round_number').notNull(),
  scheduledStartTime: timestamp('scheduled_start_time', {
    withTimezone: true,
  }).notNull(),
  scheduledEndTime: timestamp('scheduled_end_time', {
    withTimezone: true,
  }).notNull(),
  durationMinutes: integer('duration_minutes').default(45),
  googleEventId: text('google_event_id'),
  meetLink: text('meet_link'),
  status: text('status').default('scheduled'),
  transcriptReceived: boolean('transcript_received').default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const interviewFeedback = pgTable(
  'interview_feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
    roundNumber: integer('round_number').notNull(),
    interviewerEmail: text('interviewer_email').notNull(),
    technicalRating: integer('technical_rating'),
    communicationRating: integer('communication_rating'),
    problemSolvingRating: integer('problem_solving_rating'),
    overallRating: integer('overall_rating'),
    strengths: text('strengths'),
    weaknesses: text('weaknesses'),
    notes: text('notes'),
    recommendation: text('recommendation'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueFeedback: uniqueIndex('feedback_candidate_round_interviewer_idx').on(
      table.candidateId,
      table.roundNumber,
      table.interviewerEmail
    ),
  })
)

export const interviewTranscripts = pgTable('interview_transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  roundNumber: integer('round_number').notNull(),
  interviewerEmail: text('interviewer_email').notNull(),
  readSessionId: text('read_session_id').unique(),
  readMeetingId: text('read_meeting_id').unique(),
  transcriptJson: jsonb('transcript_json'),
  transcriptText: text('transcript_text'),
  summary: text('summary'),
  reportUrl: text('report_url'),
  videoUrl: text('video_url'),
  source: text('source').default('manual'),
  receivedAt: timestamp('received_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Company = typeof companies.$inferSelect
export type Candidate = typeof candidates.$inferSelect
export type NewCandidate = typeof candidates.$inferInsert
export type InterviewRound = typeof interviewRounds.$inferSelect
export type ScheduledInterview = typeof scheduledInterviews.$inferSelect
export type InterviewFeedback = typeof interviewFeedback.$inferSelect
export type InterviewTranscript = typeof interviewTranscripts.$inferSelect
export type Invite = typeof invites.$inferSelect
export type DriveConfig = typeof driveConfigs.$inferSelect
export type SyncState = typeof syncStates.$inferSelect
