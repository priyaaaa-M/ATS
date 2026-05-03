"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackController = void 0;
const feedback_service_1 = require("../services/feedback.service");
exports.feedbackController = {
    submit: async (req, res, next) => {
        try {
            const result = await feedback_service_1.feedbackService.submit({
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
    getByRound: async (req, res, next) => {
        try {
            const result = await feedback_service_1.feedbackService.getByRound(req.params.candidateId, Number.parseInt(req.params.roundNumber, 10), req.session.userId, req.session.userRole, req.session.userEmail);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
};
