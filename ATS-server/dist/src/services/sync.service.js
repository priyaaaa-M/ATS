"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const config_1 = require("../config");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const candidate_service_1 = require("./candidate.service");
const drive_service_1 = require("./drive.service");
const parser_service_1 = require("./parser.service");
const slack_service_1 = require("./slack.service");
async function updateSyncState(userId, values) {
    await db_1.db
        .insert(schema_1.syncStates)
        .values({
        userId,
        ...values,
    })
        .onConflictDoUpdate({
        target: schema_1.syncStates.userId,
        set: {
            ...values,
            updatedAt: new Date(),
        },
    });
}
async function processSingleResume(userId, file, roleName) {
    const existing = await candidate_service_1.candidateService.getByDriveFileId(userId, file.fileId);
    if (existing) {
        return;
    }
    if (file.mimeType !== 'application/pdf') {
        throw new types_1.AppError(`Unsupported file type for parsing: ${file.mimeType}`, 400);
    }
    const pdfBuffer = await drive_service_1.driveService.downloadFile(userId, file.fileId);
    const parsed = await parser_service_1.parserService.parsePdf(pdfBuffer, roleName);
    const owner = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
    });
    const candidate = await candidate_service_1.candidateService.create({
        userId,
        companyId: owner?.companyId || null,
        role: roleName,
        name: parsed.name,
        candidateEmail: parsed.email,
        phone: parsed.phone,
        resumeUrl: file.webViewLink,
        driveFileId: file.fileId,
        parsedData: parsed.sections,
        atsScore: parsed.atsScore,
    });
    await slack_service_1.slackService.notifyNewCandidate(userId, candidate.name || file.name, roleName);
}
exports.syncService = {
    ensureCanRun: async (userId) => (await db_1.db.query.syncStates.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.syncStates.userId, userId),
    })) || {
        isSyncRunning: false,
        totalProcessed: 0,
        totalFailed: 0,
    },
    getStatus: async (userId) => (await db_1.db.query.syncStates.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.syncStates.userId, userId),
    })) || {
        isSyncRunning: false,
        totalProcessed: 0,
        totalFailed: 0,
    },
    runDriveSync: async (userId) => {
        await updateSyncState(userId, {
            isSyncRunning: true,
            lastSyncStartedAt: new Date(),
            lastSyncError: null,
            totalProcessed: 0,
            totalFailed: 0,
        });
        try {
            const driveConfig = await drive_service_1.driveService.getDriveConfig(userId);
            if (!driveConfig?.driveFolderId) {
                throw new types_1.AppError('Drive not configured', 400);
            }
            const roleFolders = await drive_service_1.driveService.scanRoleFolders(userId, driveConfig.driveFolderId);
            let totalProcessed = 0;
            let totalFailed = 0;
            for (const roleFolder of roleFolders) {
                const files = await drive_service_1.driveService.getFilesInFolder(userId, roleFolder.folderId);
                for (let index = 0; index < files.length; index += config_1.config.sync.batchSize) {
                    const batch = files.slice(index, index + config_1.config.sync.batchSize);
                    const results = await Promise.allSettled(batch.map((file) => processSingleResume(userId, file, roleFolder.name)));
                    for (const result of results) {
                        if (result.status === 'fulfilled') {
                            totalProcessed += 1;
                        }
                        else {
                            totalFailed += 1;
                            console.error('[SYNC] Failed to process file:', result.reason);
                        }
                    }
                    await updateSyncState(userId, {
                        isSyncRunning: true,
                        totalProcessed,
                        totalFailed,
                    });
                    await new Promise((resolve) => setTimeout(resolve, config_1.config.sync.batchDelayMs));
                }
            }
            await updateSyncState(userId, {
                isSyncRunning: false,
                lastSyncCompletedAt: new Date(),
                totalProcessed,
                totalFailed,
            });
            await db_1.db
                .update(schema_1.driveConfigs)
                .set({
                lastSyncAt: new Date(),
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.driveConfigs.userId, userId));
        }
        catch (error) {
            await updateSyncState(userId, {
                isSyncRunning: false,
                lastSyncError: error instanceof Error ? error.message : 'Unknown sync error',
            });
            throw error;
        }
    },
};
