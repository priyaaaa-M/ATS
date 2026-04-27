import { config } from '../config'

async function sendMessage(blocks: unknown[], text: string) {
  if (!config.slack.webhookUrl) {
    console.log('[SLACK] No webhook configured, skipping')
    return
  }

  await fetch(config.slack.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, blocks }),
  })
}

export const slackService = {
  notifyNewCandidate: async (
    _userId: string,
    candidateName: string,
    role: string
  ) =>
    sendMessage(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `New Candidate Parsed\nName: ${candidateName}\nRole: ${role}`,
          },
        },
      ],
      `New candidate: ${candidateName} (${role})`
    ),

  notifyInterviewerAssigned: async (
    interviewerEmail: string,
    candidateName: string,
    role: string,
    round: number
  ) =>
    sendMessage(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Interview Assignment\nCandidate: ${candidateName}\nRole: ${role}\nRound: ${round}\nInterviewer: ${interviewerEmail}`,
          },
        },
      ],
      `Interview assigned to ${interviewerEmail} for ${candidateName}`
    ),

  notifyCandidateSelected: async (candidateName: string, role: string) =>
    sendMessage(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Candidate Selected\nName: ${candidateName}\nRole: ${role}`,
          },
        },
      ],
      `${candidateName} selected for ${role}`
    ),
}
