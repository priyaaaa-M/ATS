"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCompanyId = requireCompanyId;
const types_1 = require("../types");
function requireCompanyId(req) {
    const companyId = req.session.companyId;
    if (!companyId) {
        throw new types_1.AppError('Company context is required', 400);
    }
    return companyId;
}
