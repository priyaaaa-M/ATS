"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.candidatesController = void 0;
const candidate_service_1 = require("../services/candidate.service");
const drive_service_1 = require("../services/drive.service");
const parser_service_1 = require("../services/parser.service");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
exports.candidatesController = {
    // ... existing methods ...
    create: async (req, res, next) => {
        try {
            const { name, email, role, folderId, phone, parsedData, socials } = req.body;
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: 'Resume file is required' });
            }
            // 1. Upload to Drive
            const driveFile = await drive_service_1.driveService.uploadFile(req.session.userId, folderId, file.originalname, file.mimetype, file.buffer);
            // 2. Parse PDF
            const parsed = await parser_service_1.parserService.parsePdf(file.buffer, role);
            let finalParsedData = parsed.sections;
            try {
                if (parsedData)
                    finalParsedData = typeof parsedData === 'string' ? JSON.parse(parsedData) : parsedData;
            }
            catch (e) { }
            let finalSocials = parsed.socials;
            try {
                if (socials)
                    finalSocials = typeof socials === 'string' ? JSON.parse(socials) : socials;
            }
            catch (e) { }
            // Merge socials into a combined parsedData object alongside sections
            const combinedParsedData = {
                ...finalParsedData,
                socials: finalSocials,
            };
            // 3. Create Candidate
            const owner = await db_1.db.query.users.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.users.id, req.session.userId),
            });
            const candidate = await candidate_service_1.candidateService.create({
                userId: req.session.userId,
                companyId: owner?.companyId || null,
                role: role,
                name: name || parsed.name,
                candidateEmail: email || parsed.email,
                phone: phone || parsed.phone,
                resumeUrl: driveFile.webViewLink,
                driveFileId: driveFile.id,
                parsedData: combinedParsedData,
                atsScore: parsed.atsScore,
            });
            return res.json(candidate);
        }
        catch (err) {
            return next(err);
        }
    },
    list: async (req, res, next) => {
        try {
            const { role, status, search, min_ats_score, round } = req.query;
            const candidates = await candidate_service_1.candidateService.list({
                userId: req.session.userId,
                userRole: req.session.userRole,
                userEmail: req.session.userEmail,
                filters: {
                    role: role,
                    status: status,
                    search: search,
                    minAtsScore: min_ats_score
                        ? Number.parseInt(min_ats_score, 10)
                        : undefined,
                    round: round ? Number.parseInt(round, 10) : undefined,
                },
            });
            return res.json(candidates);
        }
        catch (err) {
            return next(err);
        }
    },
    getById: async (req, res, next) => {
        try {
            const candidate = await candidate_service_1.candidateService.getById(req.params.id, req.session.userId, req.session.userRole, req.session.userEmail);
            if (!candidate) {
                return res.status(404).json({ error: 'Candidate not found' });
            }
            return res.json(candidate);
        }
        catch (err) {
            return next(err);
        }
    },
    approve: async (req, res, next) => {
        try {
            const result = await candidate_service_1.candidateService.approve(req.params.id, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    reject: async (req, res, next) => {
        try {
            const result = await candidate_service_1.candidateService.reject(req.params.id, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    select: async (req, res, next) => {
        try {
            const result = await candidate_service_1.candidateService.select(req.params.id, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    hrAdvance: async (req, res, next) => {
        try {
            const result = await candidate_service_1.candidateService.hrAdvance(req.params.id, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    advanceToNextRound: async (req, res, next) => {
        try {
            const result = await candidate_service_1.candidateService.advanceToNextRound(req.params.id, req.session.userId, req.session.userEmail);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    extract: async (req, res, next) => {
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: 'Resume file is required' });
            }
            const parsed = await parser_service_1.parserService.parsePdf(file.buffer);
            return res.json(parsed);
        }
        catch (err) {
            return next(err);
        }
    },
};
