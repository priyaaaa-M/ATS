"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundsController = void 0;
const round_service_1 = require("../services/round.service");
exports.roundsController = {
    listByRole: async (req, res, next) => {
        try {
            const rounds = await round_service_1.roundService.listByRole(req.session.userId, req.params.roleName);
            return res.json(rounds);
        }
        catch (err) {
            return next(err);
        }
    },
    create: async (req, res, next) => {
        try {
            const round = await round_service_1.roundService.create(req.session.userId, req.body);
            return res.status(201).json(round);
        }
        catch (err) {
            return next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            const round = await round_service_1.roundService.update(req.session.userId, req.params.id, req.body);
            return res.json(round);
        }
        catch (err) {
            return next(err);
        }
    },
    delete: async (req, res, next) => {
        try {
            const result = await round_service_1.roundService.remove(req.session.userId, req.params.id);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
};
