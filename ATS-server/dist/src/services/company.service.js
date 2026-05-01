"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const updateCompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    logoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    brandColor: zod_1.z.string().min(4).optional(),
    slackWebhookUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    slackChannelName: zod_1.z.string().optional(),
    slackEvents: zod_1.z.array(zod_1.z.string()).optional(),
    industry: zod_1.z.string().optional(),
    size: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
const driveConfigSchema = zod_1.z.object({
    driveFolderLink: zod_1.z.string().url(),
});
function extractDriveFolderId(link) {
    const match = link.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ||
        link.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
    return match || null;
}
exports.companyService = {
    getProfile: async (companyId) => {
        const company = await db_1.db.query.companies.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.companies.id, companyId),
        });
        if (!company) {
            throw new types_1.AppError('Company not found', 404);
        }
        return company;
    },
    updateProfile: async (companyId, input) => {
        const payload = updateCompanySchema.parse(input);
        const [company] = await db_1.db
            .update(schema_1.companies)
            .set({
            ...payload,
            logoUrl: payload.logoUrl || null,
            slackWebhookUrl: payload.slackWebhookUrl || null,
            slackChannelName: payload.slackChannelName || null,
            slackEvents: payload.slackEvents || [],
            website: payload.website || null,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.companies.id, companyId))
            .returning();
        if (!company) {
            throw new types_1.AppError('Company not found', 404);
        }
        return company;
    },
    getDriveConfig: async (userId) => db_1.db.query.driveConfigs.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.driveConfigs.userId, userId),
    }),
    saveDriveConfig: async (userId, companyId, input) => {
        const payload = driveConfigSchema.parse(input);
        const driveFolderId = extractDriveFolderId(payload.driveFolderLink);
        const [saved] = await db_1.db
            .insert(schema_1.driveConfigs)
            .values({
            userId,
            companyId,
            driveFolderLink: payload.driveFolderLink,
            driveFolderId,
        })
            .onConflictDoUpdate({
            target: schema_1.driveConfigs.userId,
            set: {
                driveFolderLink: payload.driveFolderLink,
                driveFolderId,
                updatedAt: new Date(),
            },
        })
            .returning();
        return saved;
    },
};
