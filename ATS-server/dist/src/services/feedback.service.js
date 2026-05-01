"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const feedbackSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    roundNumber: zod_1.z.number().int().positive(),
    technicalRating: zod_1.z.number().int().min(1).max(5).optional(),
    communicationRating: zod_1.z.number().int().min(1).max(5).optional(),
    problemSolvingRating: zod_1.z.number().int().min(1).max(5).optional(),
    overallRating: zod_1.z.number().int().min(1).max(5).optional(),
    strengths: zod_1.z.string().optional(),
    weaknesses: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    recommendation: zod_1.z.string().optional(),
    userId: zod_1.z.string().uuid(),
    userEmail: zod_1.z.string().email(),
});
async function authorizeCandidate(candidateId, userId, userRole, userEmail) {
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
exports.feedbackService = {
    submit: async (input) => {
        const payload = feedbackSchema.parse(input);
        await authorizeCandidate(payload.candidateId, payload.userId, 'interviewer', payload.userEmail);
        const [saved] = await db_1.db
            .insert(schema_1.interviewFeedback)
            .values({
            candidateId: payload.candidateId,
            roundNumber: payload.roundNumber,
            interviewerEmail: payload.userEmail,
            technicalRating: payload.technicalRating,
            communicationRating: payload.communicationRating,
            problemSolvingRating: payload.problemSolvingRating,
            overallRating: payload.overallRating,
            strengths: payload.strengths,
            weaknesses: payload.weaknesses,
            notes: payload.notes,
            recommendation: payload.recommendation,
        })
            .onConflictDoUpdate({
            target: [
                schema_1.interviewFeedback.candidateId,
                schema_1.interviewFeedback.roundNumber,
                schema_1.interviewFeedback.interviewerEmail,
            ],
            set: {
                technicalRating: payload.technicalRating,
                communicationRating: payload.communicationRating,
                problemSolvingRating: payload.problemSolvingRating,
                overallRating: payload.overallRating,
                strengths: payload.strengths,
                weaknesses: payload.weaknesses,
                notes: payload.notes,
                recommendation: payload.recommendation,
                updatedAt: new Date(),
            },
        })
            .returning();
        return saved;
    },
    getByRound: async (candidateId, roundNumber, userId, userRole, userEmail) => {
        await authorizeCandidate(candidateId, userId, userRole, userEmail);
        return db_1.db.query.interviewFeedback.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewFeedback.candidateId, candidateId), (0, drizzle_orm_1.eq)(schema_1.interviewFeedback.roundNumber, roundNumber)),
        });
    },
};
