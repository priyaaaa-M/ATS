'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { RoleDetails, ScreeningQuestion, InterviewStage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

type RoleFormState = {
  name: string
  title: string
  status: 'draft' | 'open' | 'paused' | 'closed'
  workTags: string[]
  salaryMin: string
  salaryMax: string
  salaryCurrency: string
  description: string
  hiringGoals: string
  expectations: string
  activities: string
  sellingPoints: string
  screeningQuestions: ScreeningQuestion[]
  interviewStages: InterviewStage[]
  hiringManagerId: string
  assignedRecruiterIdsText: string
}

const defaultStages: InterviewStage[] = [
  { name: 'Screening', order: 1 },
  { name: 'Recruiter Call', order: 2 },
  { name: 'Hiring Manager Interview', order: 3 },
  { name: 'Technical Assessment', order: 4 },
  { name: 'Final Interview', order: 5 },
  { name: 'Offer', order: 6 },
  { name: 'Hired', order: 7 },
]

function createInitialState(role?: RoleDetails): RoleFormState {
  return {
    name: role?.name || '',
    title: role?.title || '',
    status: (role?.status as RoleFormState['status']) || 'open',
    workTags: role?.workTags || [],
    salaryMin: role?.salaryMin ? String(role.salaryMin) : '',
    salaryMax: role?.salaryMax ? String(role.salaryMax) : '',
    salaryCurrency: role?.salaryCurrency || 'INR',
    description: role?.description || '',
    hiringGoals: role?.hiringGoals || '',
    expectations: role?.expectations || '',
    activities: role?.activities || '',
    sellingPoints: role?.sellingPoints || '',
    screeningQuestions: role?.screeningQuestions || [],
    interviewStages: role?.interviewStages?.length ? role.interviewStages : defaultStages,
    hiringManagerId: role?.hiringManagerId || '',
    assignedRecruiterIdsText: role?.assignedRecruiterIds?.join(', ') || '',
  }
}

interface RoleFormProps {
  role?: RoleDetails | null
  onSave: (payload: Partial<RoleDetails>) => void
  isSaving?: boolean
  saveLabel?: string
}

export function RoleForm({ role, onSave, isSaving = false, saveLabel = 'Save Role' }: RoleFormProps) {
  const [form, setForm] = useState<RoleFormState>(() => createInitialState(role || undefined))
  const [tagInput, setTagInput] = useState('')
  const [questionDraft, setQuestionDraft] = useState<ScreeningQuestion>({
    question: '',
    type: 'text',
    options: [],
    required: false,
    ideal_answer: '',
    weight: 1,
  })
  const [stageDraft, setStageDraft] = useState<InterviewStage>({
    name: '',
    order: 1,
    assigned_to: [],
    instructions: '',
    auto_advance: false,
  })

  useEffect(() => {
    setForm(createInitialState(role || undefined))
  }, [role])

  const assignedRecruiterIds = useMemo(
    () =>
      form.assignedRecruiterIdsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [form.assignedRecruiterIdsText]
  )

  const addQuestion = () => {
    if (!questionDraft.question.trim()) return
    setForm((current) => ({
      ...current,
      screeningQuestions: [
        ...current.screeningQuestions,
        {
          ...questionDraft,
          options: questionDraft.options?.filter(Boolean),
        },
      ],
    }))
    setQuestionDraft({
      question: '',
      type: 'text',
      options: [],
      required: false,
      ideal_answer: '',
      weight: 1,
    })
  }

  const addStage = () => {
    if (!stageDraft.name.trim()) return
    setForm((current) => ({
      ...current,
      interviewStages: [
        ...current.interviewStages.filter((stage) => stage.name !== stageDraft.name),
        { ...stageDraft, order: Number(stageDraft.order) || current.interviewStages.length + 1 },
      ].sort((a, b) => a.order - b.order),
    }))
    setStageDraft({
      name: '',
      order: form.interviewStages.length + 1,
      assigned_to: [],
      instructions: '',
      auto_advance: false,
    })
  }

  const save = () =>
    onSave({
      name: form.name,
      title: form.title || form.name,
      status: form.status,
      workTags: form.workTags,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      salaryCurrency: form.salaryCurrency,
      description: form.description,
      hiringGoals: form.hiringGoals,
      expectations: form.expectations,
      activities: form.activities,
      sellingPoints: form.sellingPoints,
      screeningQuestions: form.screeningQuestions,
      interviewStages: form.interviewStages,
      hiringManagerId: form.hiringManagerId || null,
      assignedRecruiterIds,
    })

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basics">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          {['basics', 'description', 'screening', 'pipeline'].map((step) => (
            <TabsTrigger
              key={step}
              value={step}
              className="border border-border bg-surface data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {step[0].toUpperCase() + step.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="basics" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as RoleFormState['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['draft', 'open', 'paused', 'closed'].map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Work Tags</Label>
                <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface-2 p-3">
                  {form.workTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs"
                      onClick={() => setForm((current) => ({ ...current, workTags: current.workTags.filter((value) => value !== tag) }))}
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                  <Input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        const next = tagInput.trim()
                        if (!next) return
                        setForm((current) => ({ ...current, workTags: [...current.workTags, next] }))
                        setTagInput('')
                      }
                    }}
                    placeholder="Type and press Enter"
                    className="h-8 w-48 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Salary Min</Label>
                <Input value={form.salaryMin} onChange={(event) => setForm((current) => ({ ...current, salaryMin: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Salary Max</Label>
                <Input value={form.salaryMax} onChange={(event) => setForm((current) => ({ ...current, salaryMax: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={form.salaryCurrency} onChange={(event) => setForm((current) => ({ ...current, salaryCurrency: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Hiring Manager ID</Label>
                <Input value={form.hiringManagerId} onChange={(event) => setForm((current) => ({ ...current, hiringManagerId: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Assigned Recruiter IDs</Label>
                <Input value={form.assignedRecruiterIdsText} onChange={(event) => setForm((current) => ({ ...current, assignedRecruiterIdsText: event.target.value }))} placeholder="uuid1, uuid2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="description" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardContent className="grid gap-4 p-6">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Hiring Goals</Label>
                <Textarea value={form.hiringGoals} onChange={(event) => setForm((current) => ({ ...current, hiringGoals: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Expectations</Label>
                <Textarea value={form.expectations} onChange={(event) => setForm((current) => ({ ...current, expectations: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Activities</Label>
                <Textarea value={form.activities} onChange={(event) => setForm((current) => ({ ...current, activities: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Selling Points</Label>
                <Textarea value={form.sellingPoints} onChange={(event) => setForm((current) => ({ ...current, sellingPoints: event.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screening" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Question" value={questionDraft.question} onChange={(event) => setQuestionDraft((current) => ({ ...current, question: event.target.value }))} />
                <Select value={questionDraft.type} onValueChange={(value) => setQuestionDraft((current) => ({ ...current, type: value as ScreeningQuestion['type'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['text', 'number', 'select', 'boolean'].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Ideal answer" value={questionDraft.ideal_answer || ''} onChange={(event) => setQuestionDraft((current) => ({ ...current, ideal_answer: event.target.value }))} />
                <Input type="number" min={1} max={5} placeholder="Weight 1-5" value={questionDraft.weight || 1} onChange={(event) => setQuestionDraft((current) => ({ ...current, weight: Number(event.target.value) }))} />
              </div>
              <Button type="button" variant="outline" onClick={addQuestion}>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
              <div className="space-y-2">
                {form.screeningQuestions.map((question, index) => (
                  <div key={`${question.question}-${index}`} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-4 text-sm">
                    <span>{question.question}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          screeningQuestions: current.screeningQuestions.filter((_, qIndex) => qIndex !== index),
                        }))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card className="bg-surface border-border">
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Stage name" value={stageDraft.name} onChange={(event) => setStageDraft((current) => ({ ...current, name: event.target.value }))} />
                <Input type="number" min={1} placeholder="Order" value={stageDraft.order} onChange={(event) => setStageDraft((current) => ({ ...current, order: Number(event.target.value) }))} />
                <Input placeholder="Assigned to" value={(stageDraft.assigned_to || []).join(', ')} onChange={(event) => setStageDraft((current) => ({ ...current, assigned_to: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
                <Input placeholder="Instructions" value={stageDraft.instructions || ''} onChange={(event) => setStageDraft((current) => ({ ...current, instructions: event.target.value }))} />
              </div>
              <Button type="button" variant="outline" onClick={addStage}>
                <Plus className="mr-2 h-4 w-4" />
                Add Stage
              </Button>
              <div className="space-y-2">
                {form.interviewStages
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => (
                    <div key={`${stage.order}-${stage.name}`} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-4 text-sm">
                      <span>{stage.order}. {stage.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            interviewStages: current.interviewStages.filter((item) => item.name !== stage.name),
                          }))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={save} disabled={isSaving}>
          Save as Draft
        </Button>
        <Button onClick={save} disabled={isSaving}>
          {saveLabel}
        </Button>
      </div>
    </div>
  )
}
