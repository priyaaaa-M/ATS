"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const google_service_1 = require("./google.service");
const sync_service_1 = require("./sync.service");
function deriveCompanyName(email) {
    const domain = email.split('@')[1] || 'company';
    const name = domain.split('.')[0] || 'company';
    return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}
exports.authService = {
    handleGoogleCallback: async (code, inviteToken) => {
        const googleUser = await google_service_1.googleService.exchangeCode(code);
        if (!googleUser.email) {
            throw new types_1.AppError('Google account email not available', 400);
        }
        const existingUser = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.email, googleUser.email.toLowerCase()),
        });
        if (existingUser) {
            const [updatedUser] = await db_1.db
                .update(schema_1.users)
                .set({
                name: googleUser.name || existingUser.name,
                googleEmail: googleUser.email,
                googleAccessToken: googleUser.accessToken || existingUser.googleAccessToken,
                googleRefreshToken: googleUser.refreshToken || existingUser.googleRefreshToken,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, existingUser.id))
                .returning();
            if (updatedUser.role === 'hr') {
                void sync_service_1.syncService.ensureDriveSetup(updatedUser.id).catch((err) => {
                    console.error('[AUTH] Failed to ensure drive setup for existing HR:', err);
                });
            }
            return { user: updatedUser };
        }
        const invite = inviteToken &&
            (await db_1.db.query.invites.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.invites.token, inviteToken), (0, drizzle_orm_1.eq)(schema_1.invites.used, false)),
            }));
        if (invite &&
            invite.email.toLowerCase() === googleUser.email.toLowerCase() &&
            invite.expiresAt > new Date()) {
            const [newInterviewer] = await db_1.db
                .insert(schema_1.users)
                .values({
                companyId: invite.companyId || null,
                name: googleUser.name,
                email: googleUser.email.toLowerCase(),
                role: 'interviewer',
                googleAccessToken: googleUser.accessToken,
                googleRefreshToken: googleUser.refreshToken,
                googleEmail: googleUser.email,
                invitedByUserId: invite.createdByUserId || null,
            })
                .returning();
            await db_1.db
                .update(schema_1.invites)
                .set({ used: true })
                .where((0, drizzle_orm_1.eq)(schema_1.invites.id, invite.id));
            return { user: newInterviewer };
        }
        const [company] = await db_1.db
            .insert(schema_1.companies)
            .values({
            name: deriveCompanyName(googleUser.email),
        })
            .returning();
        const [newHr] = await db_1.db
            .insert(schema_1.users)
            .values({
            companyId: company.id,
            name: googleUser.name,
            email: googleUser.email.toLowerCase(),
            role: 'hr',
            googleAccessToken: googleUser.accessToken,
            googleRefreshToken: googleUser.refreshToken,
            googleEmail: googleUser.email,
        })
            .returning();
        void sync_service_1.syncService.ensureDriveSetup(newHr.id).catch((err) => {
            console.error('[AUTH] Failed to ensure drive setup for new HR:', err);
        });
        return { user: newHr };
    },
    getUserById: async (userId) => {
        const user = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
        });
        if (!user) {
            throw new types_1.AppError('User not found', 404);
        }
        const company = user.companyId
            ? await db_1.db.query.companies.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.companies.id, user.companyId),
            })
            : null;
        return {
            ...user,
            company,
        };
    },
};
