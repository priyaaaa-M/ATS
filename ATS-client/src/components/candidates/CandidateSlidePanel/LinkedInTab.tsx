import type { Candidate } from '../../../types'
import { Button } from '../../ui/button'

export function LinkedInTab({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Experiences</h3>
        <Button variant="secondary">LinkedIn</Button>
      </div>
      {(candidate.parsedData?.experience ?? []).map((item, index) => (
        <div key={`${item.company}-${index}`} className="border-b pb-4 last:border-b-0">
          <p className="text-sm font-semibold">{item.company}</p>
          <p className="text-sm text-[var(--text-1)]">{item.title}</p>
          <p className="text-xs text-[var(--text-2)]">{item.duration} {item.location ? `• ${item.location}` : ''}</p>
          <p className="mt-2 text-sm text-[var(--text-2)]">{item.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(item.technologies ?? []).map((tag) => <span key={tag} className="rounded-full bg-[var(--info-light)] px-2 py-1 text-[11px] text-[var(--info)]">{tag}</span>)}
          </div>
        </div>
      ))}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Education</h3>
        {(candidate.parsedData?.education ?? []).map((item, index) => (
          <div key={`${item.institution}-${index}`} className="border-b pb-4 last:border-b-0">
            <p className="text-sm font-semibold">{item.institution}</p>
            <p className="text-sm text-[var(--text-2)]">{item.degree}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
