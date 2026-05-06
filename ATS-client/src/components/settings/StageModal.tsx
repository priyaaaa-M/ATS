import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/dialog'
import { Input } from '../ui/input'
import type { InterviewRound } from '../../types'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const [error, setError] = useState('')

  useEffect(() => {
    setRoundNumber(round?.roundNumber ?? nextRoundNumber)
    setInterviewerName(round?.interviewerName ?? '')
    setInterviewerGmail(round?.interviewerGmail ?? '')
    setError('')
  }, [nextRoundNumber, open, round?.interviewerGmail, round?.interviewerName, round?.roundNumber])

  const handleSave = () => {
    const cleanName = interviewerName.trim()
    const cleanEmail = interviewerGmail.trim().toLowerCase()

    if (!Number.isInteger(roundNumber) || roundNumber < 1) {
      setError('Round number must be 1 or higher.')
      return
    }

    if (!cleanName) {
      setError('Interviewer name is required.')
      return
    }

    if (!emailPattern.test(cleanEmail)) {
      setError('Enter a valid interviewer email address.')
      return
    }

    setError('')
    onSave({ roundNumber, interviewerName: cleanName, interviewerGmail: cleanEmail })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <h3 className="text-lg font-semibold">{round?.id ? 'Edit Round' : 'Add Round'}</h3>
        <div className="mt-4 space-y-3">
          <Input type="number" min={1} value={roundNumber} placeholder="Round Number" onChange={(e) => setRoundNumber(Number(e.target.value))} />
          <Input value={interviewerName} placeholder="Interviewer Name" onChange={(e) => setInterviewerName(e.target.value)} />
          <Input type="email" value={interviewerGmail} placeholder="Interviewer email" onChange={(e) => setInterviewerGmail(e.target.value)} />
          {error ? <p className="rounded-[8px] bg-[#fef3f2] px-3 py-2 text-[12px] font-medium text-[#b42318]">{error}</p> : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Round</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
