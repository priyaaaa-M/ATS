import type { NextFunction, Request, Response } from 'express'
import { candidateService } from '../services/candidate.service'

export const candidatesController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, status, search, min_ats_score, round, inboxStatus } = req.query
      const candidates = await candidateService.list({
        userId: req.session.userId!,
        userRole: req.session.userRole as 'hr' | 'interviewer',
        userEmail: req.session.userEmail!,
        filters: {
          role: role as string | undefined,
          status: status as string | undefined,
          inboxStatus: inboxStatus as string | undefined,
          search: search as string | undefined,
          minAtsScore: min_ats_score
            ? Number.parseInt(min_ats_score as string, 10)
            : undefined,
          round: round ? Number.parseInt(round as string, 10) : undefined,
        },
      })

      return res.json(candidates)
    } catch (err) {
      return next(err)
    }
  },

  counts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.getCounts({
        userId: req.session.userId!,
        userRole: req.session.userRole as 'hr' | 'interviewer',
        userEmail: req.session.userEmail!,
      })
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  pipeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.getPipelineCandidates(
        req.session.userId!,
        typeof req.query.role === 'string' ? req.query.role : undefined
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  approvedByInterviewer: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.getApprovedByInterviewer(
        req.session.userEmail!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidate = await candidateService.getById(
        req.params.id,
        req.session.userId!,
        req.session.userRole as 'hr' | 'interviewer',
        req.session.userEmail!
      )

      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' })
      }

      return res.json(candidate)
    } catch (err) {
      return next(err)
    }
  },

  approve: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.approve(
        req.params.id,
        req.session.userId!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  action: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.action(req.params.id, {
        userId: req.session.userId!,
        userRole: req.session.userRole as 'hr' | 'interviewer',
        userEmail: req.session.userEmail!,
        action: req.body?.action,
        reason: req.body?.reason,
      })
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  moveStage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.moveToStage(
        req.params.id,
        req.session.userId!,
        req.body?.stageId
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  reject: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.reject(req.params.id, req.session.userId!)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  select: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.select(req.params.id, req.session.userId!)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  advanceToNextRound: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await candidateService.advanceToNextRound(
        req.params.id,
        req.session.userId!,
        req.session.userEmail!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  getActivity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.getActivity(
        req.params.id,
        req.session.userId!,
        req.session.userRole as 'hr' | 'interviewer',
        req.session.userEmail!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  getNotes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.getNotes(
        req.params.id,
        req.session.userId!,
        req.session.userRole as 'hr' | 'interviewer',
        req.session.userEmail!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  addNote: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.addNote(req.params.id, {
        userId: req.session.userId!,
        userRole: req.session.userRole as 'hr' | 'interviewer',
        userEmail: req.session.userEmail!,
        text: req.body?.text,
        isPrivate: req.body?.isPrivate,
      })
      return res.status(201).json(result)
    } catch (err) {
      return next(err)
    }
  },

  draftMeetingNote: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.draftMeetingNote(req.params.id, {
        userId: req.session.userId!,
        userRole: req.session.userRole as 'hr' | 'interviewer',
        userEmail: req.session.userEmail!,
        rawNotes: req.body?.rawNotes,
        noteType: req.body?.noteType,
      })
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  getScorecard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.getScorecard(
        req.params.id,
        req.session.userId!,
        req.session.userRole as 'hr' | 'interviewer',
        req.session.userEmail!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  saveScorecard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.saveScorecard(req.params.id, {
        userId: req.session.userId!,
        userRole: req.session.userRole as 'hr' | 'interviewer',
        userEmail: req.session.userEmail!,
        criteria: req.body?.criteria,
        overallFit: req.body?.overallFit,
      })
      return res.status(201).json(result)
    } catch (err) {
      return next(err)
    }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, phone, role } = req.body
      const file = req.file
      const userId = req.session.userId!

      let resumeUrl = undefined
      let parsedData = undefined
      let atsScore = undefined

      if (file) {
        // 1. Upload to Backblaze
        const upload = await require('../services/backblaze.service').backblazeService.uploadResume(
          file.buffer,
          file.originalname,
          file.mimetype,
          { userId, role, source: 'manual' }
        )
        resumeUrl = upload.fileUrl

        // 2. Parse with Groq
        try {
          const parsed = await require('../services/parser.service').parserService.parseBulk([{
            buffer: file.buffer,
            mimeType: file.mimetype,
            filename: file.originalname,
            role
          }])
          if (parsed.length > 0) {
            parsedData = parsed[0].sections
            atsScore = parsed[0].atsScore
          }
        } catch (err) {
          console.error('[MANUAL] Parsing failed:', err)
        }
      }

      const result = await candidateService.create({
        userId,
        name: name || (file?.originalname.split('.')[0]),
        candidateEmail: email,
        phone,
        role: role || 'unassigned',
        resumeUrl,
        parsedData,
        atsScore,
        source: 'manual'
      })

      return res.status(201).json(result)
    } catch (err) {
      return next(err)
    }
  },
}
