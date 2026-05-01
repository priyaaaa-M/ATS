"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readaiService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const luxon_1 = require("luxon");
const config_1 = require("../config");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
function flattenTranscript(transcript) {
    if (!transcript) {
        return '';
    }
    if (Array.isArray(transcript)) {
        return transcript
            .map((entry) => `${entry.speaker || 'Speaker'}: ${entry.text || ''}`)
            .join('\n');
    }
    if (Array.isArray(transcript.turns)) {
        return transcript.turns
            .map((entry) => `${entry.speaker || 'Speaker'}: ${entry.text || ''}`)
            .join('\n');
    }
    return JSON.stringify(transcript);
}
async function saveTranscriptForInterview(interview, payload) {
    await db_1.db
        .insert(schema_1.interviewTranscripts)
        .values({
        candidateId: interview.candidateId,
        roundNumber: interview.roundNumber,
        interviewerEmail: interview.interviewerEmail,
        readSessionId: payload.sessionId,
        readMeetingId: payload.meetingId,
        transcriptJson: payload.transcript,
        transcriptText: flattenTranscript(payload.transcript),
        summary: payload.summary,
        reportUrl: payload.reportUrl,
        videoUrl: payload.videoUrl,
        source: payload.source,
    })
        .onConflictDoNothing({
        target: schema_1.interviewTranscripts.readSessionId,
    });
    await db_1.db
        .update(schema_1.scheduledInterviews)
        .set({
        status: 'completed',
        transcriptReceived: true,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.id, interview.id));
}
exports.readaiService = {
    processWebhook: async (payload) => {
        const attendees = payload.participants
            ?.filter((participant) => participant.attended)
            ?.map((participant) => participant.email?.toLowerCase())
            ?.filter(Boolean) || [];
        if (!attendees.length) {
            return { matched: false };
        }
        const cutoff = luxon_1.DateTime.now().minus({ hours: 6 }).toJSDate();
        const [interview] = await db_1.db
            .select()
            .from(schema_1.scheduledInterviews)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.scheduledInterviews.interviewerEmail, attendees), (0, drizzle_orm_1.gte)(schema_1.scheduledInterviews.scheduledEndTime, cutoff), (0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.transcriptReceived, false), (0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.status, 'scheduled')))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.scheduledInterviews.scheduledEndTime))
            .limit(1);
        if (!interview) {
            console.log('[READAI] No ATS interview matched webhook payload');
            return { matched: false };
        }
        await saveTranscriptForInterview(interview, {
            sessionId: payload.session_id,
            meetingId: payload.meeting_id,
            transcript: payload.transcript,
            summary: payload.summary,
            reportUrl: payload.report_url,
            videoUrl: payload.video_url,
            source: 'readai_webhook',
        });
        return { matched: true, interviewId: interview.id };
    },
    fetchTranscriptForInterview: async (interviewId) => {
        if (!config_1.config.readai.apiKey) {
            throw new types_1.AppError('READAI_API_KEY is not configured', 400);
        }
        const interview = await db_1.db.query.scheduledInterviews.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.id, interviewId),
        });
        if (!interview) {
            throw new types_1.AppError('Interview not found', 404);
        }
        const windowStart = luxon_1.DateTime.fromJSDate(interview.scheduledStartTime)
            .minus({ hours: 1 })
            .toMillis();
        const windowEnd = luxon_1.DateTime.fromJSDate(interview.scheduledEndTime)
            .plus({ hours: 3 })
            .toMillis();
        const meetingsResponse = await fetch(`https://api.read.ai/v1/meetings?start_time_ms.gte=${windowStart}&start_time_ms.lte=${windowEnd}`, {
            headers: {
                Authorization: `Bearer ${config_1.config.readai.apiKey}`,
            },
        });
        if (!meetingsResponse.ok) {
            throw new types_1.AppError('Failed to fetch meetings from Read.ai', 502);
        }
        const meetingsJson = await meetingsResponse.json();
        const meetings = meetingsJson.data || meetingsJson.meetings || [];
        const matchedMeeting = meetings.find((meeting) => meeting.participants?.some((participant) => participant.email?.toLowerCase() === interview.interviewerEmail.toLowerCase()));
        if (!matchedMeeting) {
            return { success: false, reason: 'Meeting not found' };
        }
        const detailResponse = await fetch(`https://api.read.ai/v1/meetings/${matchedMeeting.id}?expand[]=transcript&expand[]=summary`, {
            headers: {
                Authorization: `Bearer ${config_1.config.readai.apiKey}`,
            },
        });
        if (!detailResponse.ok) {
            throw new types_1.AppError('Failed to fetch meeting transcript', 502);
        }
        const details = await detailResponse.json();
        await saveTranscriptForInterview(interview, {
            sessionId: details.session_id || details.sessionId,
            meetingId: details.id,
            transcript: details.transcript,
            summary: details.summary,
            reportUrl: details.report_url,
            videoUrl: details.video_url,
            source: 'readai_api',
        });
        return { success: true, interviewId };
    },
};
