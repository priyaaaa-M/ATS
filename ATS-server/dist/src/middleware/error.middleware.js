"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const config_1 = require("../config");
const types_1 = require("../types");
function errorMiddleware(err, req, res, _next) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
    if (err instanceof types_1.AppError) {
        return res.status(err.statusCode).json({
            error: 'Application Error',
            message: err.message,
        });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
        });
    }
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: err.message,
        });
    }
    return res.status(500).json({
        error: 'Internal Server Error',
        message: config_1.config.isDev ? err.message : 'Something went wrong',
        stack: config_1.config.isDev ? err.stack : undefined,
    });
}
