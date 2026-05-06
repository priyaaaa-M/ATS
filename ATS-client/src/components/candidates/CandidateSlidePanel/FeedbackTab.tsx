import { Star } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'

const categories = ['Communication', 'Technical Depth', 'Problem Solving', 'Culture Fit']
const recommendations = ['Strong No', 'No', 'Maybe', 'Yes', 'Strong Yes']

export function FeedbackTab() {
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [recommendation, setRecommendation] = useState('Maybe')
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category} className="flex items-center justify-between">
          <p className="text-sm">{category}</p>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <button key={index} onClick={() => setRatings((current) => ({ ...current, [category]: index + 1 }))}>
                <Star className={`h-5 w-5 ${index < (ratings[category] ?? 0) ? 'fill-[var(--brand)] text-[var(--brand)]' : 'text-[var(--border)]'}`} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="grid grid-cols-5 gap-2">
        {recommendations.map((item) => <button key={item} className={`rounded-[10px] px-3 py-2 text-sm ${recommendation === item ? 'bg-[var(--brand)] text-white' : 'border bg-[var(--bg-card)]'}`} onClick={() => setRecommendation(item)}>{item}</button>)}
      </div>
      <Textarea placeholder="Strengths" />
      <Textarea placeholder="Areas for Improvement" />
      <Textarea placeholder="Notes" />
      <Button className="w-full">Submit Feedback</Button>
    </div>
  )
}
