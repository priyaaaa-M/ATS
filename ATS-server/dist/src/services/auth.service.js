"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const google_service_1 = require("./google.service");
const userRoleSchema = zod_1.z.enum([
    'executive',
    'hiring_manager',
    'recruiter',
    'interviewer',
    'team_member',
    'hr',
]);
function normalizeUserRole(role) {
    return userRoleSchema.parse(role);
}
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
        console.log('[AUTH][DB] Checking for existing user...');
        const existingUser = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.email, googleUser.email.toLowerCase()),
        });
        console.log('[AUTH][DB] Existing user lookup done:', Boolean(existingUser));
        if (existingUser) {
            console.log('[AUTH][DB] Updating existing user...');
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
            console.log('[AUTH][DB] Existing user updated');
            return {
                user: {
                    ...updatedUser,
                    role: normalizeUserRole(updatedUser.role),
                },
            };
        }
        const invite = (console.log('[AUTH][DB] Checking invite token...'),
            inviteToken &&
                (await db_1.db.query.invites.findFirst({
                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.invites.token, inviteToken), (0, drizzle_orm_1.eq)(schema_1.invites.used, false)),
                })));
        console.log('[AUTH][DB] Invite lookup done:', Boolean(invite));
        if (invite &&
            invite.email.toLowerCase() === googleUser.email.toLowerCase() &&
            invite.expiresAt > new Date()) {
            console.log('[AUTH][DB] Creating invited interviewer...');
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
            console.log('[AUTH][DB] Invite marked used');
            return {
                user: {
                    ...newInterviewer,
                    role: normalizeUserRole(newInterviewer.role),
                },
            };
        }
        console.log('[AUTH][DB] Creating company...');
        const [company] = await db_1.db
            .insert(schema_1.companies)
            .values({
            name: deriveCompanyName(googleUser.email),
        })
            .returning();
        console.log('[AUTH][DB] Company created:', company.id);
        console.log('[AUTH][DB] Creating HR user...');
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
        console.log('[AUTH][DB] HR user created:', newHr.id);
        return {
            user: {
                ...newHr,
                role: normalizeUserRole(newHr.role),
            },
        };
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
