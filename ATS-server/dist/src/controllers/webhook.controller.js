"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
const readai_service_1 = require("../services/readai.service");
exports.webhookController = {
    handleReadai: async (req, res, next) => {
        try {
            const rawBody = req.body;
            const signature = req.headers['x-read-signature'];
            if (config_1.config.readai.webhookSecret) {
                const expected = crypto_1.default
                    .createHmac('sha256', config_1.config.readai.webhookSecret)
                    .update(rawBody)
                    .digest('hex');
                if (!signature || signature !== expected) {
                    return res.status(401).json({ error: 'Invalid signature' });
                }
            }
            res.status(200).json({ received: true });
            const payload = JSON.parse(rawBody.toString());
            void readai_service_1.readaiService.processWebhook(payload).catch((err) => {
                console.error('[WEBHOOK] Processing error:', err);
            });
        }
        catch (err) {
            return next(err);
        }
    },
};
