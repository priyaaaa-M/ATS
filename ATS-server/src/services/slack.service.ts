import { config } from '../config'
import { db } from '../db'
import { companies } from '../db/schema'
import { AppError } from '../types'
import { eq } from 'drizzle-orm'

async function sendMessage(blocks: unknown[], text: string, webhookUrl?: string) {
  const resolvedWebhook = webhookUrl || config.slack.webhookUrl
  if (!resolvedWebhook) {
    console.log('[SLACK] No webhook configured, skipping')
    return
  }

  await fetch(resolvedWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, blocks }),
  })
}

export const slackService = {
  sendGenericMessage: async (text: string) =>
    sendMessage(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text,
          },
        },
      ],
      text
    ),

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

  sendTestMessage: async (companyId: string) => {
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    })

    const webhookUrl = company?.slackWebhookUrl || config.slack.webhookUrl
    if (!webhookUrl) {
      throw new AppError('Slack webhook is not configured', 400)
    }

    await sendMessage(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ Slack integration is working! Your ATS will now send notifications here.',
          },
        },
      ],
      '✅ Slack integration is working! Your ATS will now send notifications here.',
      webhookUrl
    )
  },
}
