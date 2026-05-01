"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTranscriptJob = startTranscriptJob;
const node_cron_1 = __importDefault(require("node-cron"));
const drizzle_orm_1 = require("drizzle-orm");
const luxon_1 = require("luxon");
const config_1 = require("../config");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const readai_service_1 = require("../services/readai.service");
async function checkPendingTranscripts() {
    console.log('[TRANSCRIPT JOB] Checking pending transcripts...');
    const now = new Date();
    const cutoff = luxon_1.DateTime.now()
        .minus({ hours: config_1.config.jobs.transcriptFetchLookbackHours })
        .toJSDate();
    const pending = await db_1.db
        .select()
        .from(schema_1.scheduledInterviews)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.transcriptReceived, false), (0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.status, 'scheduled'), (0, drizzle_orm_1.lt)(schema_1.scheduledInterviews.scheduledEndTime, now), (0, drizzle_orm_1.gt)(schema_1.scheduledInterviews.scheduledEndTime, cutoff)));
    for (const interview of pending) {
        const tryAfter = luxon_1.DateTime.fromJSDate(interview.scheduledEndTime).plus({
            minutes: config_1.config.jobs.transcriptFetchDelayMinutes,
        });
        if (luxon_1.DateTime.now() < tryAfter) {
            continue;
        }
        await readai_service_1.readaiService.fetchTranscriptForInterview(interview.id).catch((err) => {
            console.error(`[TRANSCRIPT JOB] Failed for ${interview.id}:`, err);
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}
function startTranscriptJob() {
    node_cron_1.default.schedule(config_1.config.jobs.transcriptCron, checkPendingTranscripts);
    console.log('[TRANSCRIPT JOB] Started');
}
