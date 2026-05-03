"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarController = void 0;
const calendar_service_1 = require("../services/calendar.service");
exports.calendarController = {
    getFreeSlots: async (req, res, next) => {
        try {
            const result = await calendar_service_1.calendarService.getFreeSlots(req.body.interviewerEmail, req.body.date, req.body.durationMinutes, req.session.userId);
            return res.json(result);
        }
        catch (err) {
            return next(err);
        }
    },
};
