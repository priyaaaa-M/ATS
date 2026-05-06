import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/dialog'
import { Input } from '../ui/input'
import type { InterviewRound } from '../../types'

export function StageModal({
  open,
  onOpenChange,
  round,
  nextRoundNumber,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  round?: Partial<InterviewRound> | null
  nextRoundNumber: number
  onSave: (data: { roundNumber: number; interviewerName: string; interviewerGmail: string }) => void
}) {
  const [roundNumber, setRoundNumber] = useState(nextRoundNumber)
  const [interviewerName, setInterviewerName] = useState('')
  const [interviewerGmail, setInterviewerGmail] = useState('')

  useEffect(() => {
    setRoundNumber(round?.roundNumber ?? nextRoundNumber)
    setInterviewerName(round?.interviewerName ?? '')
    setInterviewerGmail(round?.interviewerGmail ?? '')
  }, [nextRoundNumber, open, round?.interviewerGmail, round?.interviewerName, round?.roundNumber])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <h3 className="text-lg font-semibold">{round?.id ? 'Edit Round' : 'Add Round'}</h3>
        <div className="mt-4 space-y-3">
          <Input value={roundNumber} placeholder="Round Number" onChange={(e) => setRoundNumber(Number(e.target.value))} />
          <Input value={interviewerName} placeholder="Interviewer Name" onChange={(e) => setInterviewerName(e.target.value)} />
          <Input value={interviewerGmail} placeholder="Interviewer Gmail" onChange={(e) => setInterviewerGmail(e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({ roundNumber, interviewerName, interviewerGmail })}>Save Round</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
