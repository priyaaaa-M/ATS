import type { Candidate } from '../../../types'
import { Button } from '../../ui/button'

function getDriveId(url?: string | null) {
  if (!url?.includes('drive.google.com')) return null
  const match = url.match(/\/d\/([^/]+)/)
  return match?.[1] ?? null
}

export function ResumeTab({ candidate }: { candidate: Candidate }) {
  const driveId = getDriveId(candidate.resumeUrl)
  const src = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : candidate.resumeUrl
  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <Button variant="secondary" size="sm">-</Button>
        <Button variant="secondary" size="sm">100%</Button>
        <Button variant="secondary" size="sm">+</Button>
        <Button variant="secondary" size="sm">Download</Button>
      </div>
      {src ? <iframe title="Resume preview" src={src} className="h-[560px] w-full rounded-[12px] border bg-white" /> : <p className="text-sm text-[var(--text-2)]">No resume available.</p>}
    </div>
  )
}
