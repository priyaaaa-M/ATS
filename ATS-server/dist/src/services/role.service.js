"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const drive_service_1 = require("./drive.service");
exports.roleService = {
    listByUser: async (userId) => db_1.db.select().from(schema_1.roles).where((0, drizzle_orm_1.eq)(schema_1.roles.userId, userId)),
    syncFromDrive: async (userId) => {
        const driveConfig = await drive_service_1.driveService.getDriveConfig(userId);
        if (!driveConfig?.driveFolderId) {
            throw new types_1.AppError('Drive folder not configured', 400);
        }
        const syncedRoles = await drive_service_1.driveService.scanRoleFolders(userId, driveConfig.driveFolderId);
        return {
            success: true,
            count: syncedRoles.length,
            roles: syncedRoles,
        };
    },
};
