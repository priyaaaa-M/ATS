import { useState } from 'react'
import type { Candidate } from '../../../types'
import { Avatar } from '../../shared/Avatar'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { timeAgo } from '../../../lib/utils'

export function InternalNotesTab({ candidate, onAddNote }: { candidate: Candidate; onAddNote: (text: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="space-y-4">
      <div className="rounded-[12px] bg-[var(--info-light)] p-4 text-sm text-[var(--info)]">Internal notes are only visible to your hiring team.</div>
      <div className="rounded-[12px] border bg-[var(--bg-card)] p-4">
        <div className="mb-3 flex gap-3 text-sm text-[var(--text-2)]"><span>B</span><span>I</span><span>U</span><span>•</span><span>1.</span></div>
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add context for the team..." />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-[var(--text-2)]">Cmd Enter to add</p>
          <Button variant="dark" onClick={() => { onAddNote(value); setValue('') }}>Add note</Button>
        </div>
      </div>
      <div className="space-y-3">
        {(candidate.notes ?? []).map((note) => (
          <div key={note.id} className="flex gap-3 rounded-[12px] border bg-[var(--bg-card)] p-4">
            <Avatar name={note.createdByName} size="sm" />
            <div>
              <p className="text-sm font-medium">{note.createdByName}</p>
              <p className="text-xs text-[var(--text-2)]">{timeAgo(note.createdAt)}</p>
              <p className="mt-2 text-sm text-[var(--text-2)]">{note.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
