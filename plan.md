# ATS Product Architecture Plan

## Goal

Turn the current ATS from a resume parser plus candidate dashboard into a reliable hiring operations system that HR managers and hiring managers can use every day without losing trust in the data.

The core product promise should be:

> Every resume becomes an organized, trackable hiring workflow automatically.

## Current Root Problem

The system currently depends on folder structure to infer hiring metadata.

That creates inconsistent candidate records because:

- Google Drive sync can infer role from folders.
- Manual upload may not have role, source, campaign, or metadata.
- Different HR users may name folders differently.
- Both manual and Drive imports merge into the same candidate pipeline.

This causes:

- broken role filters
- inconsistent analytics
- duplicate categories
- unreliable pipeline automation
- unclear interviewer assignment
- lower HR trust

## Target Data Contract

Every candidate entering the system must have standardized import metadata.

Required metadata:

```ts
{
  companyId: string
  userId: string
  roleId?: string
  roleName: string
  sourceId?: string
  sourceName: string
  importMethod: 'manual' | 'google_drive'
  campaignName?: string
  importBatchId?: string
  originalFilename?: string
  resumeHash?: string
}
```

No candidate should enter the main pipeline without at least:

- role
- source
- import method
- resume file
- pipeline stage

## Product Flow

### 1. Guided HR Onboarding

New HR users should not land directly on an empty dashboard.

Show a setup checklist:

1. Create company profile.
2. Create first hiring role.
3. Add candidate sources.
4. Configure interview rounds.
5. Invite interviewers.
6. Choose import method.
7. Import first resumes.

The normal dashboard should become available once the workspace has enough structure to produce consistent candidates.

### 2. Standardized Sources

Add company-level candidate sources.

Examples:

- On Campus
- Off Campus
- Referral
- LinkedIn
- Agency
- Manual Upload
- Career Page

Sources should be managed from Settings.

Each source should have:

- id
- companyId
- name
- normalizedName
- description
- active flag
- createdAt
- updatedAt

### 3. Manual Upload Must Require Metadata

Manual upload should require:

- role
- source
- optional campaign

The current "Assign to Role (optional)" behavior should be removed.

Manual upload flow:

```txt
Select Role
Select Source
Optional Campaign
Upload resumes
Parse resumes
Preview batch
Confirm import
Create candidates
```

This prevents unassigned candidates from polluting the central pipeline.

### 4. Drive Folder Structure

Define one official Google Drive structure:

```txt
ATS Root/
  rules/
    frontend/
      on-campus/
        resume1.pdf
        resume2.pdf
      off-campus/
        resume3.pdf
      referral/
        resume4.pdf

    backend/
      on-campus/
      referral/
```

Hierarchy:

```txt
Role
  Source
    Resumes
```

Drive sync should:

1. Find the `rules` folder.
2. Read role folders.
3. Normalize role names.
4. Match folders to configured roles.
5. Read source folders inside each role.
6. Normalize source names.
7. Match folders to configured sources.
8. Parse resumes only from valid source folders.
9. Report unknown roles/sources before import.

### 5. Drive Validation

Drive sync should not silently create messy categories.

Instead of accepting:

```txt
frontend
Frontend
front-end
FE
frontend resumes
```

The system should show validation issues:

```txt
Unrecognized Drive folder: "FE"
Suggested match: "Frontend"
Actions: Map to Frontend / Create New Role / Ignore
```

Validation should happen before candidates are created.

### 6. Import Batches

Add an `import_batches` table to track every upload or sync.

Suggested fields:

```ts
{
  id: string
  companyId: string
  userId: string
  roleId?: string
  roleName?: string
  sourceId?: string
  sourceName?: string
  campaignName?: string
  importMethod: 'manual' | 'google_drive'
  status: 'draft' | 'validating' | 'ready' | 'importing' | 'completed' | 'failed'
  totalFiles: number
  successfulCount: number
  duplicateCount: number
  failedCount: number
  createdAt: Date
  updatedAt: Date
}
```

This gives HR clear operational visibility:

```txt
Imported 42 resumes for Frontend / On Campus
37 created
3 duplicates
2 failed parsing
```

### 7. Import Preview

Before candidates enter the main pipeline, show an import preview.

Preview columns:

| File | Candidate | Email | Role | Source | Duplicate | Status |
|---|---|---|---|---|---|---|

Actions:

- Confirm import
- Skip duplicate
- Update existing candidate
- Fix missing metadata
- Cancel batch

### 8. Duplicate Detection

Add duplicate detection before candidate creation.

Signals:

1. normalized email
2. phone number
3. resume hash
4. candidate name plus role similarity

Duplicate resolution:

```txt
Candidate already exists under Backend / Referral.

Actions:
- Skip
- Update resume
- Add to another role
```

### 9. Candidate Schema Improvements

The current `candidates.role` and `candidates.source` fields are useful, but the model should become more explicit.

Recommended additions:

```ts
roleId
roleName
sourceId
sourceName
importMethod
importBatchId
campaignName
originalFilename
resumeHash
normalizedEmail
pipelineStage
```

Short-term compatibility:

- Keep existing `role` field.
- Use it as `roleName`.
- Keep existing `source` field.
- Use it as `sourceName` until a `sources` table exists.

### 10. Action-Based Dashboard

The dashboard should become a daily hiring command center.

Top section:

```txt
Today's Hiring Queue
```

Action buckets:

- candidates need HR review
- interviews need slot booking
- interviewer feedback is pending
- candidates are ready for next round
- Drive sync issues need fixing
- import batches need confirmation

Every item should be clickable.

The app should always answer:

> What should I do next?

### 11. Role-Centric Pipeline

Hiring managers think in roles.

The pipeline should be organized around roles:

```txt
Frontend Engineer
  Inbox
  Screening
  Round 1
  Round 2
  Offer
  Hired
  Rejected

Backend Engineer
  Inbox
  Screening
  Round 1
  Round 2
```

Each role should show:

- total candidates
- source breakdown
- average ATS score
- stuck candidates
- upcoming interviews
- pending feedback
- conversion by source

## Implementation Order

### Phase 1: Stop Bad Data At Entry

1. Make role required in manual upload.
2. Add source selection to manual upload.
3. Store source consistently on candidates.
4. Update upload API validation.
5. Update UI copy so HR understands role/source are required.

### Phase 2: Standardize Imports

1. Add `sources` table.
2. Add source settings page.
3. Add `import_batches` table.
4. Create import batch records for manual uploads.
5. Add batch summary response from upload API.

### Phase 3: Drive Hierarchy

1. Update Drive sync to use `Role / Source / Resumes`.
2. Add Drive folder validator.
3. Add role/source normalization.
4. Add unknown folder warnings.
5. Add mapping flow for unknown folders.

### Phase 4: Import Preview And Dedupe

1. Parse files into batch preview.
2. Add duplicate detection.
3. Let HR confirm, skip, or update.
4. Only create candidates after confirmation.

### Phase 5: Onboarding

1. Add onboarding checklist state.
2. Detect incomplete workspace setup.
3. Show setup assistant on dashboard.
4. Link each checklist item to the relevant settings/import screen.

### Phase 6: Hiring Command Center

1. Add action queue API.
2. Show pending HR review.
3. Show interviews needing booking.
4. Show pending feedback.
5. Show import and sync issues.
6. Make all action items clickable.

## Success Criteria

The project becomes genuinely usable when:

- No candidate can enter the pipeline without role and source.
- HR can understand the required workflow without training.
- Drive imports follow one standard folder hierarchy.
- Manual and Drive imports produce the same candidate metadata.
- Duplicate resumes are caught before polluting the pipeline.
- The dashboard shows next actions, not just passive stats.
- Hiring managers can trust role filters, source analytics, and pipeline state.

## Product North Star

The product should not feel like a database of resumes.

It should feel like an operating system for hiring:

- structured intake
- clean candidate metadata
- automated routing
- interviewer accountability
- feedback tracking
- role-level progress
- source-level performance

That is what makes a hiring manager keep using it.
