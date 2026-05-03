"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyController = void 0;
const company_service_1 = require("../services/company.service");
exports.companyController = {
    getProfile: async (req, res, next) => {
        try {
            const profile = await company_service_1.companyService.getProfile(req.session.companyId);
            return res.json(profile);
        }
        catch (err) {
            return next(err);
        }
    },
    updateProfile: async (req, res, next) => {
        try {
            const profile = await company_service_1.companyService.updateProfile(req.session.companyId, req.body);
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
            const driveConfig = await company_service_1.companyService.saveDriveConfig(req.session.userId, req.session.companyId, req.body);
            return res.status(201).json(driveConfig);
        }
        catch (err) {
            return next(err);
        }
    },
};
