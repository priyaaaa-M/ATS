"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesController = void 0;
const role_service_1 = require("../services/role.service");
exports.rolesController = {
    list: async (req, res, next) => {
        try {
            const roles = await role_service_1.roleService.listByUser(req.session.userId);
            return res.json(roles);
        }
        catch (err) {
            return next(err);
        }
    },
    syncFromDrive: async (req, res, next) => {
        try {
            const result = await role_service_1.roleService.syncFromDrive(req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
};
