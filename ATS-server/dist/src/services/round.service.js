"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const roundSchema = zod_1.z.object({
    roleName: zod_1.z.string().min(1),
    roundNumber: zod_1.z.number().int().positive(),
    interviewerName: zod_1.z.string().min(1),
    interviewerGmail: zod_1.z.string().email(),
});
exports.roundService = {
    listByRole: async (userId, roleName) => db_1.db
        .select()
        .from(schema_1.interviewRounds)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewRounds.userId, userId), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.roleName, roleName))),
    create: async (userId, input) => {
        const payload = roundSchema.parse(input);
        const owner = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
        });
        const [round] = await db_1.db
            .insert(schema_1.interviewRounds)
            .values({
            userId,
            companyId: owner?.companyId || null,
            ...payload,
        })
            .returning();
        return round;
    },
    update: async (userId, id, input) => {
        const payload = roundSchema.partial().parse(input);
        const [round] = await db_1.db
            .update(schema_1.interviewRounds)
            .set({
            ...payload,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewRounds.id, id), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.userId, userId)))
            .returning();
        if (!round) {
            throw new types_1.AppError('Round not found', 404);
        }
        return round;
    },
    remove: async (userId, id) => {
        const [deleted] = await db_1.db
            .delete(schema_1.interviewRounds)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.interviewRounds.id, id), (0, drizzle_orm_1.eq)(schema_1.interviewRounds.userId, userId)))
            .returning();
        if (!deleted) {
            throw new types_1.AppError('Round not found', 404);
        }
        return { success: true };
    },
};
