"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = void 0;
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
exports.webhookRoutes = router;
router.post('/readai', webhook_controller_1.webhookController.handleReadai);
