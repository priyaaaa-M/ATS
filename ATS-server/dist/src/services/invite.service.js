"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const config_1 = require("../config");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const generateInviteSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    roleName: zod_1.z.string().min(1),
    roundNumber: zod_1.z.number().int().positive(),
    companyId: zod_1.z.string().uuid(),
    createdByUserId: zod_1.z.string().uuid(),
});
exports.inviteService = {
    generate: async (input) => {
        const payload = generateInviteSchema.parse(input);
        const token = crypto_1.default.randomUUID();
        const expiresAt = new Date(Date.now() + config_1.config.invite.expiryDays * 24 * 60 * 60 * 1000);
        const [invite] = await db_1.db
            .insert(schema_1.invites)
            .values({
            ...payload,
            email: payload.email.toLowerCase(),
            token,
            expiresAt,
        })
            .returning();
        return {
            invite,
            inviteLink: `${config_1.config.appBaseUrl}/invite/${token}`,
            token,
            expiresAt,
        };
    },
    validateToken: async (token) => {
        const invite = await db_1.db.query.invites.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.invites.token, token),
        });
        if (!invite) {
            throw new types_1.AppError('Invalid invite link', 404);
        }
        if (invite.used) {
            throw new types_1.AppError('Invite already used', 400);
        }
        if (invite.expiresAt < new Date()) {
            throw new types_1.AppError('Invite has expired', 400);
        }
        return invite;
    },
    listByCompany: async (companyId) => db_1.db
        .select()
        .from(schema_1.invites)
        .where((0, drizzle_orm_1.eq)(schema_1.invites.companyId, companyId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.invites.createdAt)),
    accept: async (token, userId) => {
        const invite = await exports.inviteService.validateToken(token);
        const [updated] = await db_1.db
            .update(schema_1.invites)
            .set({ used: true })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.invites.token, token), (0, drizzle_orm_1.eq)(schema_1.invites.used, false)))
            .returning();
        return {
            success: true,
            userId,
            invite: updated || invite,
        };
    },
};
