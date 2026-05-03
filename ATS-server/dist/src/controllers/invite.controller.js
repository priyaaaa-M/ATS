"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteController = void 0;
const invite_service_1 = require("../services/invite.service");
exports.inviteController = {
    validateToken: async (req, res, next) => {
        try {
            const invite = await invite_service_1.inviteService.validateToken(req.params.token);
            return res.json(invite);
        }
        catch (err) {
            return next(err);
        }
    },
    generate: async (req, res, next) => {
        try {
            const invite = await invite_service_1.inviteService.generate({
                ...req.body,
                companyId: req.session.companyId,
                createdByUserId: req.session.userId,
            });
            return res.status(201).json(invite);
        }
        catch (err) {
            return next(err);
        }
    },
    list: async (req, res, next) => {
        try {
            const invites = await invite_service_1.inviteService.listByCompany(req.session.companyId);
            return res.json(invites);
        }
        catch (err) {
            return next(err);
        }
    },
    accept: async (req, res, next) => {
        try {
            const result = await invite_service_1.inviteService.accept(req.params.token, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
};
