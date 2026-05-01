"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcriptController = void 0;
const transcript_service_1 = require("../services/transcript.service");
exports.transcriptController = {
    getByRound: async (req, res, next) => {
        try {
            const result = await transcript_service_1.transcriptService.getByRound(req.params.candidateId, Number.parseInt(req.params.roundNumber, 10), req.session.userId, req.session.userRole, req.session.userEmail);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    saveManual: async (req, res, next) => {
        try {
            const result = await transcript_service_1.transcriptService.saveManual({
                ...req.body,
                userId: req.session.userId,
                userEmail: req.session.userEmail,
            });
            return res.status(201).json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    triggerFetch: async (req, res, next) => {
        try {
            const result = await transcript_service_1.transcriptService.triggerFetch(req.params.interviewId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
};
