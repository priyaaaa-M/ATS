"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCompanyContext = requireCompanyContext;
const session_1 = require("../utils/session");
function requireCompanyContext(req, res, next) {
    try {
        (0, session_1.requireCompanyId)(req);
        return next();
    }
    catch (err) {
        return res.status(400).json({
            error: 'Bad Request',
            message: err instanceof Error ? err.message : 'Company context is required',
        });
    }
}
