import type {
  Candidate,
  Company,
  DriveConfig,
  Feedback,
  Interview,
  InterviewRound,
  Invite,
  Role,
  SyncStatus,
  Transcript,
  User,
} from '@/lib/types'

function mapSkill(skill: any) {
  return {
    name: skill?.name || '',
    level: skill?.level || 'intermediate',
    category: skill?.category,
  }
}

export function mapCompany(data: any): Company {
  return {
    id: data?.id || '',
    name: data?.name || '',
    logo_url: data?.logoUrl ?? null,
    brand_color: data?.brandColor || '#6366F1',
    industry: data?.industry || '',
    size: data?.size || '',
    description: data?.description || '',
    website: data?.website || '',
    slack_webhook_url: data?.slackWebhookUrl ?? null,
  }
}

export function mapUser(data: any): User {
  return {
    id: data?.id || '',
    email: data?.email || '',
    name: data?.name || '',
    role: data?.role === 'interviewer' ? 'interviewer' : 'hr',
    avatar_url: null,
    company_id: data?.companyId || '',
  }
}

export function mapInterview(data: any): Interview {
  return {
    id: data?.id || '',
    candidate_id: data?.candidateId || '',
    candidate_name: data?.candidateName || '',
    candidate_email: data?.candidateEmail ?? null,
    candidate_role: data?.candidateRole ?? null,
    interviewer_email: data?.interviewerEmail || '',
    interviewer_name: data?.interviewerName || data?.interviewerEmail || '',
    scheduled_at: data?.scheduledStartTime || '',
    scheduled_end_at: data?.scheduledEndTime || '',
    meet_link: data?.meetLink || '',
    round: data?.roundNumber || 1,
    status: data?.status || 'scheduled',
    duration_minutes: data?.durationMinutes || 45,
  }
}

export function mapFeedback(data: any): Feedback {
  return {
    id: data?.id || '',
    candidate_id: data?.candidateId || '',
    interviewer_email: data?.interviewerEmail || '',
    round_number: data?.roundNumber || 1,
    technical_rating: data?.technicalRating,
    communication_rating: data?.communicationRating,
    problem_solving_rating: data?.problemSolvingRating,
    overall_rating: data?.overallRating,
    strengths: data?.strengths || '',
    weaknesses: data?.weaknesses || '',
    recommendation: data?.recommendation || '',
    notes: data?.notes || '',
  }
}

export function mapTranscript(data: any): Transcript {
  return {
    id: data?.id || '',
    candidate_id: data?.candidateId || '',
    round_number: data?.roundNumber || 1,
    interviewer_email: data?.interviewerEmail || '',
    transcript_text: data?.transcriptText ?? null,
    summary: data?.summary ?? null,
    report_url: data?.reportUrl ?? null,
    video_url: data?.videoUrl ?? null,
    source: data?.source || 'manual',
    received_at: data?.receivedAt || new Date().toISOString(),
  }
}

export function mapCandidate(data: any): Candidate {
  return {
    id: data?.id || '',
    name: data?.name || 'Unknown Candidate',
    email: data?.candidateEmail || '',
    phone: data?.phone || '',
    role: data?.role || '',
    status: data?.status || 'pending',
    current_round: data?.currentRound || 1,
    total_rounds: data?.totalRounds || 1,
    assigned_interviewer_email: data?.assignedInterviewerEmail ?? null,
    round_status: data?.roundStatus || 'pending',
    ats_score: data?.atsScore || 0,
    created_at: data?.createdAt || new Date().toISOString(),
    resume_url: data?.resumeUrl ?? null,
    parsed_data: {
      education: data?.parsedData?.education || [],
      experience: data?.parsedData?.experience || [],
      projects: data?.parsedData?.projects || [],
      skills: (data?.parsedData?.skills || []).map(mapSkill),
    },
    latest_interview: data?.latestInterview ? mapInterview(data.latestInterview) : null,
    feedback: Array.isArray(data?.feedback)
      ? data.feedback.map(mapFeedback)
      : data?.feedback
        ? mapFeedback(data.feedback)
        : null,
    transcript: data?.transcript ? mapTranscript(data.transcript) : null,
  }
}

export function mapRole(data: any): Role {
  return {
    id: data?.id || '',
    name: data?.name || '',
  }
}

export function mapRound(data: any): InterviewRound {
  return {
    id: data?.id || '',
    role_name: data?.roleName || '',
    round_number: data?.roundNumber || 1,
    interviewer_name: data?.interviewerName || '',
    interviewer_gmail: data?.interviewerGmail || '',
  }
}

export function mapInvite(data: any): Invite {
  return {
    id: data?.id || '',
    email: data?.email || '',
    token: data?.token || '',
    role_name: data?.roleName || '',
    round_number: data?.roundNumber || 1,
    used: Boolean(data?.used),
    expires_at: data?.expiresAt || '',
    invite_link: data?.inviteLink,
  }
}

export function mapDriveConfig(data: any): DriveConfig | null {
  if (!data) return null
  return {
    id: data.id || '',
    drive_folder_link: data.driveFolderLink || '',
    drive_folder_id: data.driveFolderId ?? null,
    last_sync_at: data.lastSyncAt ?? null,
  }
}

export function mapSyncStatus(data: any): SyncStatus {
  return {
    is_sync_running: Boolean(data?.isSyncRunning),
    last_sync_started_at: data?.lastSyncStartedAt ?? null,
    last_sync_completed_at: data?.lastSyncCompletedAt ?? null,
    last_sync_error: data?.lastSyncError ?? null,
    total_processed: data?.totalProcessed || 0,
    total_failed: data?.totalFailed || 0,
  }
}
