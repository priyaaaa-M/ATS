import type { Candidate, Interview } from '../../../types'
import { Card, CardContent, CardHeader } from '../../ui/card'
import { Button } from '../../ui/button'
import { formatDateTime } from '../../../lib/utils'
import { StatusBadge } from '../StatusBadge'

export function OverviewTab({ candidate, interview }: { candidate: Candidate; interview?: Interview | null }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
      <div className="space-y-4">
        <Card className="border-[var(--teal)]/20 bg-[var(--teal-light)]">
          <CardHeader><p className="text-sm font-semibold">Why is {candidate.name} a great fit?</p></CardHeader>
          <CardContent>
            {candidate.parsedData?.summary ? <p className="text-sm text-[var(--text-2)]">{candidate.parsedData.summary}</p> : (
              <ul className="list-disc pl-5 text-sm text-[var(--text-2)]">
                {(candidate.parsedData?.skills ?? []).map((skill) => <li key={skill.name}>{skill.name}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><p className="text-sm font-semibold">Screening Q&A</p></CardHeader>
          <CardContent className="space-y-3">
            {(candidate.screeningAnswers ?? []).map((item) => (
              <div key={item.question} className="border-b pb-3 last:border-b-0">
                <p className="text-xs font-semibold">{item.question}</p>
                <p className="mt-1 text-sm text-[var(--text-2)]">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card><CardContent className="pt-5"><div className="flex items-center justify-between"><StatusBadge status={candidate.status} /><span className="text-xs text-[var(--text-2)]">Copy shareable link</span></div></CardContent></Card>
        <Card>
          <CardHeader><p className="text-sm font-semibold">Candidate Info</p></CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--text-2)]">
            <p>Email: {candidate.candidateEmail}</p>
            <p>Phone: {candidate.phone ?? 'N/A'}</p>
            <p>Salary: {candidate.parsedData?.salaryExpectation ?? 'Not shared'}</p>
            <p>Submitted: {formatDateTime(candidate.createdAt)}</p>
            <Button variant="ghost" className="h-auto px-0 text-[var(--brand)]">Download Resume</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><p className="text-sm font-semibold">Interview Schedule</p></CardHeader>
          <CardContent className="text-sm text-[var(--text-2)]">
            {interview?.scheduledAt ? (
              <>
                <p>{interview.stageName}</p>
                <p>{interview.interviewerName}</p>
                <p>{formatDateTime(interview.scheduledAt)}</p>
                {interview.meetLink ? <Button className="mt-3 w-full">Join Meet</Button> : null}
              </>
            ) : (
              <>
                <p>No interview scheduled</p>
                <Button className="mt-3 w-full">Book Interview</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
