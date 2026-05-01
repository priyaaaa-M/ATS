"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcriptService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const readai_service_1 = require("./readai.service");
const manualTranscriptSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    roundNumber: zod_1.z.number().int().positive(),
    transcriptText: zod_1.z.string().min(1),
    summary: zod_1.z.string().optional(),
    reportUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    videoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    userId: zod_1.z.string().uuid(),
    userEmail: zod_1.z.string().email(),
});
async function authorizeTranscriptAccess(candidateId, userId, userRole, userEmail) {
    const candidate = await db_1.db.query.candidates.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId),
    });
    if (!candidate) {
        throw new types_1.AppError('Candidate not found', 404);
    }
    if (userRole === 'hr' && candidate.userId !== userId) {
        throw new types_1.AppError('Forbidden', 403);
    }
    if (userRole === 'interviewer' &&
        candidate.assignedInterviewerEmail !== userEmail) {
        throw new types_1.AppError('Forbidden', 403);
    }
    return candidate;
}
exports.transcriptService = {
    getByRound: async (candidateId, roundNumber, userId, userRole, userEmail) => {
        await authorizeTranscriptAccess(candidateId, userId, userRole, userEmail);
        const [transcript] = await db_1.db
            .select()
            .from(schema_1.interviewTranscripts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewTranscripts.candidateId, candidateId), (0, drizzle_orm_1.eq)(schema_1.interviewTranscripts.roundNumber, roundNumber)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.interviewTranscripts.receivedAt))
            .limit(1);
        return transcript || null;
    },
    saveManual: async (input) => {
        const payload = manualTranscriptSchema.parse(input);
        await authorizeTranscriptAccess(payload.candidateId, payload.userId, 'interviewer', payload.userEmail);
        const [saved] = await db_1.db
            .insert(schema_1.interviewTranscripts)
            .values({
            candidateId: payload.candidateId,
            roundNumber: payload.roundNumber,
            interviewerEmail: payload.userEmail,
            transcriptText: payload.transcriptText,
            transcriptJson: { text: payload.transcriptText },
            summary: payload.summary,
            reportUrl: payload.reportUrl || null,
            videoUrl: payload.videoUrl || null,
            source: 'manual',
        })
            .returning();
        await db_1.db
            .update(schema_1.scheduledInterviews)
            .set({
            transcriptReceived: true,
            status: 'completed',
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.candidateId, payload.candidateId), (0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.roundNumber, payload.roundNumber)));
        return saved;
    },
    triggerFetch: async (interviewId) => readai_service_1.readaiService.fetchTranscriptForInterview(interviewId),
};
