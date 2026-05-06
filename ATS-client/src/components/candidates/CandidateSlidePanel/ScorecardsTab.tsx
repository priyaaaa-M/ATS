import type { Candidate } from '../../../types'
import { Card, CardContent, CardHeader } from '../../ui/card'

export function ScorecardsTab({ candidate }: { candidate: Candidate }) {
  return (
    <Card>
      <CardHeader><p className="text-sm font-semibold">Submitted by recruiter</p></CardHeader>
      <CardContent className="space-y-4">
        {(candidate.screeningAnswers ?? []).map((criterion) => (
          <div key={criterion.question} className="flex items-center gap-3">
            <p className="flex-1 text-sm">{criterion.question}</p>
            {['?', '✕', '✓'].map((value) => <button key={value} className="h-8 w-8 rounded-full border text-sm">{value}</button>)}
          </div>
        ))}
        <div className="grid grid-cols-4 gap-2">
          {['Poor fit', 'Ok fit', 'Good fit', 'Excellent fit'].map((fit) => <button key={fit} className="rounded-[10px] border px-3 py-2 text-sm">{fit}</button>)}
        </div>
      </CardContent>
    </Card>
  )
}
