"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driveController = void 0;
const drive_service_1 = require("../services/drive.service");
const sync_service_1 = require("../services/sync.service");
exports.driveController = {
    getContents: async (req, res, next) => {
        try {
            const folderId = req.query.folderId;
            let targetFolderId = folderId;
            if (!targetFolderId) {
                targetFolderId = await sync_service_1.syncService.ensureDriveSetup(req.session.userId);
            }
            const contents = await drive_service_1.driveService.getFolderContents(req.session.userId, targetFolderId);
            return res.json({ folderId: targetFolderId, contents });
        }
        catch (err) {
            return next(err);
        }
    },
    createFolder: async (req, res, next) => {
        try {
            const { name, parentId } = req.body;
            const folder = await drive_service_1.driveService.createFolder(req.session.userId, name, parentId);
            return res.json(folder);
        }
        catch (err) {
            return next(err);
        }
    }
};
