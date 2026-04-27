import { and, desc, eq, gte, inArray } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { config } from '../config'
import { db } from '../db'
import { interviewTranscripts, scheduledInterviews } from '../db/schema'
import { AppError } from '../types'

function flattenTranscript(transcript: any) {
  if (!transcript) {
    return ''
  }

  if (Array.isArray(transcript)) {
    return transcript
      .map((entry) => `${entry.speaker || 'Speaker'}: ${entry.text || ''}`)
      .join('\n')
  }

  if (Array.isArray(transcript.turns)) {
    return transcript.turns
      .map((entry: any) => `${entry.speaker || 'Speaker'}: ${entry.text || ''}`)
      .join('\n')
  }

  return JSON.stringify(transcript)
}

async function saveTranscriptForInterview(
  interview: typeof scheduledInterviews.$inferSelect,
  payload: {
    sessionId?: string
    meetingId?: string
    transcript?: unknown
    summary?: string
    reportUrl?: string
    videoUrl?: string
    source: 'manual' | 'readai_webhook' | 'readai_api'
  }
) {
  await db
    .insert(interviewTranscripts)
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
      target: interviewTranscripts.readSessionId,
    })

  await db
    .update(scheduledInterviews)
    .set({
      status: 'completed',
      transcriptReceived: true,
    })
    .where(eq(scheduledInterviews.id, interview.id))
}

export const readaiService = {
  processWebhook: async (payload: any) => {
    const attendees =
      payload.participants
        ?.filter((participant: any) => participant.attended)
        ?.map((participant: any) => participant.email?.toLowerCase())
        ?.filter(Boolean) || []

    if (!attendees.length) {
      return { matched: false }
    }

    const cutoff = DateTime.now().minus({ hours: 6 }).toJSDate()
    const [interview] = await db
      .select()
      .from(scheduledInterviews)
      .where(
        and(
          inArray(scheduledInterviews.interviewerEmail, attendees),
          gte(scheduledInterviews.scheduledEndTime, cutoff),
          eq(scheduledInterviews.transcriptReceived, false),
          eq(scheduledInterviews.status, 'scheduled')
        )
      )
      .orderBy(desc(scheduledInterviews.scheduledEndTime))
      .limit(1)

    if (!interview) {
      console.log('[READAI] No ATS interview matched webhook payload')
      return { matched: false }
    }

    await saveTranscriptForInterview(interview, {
      sessionId: payload.session_id,
      meetingId: payload.meeting_id,
      transcript: payload.transcript,
      summary: payload.summary,
      reportUrl: payload.report_url,
      videoUrl: payload.video_url,
      source: 'readai_webhook',
    })

    return { matched: true, interviewId: interview.id }
  },

  fetchTranscriptForInterview: async (interviewId: string) => {
    if (!config.readai.apiKey) {
      throw new AppError('READAI_API_KEY is not configured', 400)
    }

    const interview = await db.query.scheduledInterviews.findFirst({
      where: eq(scheduledInterviews.id, interviewId),
    })

    if (!interview) {
      throw new AppError('Interview not found', 404)
    }

    const windowStart = DateTime.fromJSDate(interview.scheduledStartTime)
      .minus({ hours: 1 })
      .toMillis()
    const windowEnd = DateTime.fromJSDate(interview.scheduledEndTime)
      .plus({ hours: 3 })
      .toMillis()

    const meetingsResponse = await fetch(
      `https://api.read.ai/v1/meetings?start_time_ms.gte=${windowStart}&start_time_ms.lte=${windowEnd}`,
      {
        headers: {
          Authorization: `Bearer ${config.readai.apiKey}`,
        },
      }
    )

    if (!meetingsResponse.ok) {
      throw new AppError('Failed to fetch meetings from Read.ai', 502)
    }

    const meetingsJson = await meetingsResponse.json()
    const meetings = meetingsJson.data || meetingsJson.meetings || []
    const matchedMeeting = meetings.find((meeting: any) =>
      meeting.participants?.some(
        (participant: any) =>
          participant.email?.toLowerCase() === interview.interviewerEmail.toLowerCase()
      )
    )

    if (!matchedMeeting) {
      return { success: false, reason: 'Meeting not found' }
    }

    const detailResponse = await fetch(
      `https://api.read.ai/v1/meetings/${matchedMeeting.id}?expand[]=transcript&expand[]=summary`,
      {
        headers: {
          Authorization: `Bearer ${config.readai.apiKey}`,
        },
      }
    )

    if (!detailResponse.ok) {
      throw new AppError('Failed to fetch meeting transcript', 502)
    }

    const details = await detailResponse.json()
    await saveTranscriptForInterview(interview, {
      sessionId: details.session_id || details.sessionId,
      meetingId: details.id,
      transcript: details.transcript,
      summary: details.summary,
      reportUrl: details.report_url,
      videoUrl: details.video_url,
      source: 'readai_api',
    })

    return { success: true, interviewId }
  },
}
