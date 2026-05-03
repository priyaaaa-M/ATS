"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driveService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const googleapis_1 = require("googleapis");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const google_service_1 = require("./google.service");
const stream_1 = require("stream");
const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
function normalizeRoleName(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
async function getAuthedDrive(userId) {
    const user = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
    });
    if (!user?.googleRefreshToken && !user?.googleAccessToken) {
        throw new types_1.AppError('Google Drive not connected for this user', 400);
    }
    const auth = (0, google_service_1.createOAuth2Client)({
        accessToken: user.googleAccessToken,
        refreshToken: user.googleRefreshToken,
    });
    auth.on('tokens', async (tokens) => {
        await db_1.db
            .update(schema_1.users)
            .set({
            googleAccessToken: tokens.access_token || user.googleAccessToken,
            googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    });
    await auth.getAccessToken();
    return googleapis_1.google.drive({ version: 'v3', auth });
}
exports.driveService = {
    getDriveConfig: async (userId) => db_1.db.query.driveConfigs.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.driveConfigs.userId, userId),
    }),
    scanRoleFolders: async (userId, rootFolderId) => {
        const drive = await getAuthedDrive(userId);
        const user = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
        });
        const rulesFolder = await drive.files.list({
            q: `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = 'rules' and trashed = false`,
            fields: 'files(id,name)',
            pageSize: 1,
        });
        let rules = rulesFolder.data.files?.[0];
        if (!rules?.id) {
            rules = await exports.driveService.createFolder(userId, 'rules', rootFolderId);
        }
        const folders = await drive.files.list({
            q: `'${rules.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id,name)',
            pageSize: 500,
        });
        const result = folders.data.files?.map((folder) => ({
            name: normalizeRoleName(folder.name || 'unnamed-role'),
            folderId: folder.id || '',
        })) || [];
        for (const roleFolder of result) {
            await db_1.db
                .insert(schema_1.roles)
                .values({
                companyId: user?.companyId || null,
                userId,
                name: roleFolder.name,
            })
                .onConflictDoNothing();
        }
        return result;
    },
    getFilesInFolder: async (userId, folderId) => {
        const drive = await getAuthedDrive(userId);
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id,name,webViewLink,mimeType)',
            pageSize: 1000,
        });
        return (response.data.files
            ?.filter((file) => allowedMimeTypes.includes(file.mimeType || ''))
            .map((file) => ({
            fileId: file.id || '',
            name: file.name || 'Unnamed file',
            webViewLink: file.webViewLink || '',
            mimeType: file.mimeType || '',
        })) || []);
    },
    findFolderByName: async (userId, name) => {
        const drive = await getAuthedDrive(userId);
        const response = await drive.files.list({
            q: `mimeType = 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false`,
            fields: 'files(id,name)',
            pageSize: 1,
        });
        return response.data.files?.[0] || null;
    },
    createFolder: async (userId, name, parentId) => {
        const drive = await getAuthedDrive(userId);
        const fileMetadata = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
        };
        if (parentId) {
            fileMetadata.parents = [parentId];
        }
        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id,name',
        });
        return response.data;
    },
    getFolderMetadata: async (userId, folderId) => {
        const drive = await getAuthedDrive(userId);
        try {
            const response = await drive.files.get({
                fileId: folderId,
                fields: 'id,name,mimeType,trashed',
            });
            if (response.data.mimeType !== 'application/vnd.google-apps.folder' || response.data.trashed) {
                return null;
            }
            return response.data;
        }
        catch (err) {
            return null;
        }
    },
    getFolderContents: async (userId, folderId) => {
        const drive = await getAuthedDrive(userId);
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id,name,mimeType,webViewLink,iconLink)',
            pageSize: 1000,
        });
        return response.data.files?.map(file => ({
            id: file.id || '',
            name: file.name || 'Unnamed',
            mimeType: file.mimeType || '',
            webViewLink: file.webViewLink || '',
            iconLink: file.iconLink || '',
            isFolder: file.mimeType === 'application/vnd.google-apps.folder'
        })) || [];
    },
    downloadFile: async (userId, fileId) => {
        const drive = await getAuthedDrive(userId);
        const response = await drive.files.get({
            fileId,
            alt: 'media',
        }, {
            responseType: 'arraybuffer',
        });
        return Buffer.from(response.data);
    },
    uploadFile: async (userId, folderId, name, mimeType, buffer) => {
        const drive = await getAuthedDrive(userId);
        const stream = new stream_1.Readable();
        stream.push(buffer);
        stream.push(null);
        const response = await drive.files.create({
            requestBody: {
                name,
                parents: [folderId],
            },
            media: {
                mimeType,
                body: stream,
            },
            fields: 'id,name,webViewLink',
        });
        return response.data;
    },
};
