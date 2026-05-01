"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleDetailsController = void 0;
const role_details_service_1 = require("../services/role-details.service");
exports.roleDetailsController = {
    list: async (req, res, next) => {
        try {
            const roles = await role_details_service_1.roleDetailsService.list(req.session.userId);
            return res.json(roles);
        }
        catch (err) {
            return next(err);
        }
    },
    getById: async (req, res, next) => {
        try {
            const role = await role_details_service_1.roleDetailsService.getById(req.params.id, req.session.userId);
            if (!role) {
                return res.status(404).json({ error: 'Role not found' });
            }
            return res.json(role);
        }
        catch (err) {
            return next(err);
        }
    },
    create: async (req, res, next) => {
        try {
            const role = await role_details_service_1.roleDetailsService.create(req.body, req.session.userId);
            return res.status(201).json(role);
        }
        catch (err) {
            return next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            const role = await role_details_service_1.roleDetailsService.update(req.params.id, req.body, req.session.userId);
            return res.json(role);
        }
        catch (err) {
            return next(err);
        }
    },
    remove: async (req, res, next) => {
        try {
            const result = await role_details_service_1.roleDetailsService.delete(req.params.id, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
};
