"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = exports.interviewTranscripts = exports.interviewFeedback = exports.scheduledInterviews = exports.invites = exports.candidates = exports.interviewRounds = exports.roles = exports.syncStates = exports.driveConfigs = exports.users = exports.companies = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.companies = (0, pg_core_1.pgTable)('companies', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    logoUrl: (0, pg_core_1.text)('logo_url'),
    brandColor: (0, pg_core_1.text)('brand_color').default('#6366F1'),
    slackWebhookUrl: (0, pg_core_1.text)('slack_webhook_url'),
    industry: (0, pg_core_1.text)('industry'),
    size: (0, pg_core_1.text)('size'),
    description: (0, pg_core_1.text)('description'),
    website: (0, pg_core_1.text)('website'),
    funnelConfig: (0, pg_core_1.jsonb)('funnel_config'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id),
    name: (0, pg_core_1.text)('name'),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    role: (0, pg_core_1.text)('role').default('hr').notNull(),
    googleAccessToken: (0, pg_core_1.text)('google_access_token'),
    googleRefreshToken: (0, pg_core_1.text)('google_refresh_token'),
    googleEmail: (0, pg_core_1.text)('google_email'),
    invitedByUserId: (0, pg_core_1.uuid)('invited_by_user_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.driveConfigs = (0, pg_core_1.pgTable)('drive_configs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id),
    driveFolderLink: (0, pg_core_1.text)('drive_folder_link').notNull(),
    driveFolderId: (0, pg_core_1.text)('drive_folder_id'),
    lastSyncAt: (0, pg_core_1.timestamp)('last_sync_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: (0, pg_core_1.uniqueIndex)('drive_configs_user_id_idx').on(table.userId),
}));
exports.syncStates = (0, pg_core_1.pgTable)('sync_states', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id),
    isSyncRunning: (0, pg_core_1.boolean)('is_sync_running').default(false),
    lastSyncStartedAt: (0, pg_core_1.timestamp)('last_sync_started_at'),
    lastSyncCompletedAt: (0, pg_core_1.timestamp)('last_sync_completed_at'),
    lastSyncError: (0, pg_core_1.text)('last_sync_error'),
    totalProcessed: (0, pg_core_1.integer)('total_processed').default(0),
    totalFailed: (0, pg_core_1.integer)('total_failed').default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: (0, pg_core_1.uniqueIndex)('sync_states_user_id_idx').on(table.userId),
}));
exports.roles = (0, pg_core_1.pgTable)('roles', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id),
    name: (0, pg_core_1.text)('name').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    companyRoleIdx: (0, pg_core_1.uniqueIndex)('roles_company_role_idx').on(table.companyId, table.name),
}));
exports.interviewRounds = (0, pg_core_1.pgTable)('interview_rounds', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id),
    roleName: (0, pg_core_1.text)('role_name').notNull(),
    roundNumber: (0, pg_core_1.integer)('round_number').notNull(),
    interviewerName: (0, pg_core_1.text)('interviewer_name').notNull(),
    interviewerGmail: (0, pg_core_1.text)('interviewer_gmail').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    userRoleRoundIdx: (0, pg_core_1.uniqueIndex)('rounds_user_role_round_idx').on(table.userId, table.roleName, table.roundNumber),
}));
exports.candidates = (0, pg_core_1.pgTable)('candidates', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    name: (0, pg_core_1.text)('name'),
    candidateEmail: (0, pg_core_1.text)('candidate_email'),
    phone: (0, pg_core_1.text)('phone'),
    role: (0, pg_core_1.text)('role').notNull(),
    resumeUrl: (0, pg_core_1.text)('resume_url'),
    driveFileId: (0, pg_core_1.text)('drive_file_id'),
    status: (0, pg_core_1.text)('status').default('pending'),
    currentRound: (0, pg_core_1.integer)('current_round').default(1),
    totalRounds: (0, pg_core_1.integer)('total_rounds').default(1),
    assignedInterviewerEmail: (0, pg_core_1.text)('assigned_interviewer_email'),
    roundStatus: (0, pg_core_1.text)('round_status').default('pending'),
    parsedData: (0, pg_core_1.jsonb)('parsed_data'),
    atsScore: (0, pg_core_1.integer)('ats_score'),
    parsedSkills: (0, pg_core_1.jsonb)('parsed_skills'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    driveFileIdx: (0, pg_core_1.uniqueIndex)('candidates_drive_file_idx').on(table.userId, table.driveFileId),
}));
exports.invites = (0, pg_core_1.pgTable)('invites', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    companyId: (0, pg_core_1.uuid)('company_id').references(() => exports.companies.id),
    createdByUserId: (0, pg_core_1.uuid)('created_by_user_id').references(() => exports.users.id),
    email: (0, pg_core_1.text)('email').notNull(),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    roleName: (0, pg_core_1.text)('role_name').notNull(),
    roundNumber: (0, pg_core_1.integer)('round_number').notNull(),
    used: (0, pg_core_1.boolean)('used').default(false),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.scheduledInterviews = (0, pg_core_1.pgTable)('scheduled_interviews', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    candidateId: (0, pg_core_1.uuid)('candidate_id').references(() => exports.candidates.id).notNull(),
    interviewerEmail: (0, pg_core_1.text)('interviewer_email').notNull(),
    roundNumber: (0, pg_core_1.integer)('round_number').notNull(),
    scheduledStartTime: (0, pg_core_1.timestamp)('scheduled_start_time', {
        withTimezone: true,
    }).notNull(),
    scheduledEndTime: (0, pg_core_1.timestamp)('scheduled_end_time', {
        withTimezone: true,
    }).notNull(),
    durationMinutes: (0, pg_core_1.integer)('duration_minutes').default(45),
    googleEventId: (0, pg_core_1.text)('google_event_id'),
    meetLink: (0, pg_core_1.text)('meet_link'),
    status: (0, pg_core_1.text)('status').default('scheduled'),
    transcriptReceived: (0, pg_core_1.boolean)('transcript_received').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
});
exports.interviewFeedback = (0, pg_core_1.pgTable)('interview_feedback', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    candidateId: (0, pg_core_1.uuid)('candidate_id').references(() => exports.candidates.id).notNull(),
    roundNumber: (0, pg_core_1.integer)('round_number').notNull(),
    interviewerEmail: (0, pg_core_1.text)('interviewer_email').notNull(),
    technicalRating: (0, pg_core_1.integer)('technical_rating'),
    communicationRating: (0, pg_core_1.integer)('communication_rating'),
    problemSolvingRating: (0, pg_core_1.integer)('problem_solving_rating'),
    overallRating: (0, pg_core_1.integer)('overall_rating'),
    strengths: (0, pg_core_1.text)('strengths'),
    weaknesses: (0, pg_core_1.text)('weaknesses'),
    notes: (0, pg_core_1.text)('notes'),
    recommendation: (0, pg_core_1.text)('recommendation'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    uniqueFeedback: (0, pg_core_1.uniqueIndex)('feedback_candidate_round_interviewer_idx').on(table.candidateId, table.roundNumber, table.interviewerEmail),
}));
exports.interviewTranscripts = (0, pg_core_1.pgTable)('interview_transcripts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    candidateId: (0, pg_core_1.uuid)('candidate_id').references(() => exports.candidates.id).notNull(),
    roundNumber: (0, pg_core_1.integer)('round_number').notNull(),
    interviewerEmail: (0, pg_core_1.text)('interviewer_email').notNull(),
    readSessionId: (0, pg_core_1.text)('read_session_id').unique(),
    readMeetingId: (0, pg_core_1.text)('read_meeting_id').unique(),
    transcriptJson: (0, pg_core_1.jsonb)('transcript_json'),
    transcriptText: (0, pg_core_1.text)('transcript_text'),
    summary: (0, pg_core_1.text)('summary'),
    reportUrl: (0, pg_core_1.text)('report_url'),
    videoUrl: (0, pg_core_1.text)('video_url'),
    source: (0, pg_core_1.text)('source').default('manual'),
    receivedAt: (0, pg_core_1.timestamp)('received_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
});
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    type: (0, pg_core_1.text)('type').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    isRead: (0, pg_core_1.boolean)('is_read').default(false),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
