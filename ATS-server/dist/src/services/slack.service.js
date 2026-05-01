"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slackService = void 0;
const config_1 = require("../config");
async function sendMessage(blocks, text) {
    if (!config_1.config.slack.webhookUrl) {
        console.log('[SLACK] No webhook configured, skipping');
        return;
    }
    await fetch(config_1.config.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, blocks }),
    });
}
exports.slackService = {
    notifyNewCandidate: async (_userId, candidateName, role) => sendMessage([
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `New Candidate Parsed\nName: ${candidateName}\nRole: ${role}`,
            },
        },
    ], `New candidate: ${candidateName} (${role})`),
    notifyInterviewerAssigned: async (interviewerEmail, candidateName, role, round) => sendMessage([
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `Interview Assignment\nCandidate: ${candidateName}\nRole: ${role}\nRound: ${round}\nInterviewer: ${interviewerEmail}`,
            },
        },
    ], `Interview assigned to ${interviewerEmail} for ${candidateName}`),
    notifyCandidateSelected: async (candidateName, role) => sendMessage([
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `Candidate Selected\nName: ${candidateName}\nRole: ${role}`,
            },
        },
    ], `${candidateName} selected for ${role}`),
};
