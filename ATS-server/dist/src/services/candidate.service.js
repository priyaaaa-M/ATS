"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.candidateService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const slack_service_1 = require("./slack.service");
const createCandidateSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    companyId: zod_1.z.string().uuid().nullable().optional(),
    role: zod_1.z.string().min(1),
    name: zod_1.z.string().optional(),
    candidateEmail: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    resumeUrl: zod_1.z.string().optional(),
    driveFileId: zod_1.z.string().optional(),
    parsedData: zod_1.z.any().optional(),
    atsScore: zod_1.z.number().int().min(0).max(100).optional(),
});
async function getOwnedCandidate(candidateId, userId) {
    const candidate = await db_1.db.query.candidates.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId), (0, drizzle_orm_1.eq)(schema_1.candidates.userId, userId)),
    });
    if (!candidate) {
        throw new types_1.AppError('Candidate not found', 404);
    }
    return candidate;
}
exports.candidateService = {
    list: async ({ userId, userRole, userEmail, filters, }) => {
        const conditions = [];
        if (userRole === 'hr') {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.userId, userId));
        }
        else {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.assignedInterviewerEmail, userEmail));
            conditions.push((0, drizzle_orm_1.inArray)(schema_1.candidates.status, ['hr_approved', 'scheduled', 'completed']));
        }
        if (filters.role)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.role, filters.role));
        if (filters.status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.status, filters.status));
        if (filters.round)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.currentRound, filters.round));
        if (filters.minAtsScore !== undefined) {
            conditions.push((0, drizzle_orm_1.gte)(schema_1.candidates.atsScore, filters.minAtsScore));
        }
        if (filters.search) {
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.candidates.name, `%${filters.search}%`), (0, drizzle_orm_1.ilike)(schema_1.candidates.candidateEmail, `%${filters.search}%`)));
        }
        return db_1.db
            .select()
            .from(schema_1.candidates)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.candidates.createdAt));
    },
    getById: async (id, userId, userRole, userEmail) => {
        const candidate = await db_1.db.query.candidates.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.candidates.id, id),
        });
        if (!candidate) {
            return null;
        }
        if (userRole === 'hr' && candidate.userId !== userId) {
            throw new types_1.AppError('Forbidden', 403);
        }
        if (userRole === 'interviewer' &&
            candidate.assignedInterviewerEmail !== userEmail) {
            throw new types_1.AppError('Forbidden', 403);
        }
        const [latestInterview] = await db_1.db
            .select()
            .from(schema_1.scheduledInterviews)
            .where((0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.candidateId, id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.scheduledInterviews.scheduledStartTime))
            .limit(1);
        const [feedback] = await db_1.db
            .select()
            .from(schema_1.interviewFeedback)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewFeedback.candidateId, id), (0, drizzle_orm_1.eq)(schema_1.interviewFeedback.roundNumber, candidate.currentRound || 1)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.interviewFeedback.updatedAt))
            .limit(1);
        const [transcript] = await db_1.db
            .select()
            .from(schema_1.interviewTranscripts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewTranscripts.candidateId, id), (0, drizzle_orm_1.eq)(schema_1.interviewTranscripts.roundNumber, candidate.currentRound || 1)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.interviewTranscripts.receivedAt))
            .limit(1);
        return {
            ...candidate,
            latestInterview,
            feedback,
            transcript,
        };
    },
    approve: async (candidateId, hrUserId) => {
        const candidate = await getOwnedCandidate(candidateId, hrUserId);
        const roundOne = await db_1.db.query.interviewRounds.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewRounds.userId, hrUserId), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roleName, candidate.role), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roundNumber, 1)),
        });
        const allRounds = roundOne
            ? await db_1.db
                .select()
                .from(schema_1.interviewRounds)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewRounds.userId, hrUserId), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roleName, candidate.role)))
            : [];
        const totalRounds = allRounds.length > 0
            ? Math.max(...allRounds.map((r) => r.roundNumber))
            : candidate.totalRounds || 1;
        const [updated] = await db_1.db
            .update(schema_1.candidates)
            .set({
            status: 'hr_approved',
            currentRound: 1,
            totalRounds,
            assignedInterviewerEmail: roundOne?.interviewerGmail ?? candidate.assignedInterviewerEmail,
            roundStatus: 'pending',
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
            .returning();
        if (roundOne) {
            await slack_service_1.slackService.notifyInterviewerAssigned(roundOne.interviewerGmail, candidate.name || candidate.candidateEmail || 'Candidate', candidate.role, 1);
        }
        return updated;
    },
    hrAdvance: async (candidateId, hrUserId) => {
        const candidate = await getOwnedCandidate(candidateId, hrUserId);
        // If pending → move to hr_approved (already handled by approve, but as fallback)
        if (candidate.status === 'pending') {
            const [updated] = await db_1.db
                .update(schema_1.candidates)
                .set({ status: 'hr_approved', currentRound: 1, roundStatus: 'pending', updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
                .returning();
            return { candidate: updated };
        }
        // If hr_approved → move to next round or select if no rounds configured
        if (candidate.status === 'hr_approved') {
            const nextRound = (candidate.currentRound || 1) + 1;
            const totalRounds = candidate.totalRounds || 1;
            if (nextRound > totalRounds) {
                // Move to selected if all rounds done
                const [selected] = await db_1.db
                    .update(schema_1.candidates)
                    .set({ status: 'selected', roundStatus: 'completed', updatedAt: new Date() })
                    .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
                    .returning();
                await slack_service_1.slackService.notifyCandidateSelected(selected.name || selected.candidateEmail || 'Candidate', selected.role);
                return { selected: true, candidate: selected };
            }
            const nextRoundConfig = await db_1.db.query.interviewRounds.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewRounds.userId, candidate.userId), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roleName, candidate.role), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roundNumber, nextRound)),
            });
            const [updated] = await db_1.db
                .update(schema_1.candidates)
                .set({
                currentRound: nextRound,
                assignedInterviewerEmail: nextRoundConfig?.interviewerGmail ?? candidate.assignedInterviewerEmail,
                roundStatus: 'pending',
                status: 'scheduled',
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
                .returning();
            if (nextRoundConfig) {
                await slack_service_1.slackService.notifyInterviewerAssigned(nextRoundConfig.interviewerGmail, updated.name || updated.candidateEmail || 'Candidate', updated.role, nextRound);
            }
            return { candidate: updated };
        }
        // If scheduled → advance to next round or select
        if (candidate.status === 'scheduled') {
            const nextRound = (candidate.currentRound || 1) + 1;
            const totalRounds = candidate.totalRounds || 1;
            if (nextRound > totalRounds) {
                const [selected] = await db_1.db
                    .update(schema_1.candidates)
                    .set({ status: 'selected', roundStatus: 'completed', updatedAt: new Date() })
                    .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
                    .returning();
                await slack_service_1.slackService.notifyCandidateSelected(selected.name || selected.candidateEmail || 'Candidate', selected.role);
                return { selected: true, candidate: selected };
            }
            const nextRoundConfig = await db_1.db.query.interviewRounds.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewRounds.userId, candidate.userId), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roleName, candidate.role), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roundNumber, nextRound)),
            });
            const [updated] = await db_1.db
                .update(schema_1.candidates)
                .set({
                currentRound: nextRound,
                assignedInterviewerEmail: nextRoundConfig?.interviewerGmail ?? candidate.assignedInterviewerEmail,
                roundStatus: 'pending',
                status: 'hr_approved',
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
                .returning();
            return { candidate: updated };
        }
        throw new types_1.AppError('Cannot advance candidate from current status', 400);
    },
    advanceToNextRound: async (candidateId, _userId, userEmail) => {
        const candidate = await db_1.db.query.candidates.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId),
        });
        if (!candidate) {
            throw new types_1.AppError('Candidate not found', 404);
        }
        if (candidate.assignedInterviewerEmail !== userEmail) {
            throw new types_1.AppError('Forbidden', 403);
        }
        const nextRound = (candidate.currentRound || 1) + 1;
        if (nextRound > (candidate.totalRounds || 1)) {
            const [selected] = await db_1.db
                .update(schema_1.candidates)
                .set({
                status: 'selected',
                roundStatus: 'completed',
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
                .returning();
            await slack_service_1.slackService.notifyCandidateSelected(selected.name || selected.candidateEmail || 'Candidate', selected.role);
            return { selected: true, candidate: selected };
        }
        const nextRoundConfig = await db_1.db.query.interviewRounds.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewRounds.userId, candidate.userId), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roleName, candidate.role), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roundNumber, nextRound)),
        });
        if (!nextRoundConfig) {
            throw new types_1.AppError('Next round is not configured', 400);
        }
        const [updated] = await db_1.db
            .update(schema_1.candidates)
            .set({
            currentRound: nextRound,
            assignedInterviewerEmail: nextRoundConfig.interviewerGmail,
            roundStatus: 'pending',
            status: 'hr_approved',
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
            .returning();
        await slack_service_1.slackService.notifyInterviewerAssigned(nextRoundConfig.interviewerGmail, updated.name || updated.candidateEmail || 'Candidate', updated.role, nextRound);
        return updated;
    },
    create: async (input) => {
        const payload = createCandidateSchema.parse(input);
        const [created] = await db_1.db
            .insert(schema_1.candidates)
            .values({
            ...payload,
            companyId: payload.companyId || null,
            parsedSkills: payload.parsedData?.skills || [],
        })
            .returning();
        return created;
    },
    reject: async (candidateId, userId) => {
        await getOwnedCandidate(candidateId, userId);
        const [updated] = await db_1.db
            .update(schema_1.candidates)
            .set({
            status: 'rejected',
            roundStatus: 'completed',
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
            .returning();
        return updated;
    },
    select: async (candidateId, userId) => {
        await getOwnedCandidate(candidateId, userId);
        const [updated] = await db_1.db
            .update(schema_1.candidates)
            .set({
            status: 'selected',
            roundStatus: 'completed',
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
            .returning();
        return updated;
    },
    getByDriveFileId: async (userId, driveFileId) => db_1.db.query.candidates.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.candidates.userId, userId), (0, drizzle_orm_1.eq)(schema_1.candidates.driveFileId, driveFileId)),
    }),
};
