"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(role) {
    return (req, res, next) => {
        if (req.session?.userRole !== role) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires ${role} role`,
            });
        }
        next();
    };
}
