"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.candidatesController = void 0;
const candidate_service_1 = require("../services/candidate.service");
exports.candidatesController = {
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
                    inboxStatus: req.query.inboxStatus || undefined,
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
    advanceToNextRound: async (req, res, next) => {
        try {
            const result = await candidate_service_1.candidateService.advanceToNextRound(req.params.id, req.session.userId, req.session.userEmail);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    moveToPipeline: async (req, res, next) => {
        try {
            const result = await candidate_service_1.candidateService.moveToPipeline(req.params.id, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    notInterested: async (req, res, next) => {
        try {
            const result = await candidate_service_1.candidateService.notInterested(req.params.id, req.session.userId, req.body?.reason);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    addNote: async (req, res, next) => {
        try {
            const text = String(req.body?.text || '').trim();
            if (!text) {
                return res.status(400).json({ error: 'Bad Request', message: 'Note text is required' });
            }
            const result = await candidate_service_1.candidateService.addNote(req.params.id, req.session.userId, req.session.userName || 'Current User', text);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    moveStage: async (req, res, next) => {
        try {
            const stageName = String(req.body?.stageName || '').trim();
            if (!stageName) {
                return res.status(400).json({ error: 'Bad Request', message: 'stageName is required' });
            }
            const result = await candidate_service_1.candidateService.moveStage(req.params.id, req.session.userId, stageName);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
};
