"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interviewsController = void 0;
const interview_service_1 = require("../services/interview.service");
exports.interviewsController = {
    list: async (req, res, next) => {
        try {
            const result = await interview_service_1.interviewService.list(req.session.userId, req.session.userRole, req.session.userEmail);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    book: async (req, res, next) => {
        try {
            const result = await interview_service_1.interviewService.bookInterview({
                ...req.body,
                hrUserId: req.session.userId,
            });
            return res.status(201).json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    reschedule: async (req, res, next) => {
        try {
            const result = await interview_service_1.interviewService.rescheduleInterview(req.params.id, req.body, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    cancel: async (req, res, next) => {
        try {
            const result = await interview_service_1.interviewService.cancelInterview(req.params.id, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
    getByCandidateId: async (req, res, next) => {
        try {
            const result = await interview_service_1.interviewService.getByCandidateId(req.params.candidateId, req.session.userId, req.session.userRole, req.session.userEmail);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
};
