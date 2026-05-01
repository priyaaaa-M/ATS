"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.session?.userRole)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of: ${roles.join(', ')}`,
            });
        }
        next();
    };
}
