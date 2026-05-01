"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncController = void 0;
const sync_service_1 = require("../services/sync.service");
exports.syncController = {
    syncDrive: async (req, res, next) => {
        try {
            const status = await sync_service_1.syncService.ensureCanRun(req.session.userId);
            if (status.isSyncRunning) {
                return res.status(409).json({
                    error: 'Sync already running',
                    message: 'Please wait for the current sync to complete',
                });
            }
            res.json({
                success: true,
                message: 'Drive sync started. Check /api/sync/status for progress.',
            });
            void sync_service_1.syncService.runDriveSync(req.session.userId).catch((err) => {
                console.error('[SYNC] Background sync failed:', err);
            });
        }
        catch (err) {
            return next(err);
        }
    },
    getStatus: async (req, res, next) => {
        try {
            const state = await sync_service_1.syncService.getStatus(req.session.userId);
            return res.json(state);
        }
        catch (err) {
            return next(err);
        }
    },
};
