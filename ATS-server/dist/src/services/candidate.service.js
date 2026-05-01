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
    screeningAnswers: zod_1.z.array(zod_1.z.any()).optional(),
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
function normalizeText(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase();
}
function calculateMatchData(screeningQuestions = [], screeningAnswers = []) {
    let totalPossible = 0;
    let earned = 0;
    const breakdown = screeningQuestions.map((question, index) => {
        const questionWeight = Number(question?.weight || 1);
        const matchedAnswer = screeningAnswers.find((answer) => {
            const questionId = answer?.question_id || answer?.questionId;
            const questionText = answer?.question_text || answer?.questionText;
            return ((question.id && questionId && question.id === questionId) ||
                normalizeText(question.question) === normalizeText(questionText));
        });
        const answerText = matchedAnswer?.answer || '';
        const hasIdeal = Boolean(question?.ideal_answer);
        const matched = hasIdeal &&
            normalizeText(answerText) === normalizeText(question.ideal_answer);
        if (hasIdeal) {
            totalPossible += questionWeight;
            if (matched) {
                earned += questionWeight;
            }
        }
        return {
            questionId: question?.id || `${index}`,
            questionText: question?.question || '',
            answer: answerText,
            idealAnswer: question?.ideal_answer || '',
            matched,
            score: matched ? questionWeight : 0,
            weight: questionWeight,
        };
    });
    const score = totalPossible > 0 ? Math.round((earned / totalPossible) * 100) : 0;
    return {
        matchScore: score,
        matchBreakdown: breakdown,
        screeningAnswers,
    };
}
async function getRoleDetailsForCandidate(companyId, role) {
    if (!companyId) {
        return null;
    }
    return db_1.db.query.roleDetails.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roleDetails.companyId, companyId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.roleDetails.name, role), (0, drizzle_orm_1.eq)(schema_1.roleDetails.title, role))),
    });
}
exports.candidateService = {
    list: async ({ userId, userRole, userEmail, filters, }) => {
        const conditions = [];
        if (userRole === 'interviewer') {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.assignedInterviewerEmail, userEmail));
            conditions.push((0, drizzle_orm_1.inArray)(schema_1.candidates.status, ['hr_approved', 'scheduled', 'completed']));
        }
        else {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.userId, userId));
        }
        if (filters.role)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.role, filters.role));
        if (filters.status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.status, filters.status));
        if (filters.round)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.currentRound, filters.round));
        if (filters.inboxStatus)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.candidates.inboxStatus, filters.inboxStatus));
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
        if (userRole !== 'interviewer' && candidate.userId !== userId) {
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
        if (!roundOne) {
            throw new types_1.AppError(`No rounds configured for ${candidate.role}. Configure in Settings.`, 400);
        }
        const allRounds = await db_1.db
            .select()
            .from(schema_1.interviewRounds)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewRounds.userId, hrUserId), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roleName, candidate.role)));
        const totalRounds = Math.max(...allRounds.map((round) => round.roundNumber));
        const [updated] = await db_1.db
            .update(schema_1.candidates)
            .set({
            status: 'hr_approved',
            currentRound: 1,
            totalRounds,
            assignedInterviewerEmail: roundOne.interviewerGmail,
            roundStatus: 'pending',
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
            .returning();
        await slack_service_1.slackService.notifyInterviewerAssigned(roundOne.interviewerGmail, candidate.name || candidate.candidateEmail || 'Candidate', candidate.role, 1);
        return updated;
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
        const roleRecord = await getRoleDetailsForCandidate(payload.companyId || null, payload.role);
        const screeningQuestions = roleRecord?.screeningQuestions || [];
        const matchData = calculateMatchData(screeningQuestions, payload.screeningAnswers || []);
        const [created] = await db_1.db
            .insert(schema_1.candidates)
            .values({
            ...payload,
            companyId: payload.companyId || null,
            parsedSkills: payload.parsedData?.skills || [],
            inboxStatus: 'inbox',
            currentStage: null,
            stageHistory: [],
            notes: [],
            screeningAnswers: matchData.screeningAnswers,
            matchScore: matchData.matchScore,
            matchBreakdown: matchData.matchBreakdown,
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
    moveToPipeline: async (candidateId, userId) => {
        const candidate = await getOwnedCandidate(candidateId, userId);
        const roleRecord = await getRoleDetailsForCandidate(candidate.companyId, candidate.role);
        const stages = Array.isArray(roleRecord?.interviewStages)
            ? [...roleRecord?.interviewStages]
            : [];
        const firstStage = stages.sort((a, b) => (a.order || 0) - (b.order || 0))[0];
        const nextStage = firstStage?.name || 'Screening';
        const stageHistory = Array.isArray(candidate.stageHistory)
            ? [...candidate.stageHistory]
            : [];
        stageHistory.push({
            stage: nextStage,
            timestamp: new Date().toISOString(),
            moved_by: userId,
        });
        const [updated] = await db_1.db
            .update(schema_1.candidates)
            .set({
            inboxStatus: 'pipeline',
            currentStage: nextStage,
            stageHistory,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
            .returning();
        return updated;
    },
    notInterested: async (candidateId, userId, reason) => {
        const candidate = await getOwnedCandidate(candidateId, userId);
        const notes = Array.isArray(candidate.notes) ? [...candidate.notes] : [];
        if (reason) {
            notes.push({
                text: `Marked not interested: ${reason}`,
                authorId: userId,
                authorName: 'System',
                createdAt: new Date().toISOString(),
            });
        }
        const [updated] = await db_1.db
            .update(schema_1.candidates)
            .set({
            inboxStatus: 'rejected',
            status: 'rejected',
            notes,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
            .returning();
        return updated;
    },
    addNote: async (candidateId, userId, authorName, text) => {
        const candidate = await getOwnedCandidate(candidateId, userId);
        const notes = Array.isArray(candidate.notes) ? [...candidate.notes] : [];
        notes.push({
            text,
            authorId: userId,
            authorName,
            createdAt: new Date().toISOString(),
        });
        const [updated] = await db_1.db
            .update(schema_1.candidates)
            .set({
            notes,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
            .returning();
        return updated;
    },
    moveStage: async (candidateId, userId, stageName) => {
        const candidate = await getOwnedCandidate(candidateId, userId);
        const stageHistory = Array.isArray(candidate.stageHistory)
            ? [...candidate.stageHistory]
            : [];
        stageHistory.push({
            stage: stageName,
            timestamp: new Date().toISOString(),
            moved_by: userId,
        });
        const [updated] = await db_1.db
            .update(schema_1.candidates)
            .set({
            inboxStatus: 'pipeline',
            currentStage: stageName,
            status: stageName === 'Hired' ? 'selected' : candidate.status,
            stageHistory,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId))
            .returning();
        return updated;
    },
};
