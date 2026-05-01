"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyController = void 0;
const company_service_1 = require("../services/company.service");
const session_1 = require("../utils/session");
exports.companyController = {
    getProfile: async (req, res, next) => {
        try {
            const companyId = (0, session_1.requireCompanyId)(req);
            const profile = await company_service_1.companyService.getProfile(companyId);
            return res.json(profile);
        }
        catch (err) {
            return next(err);
        }
    },
    updateProfile: async (req, res, next) => {
        try {
            const companyId = (0, session_1.requireCompanyId)(req);
            const profile = await company_service_1.companyService.updateProfile(companyId, req.body);
            return res.json(profile);
        }
        catch (err) {
            return next(err);
        }
    },
    getDriveConfig: async (req, res, next) => {
        try {
            const config = await company_service_1.companyService.getDriveConfig(req.session.userId);
            return res.json(config);
        }
        catch (err) {
            return next(err);
        }
    },
    saveDriveConfig: async (req, res, next) => {
        try {
            const companyId = (0, session_1.requireCompanyId)(req);
            const driveConfig = await company_service_1.companyService.saveDriveConfig(req.session.userId, companyId, req.body);
            return res.status(201).json(driveConfig);
        }
        catch (err) {
            return next(err);
        }
    },
};
