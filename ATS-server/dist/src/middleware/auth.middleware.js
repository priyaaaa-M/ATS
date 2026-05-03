"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
async function authMiddleware(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Please log in to continue',
        });
    }
    next();
}
