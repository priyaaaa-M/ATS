"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleDetailsService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const screeningQuestionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    question: zod_1.z.string().min(1),
    type: zod_1.z.enum(['text', 'number', 'select', 'boolean']),
    options: zod_1.z.array(zod_1.z.string()).optional(),
    required: zod_1.z.boolean().optional(),
    ideal_answer: zod_1.z.string().optional(),
    weight: zod_1.z.number().int().min(1).max(5).optional(),
});
const interviewStageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    order: zod_1.z.number().int().positive(),
    assigned_to: zod_1.z.array(zod_1.z.string()).optional(),
    instructions: zod_1.z.string().optional(),
    auto_advance: zod_1.z.boolean().optional(),
});
const roleDetailsSchema = zod_1.z.object({
    companyId: zod_1.z.string().uuid().nullable().optional(),
    userId: zod_1.z.string().uuid().nullable().optional(),
    name: zod_1.z.string().min(1),
    title: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
    hiringGoals: zod_1.z.string().optional().nullable(),
    salaryMin: zod_1.z.number().int().nullable().optional(),
    salaryMax: zod_1.z.number().int().nullable().optional(),
    salaryCurrency: zod_1.z.string().optional().nullable(),
    expectations: zod_1.z.string().optional().nullable(),
    activities: zod_1.z.string().optional().nullable(),
    workTags: zod_1.z.array(zod_1.z.string()).optional().nullable(),
    sellingPoints: zod_1.z.string().optional().nullable(),
    screeningGuide: zod_1.z.string().optional().nullable(),
    outreachTemplate: zod_1.z.string().optional().nullable(),
    screeningQuestions: zod_1.z.array(screeningQuestionSchema).optional().nullable(),
    interviewStages: zod_1.z.array(interviewStageSchema).optional().nullable(),
    status: zod_1.z.enum(['draft', 'open', 'paused', 'closed']).optional().nullable(),
    hiringManagerId: zod_1.z.string().uuid().optional().nullable(),
    assignedRecruiterIds: zod_1.z.array(zod_1.z.string().uuid()).optional().nullable(),
});
async function getCompanyScope(userId) {
    const user = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
    });
    if (!user) {
        throw new types_1.AppError('User not found', 404);
    }
    return user;
}
async function enrichRoleDetail(record) {
    const [candidateCountResult, hiringManager] = await Promise.all([
        db_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.candidates)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.candidates.role, record.title || record.name), (0, drizzle_orm_1.eq)(schema_1.candidates.role, record.name))),
        record.hiringManagerId
            ? db_1.db.query.users.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.users.id, record.hiringManagerId),
            })
            : Promise.resolve(null),
    ]);
    return {
        ...record,
        candidateCount: Number(candidateCountResult[0]?.count || 0),
        hiringManagerName: hiringManager?.name || null,
    };
}
exports.roleDetailsService = {
    list: async (userId) => {
        const user = await getCompanyScope(userId);
        const records = await db_1.db
            .select()
            .from(schema_1.roleDetails)
            .where(user.companyId
            ? (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.roleDetails.companyId, user.companyId), (0, drizzle_orm_1.eq)(schema_1.roleDetails.userId, userId))
            : (0, drizzle_orm_1.eq)(schema_1.roleDetails.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.roleDetails.createdAt));
        return Promise.all(records.map((record) => enrichRoleDetail(record)));
    },
    getById: async (id, userId) => {
        const user = await getCompanyScope(userId);
        const record = await db_1.db.query.roleDetails.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roleDetails.id, id), user.companyId
                ? (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.roleDetails.companyId, user.companyId), (0, drizzle_orm_1.eq)(schema_1.roleDetails.userId, userId))
                : (0, drizzle_orm_1.eq)(schema_1.roleDetails.userId, userId)),
        });
        if (!record) {
            return null;
        }
        return enrichRoleDetail(record);
    },
    create: async (input, userId) => {
        const payload = roleDetailsSchema.parse(input);
        const user = await getCompanyScope(userId);
        const [created] = await db_1.db
            .insert(schema_1.roleDetails)
            .values({
            ...payload,
            userId,
            title: payload.title || payload.name,
            companyId: payload.companyId ?? user.companyId ?? null,
            status: payload.status || 'open',
        })
            .returning();
        return enrichRoleDetail(created);
    },
    update: async (id, input, userId) => {
        await exports.roleDetailsService.getById(id, userId);
        const payload = roleDetailsSchema.partial().parse(input);
        const [updated] = await db_1.db
            .update(schema_1.roleDetails)
            .set({
            ...payload,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.roleDetails.id, id))
            .returning();
        return enrichRoleDetail(updated);
    },
    delete: async (id, userId) => {
        await exports.roleDetailsService.getById(id, userId);
        await db_1.db.delete(schema_1.roleDetails).where((0, drizzle_orm_1.eq)(schema_1.roleDetails.id, id));
        return { success: true };
    },
};
