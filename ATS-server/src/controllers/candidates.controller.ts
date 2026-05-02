import type { NextFunction, Request, Response } from 'express'
import { candidateService } from '../services/candidate.service'
import { driveService } from '../services/drive.service'
import { parserService } from '../services/parser.service'
import { db } from '../db'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'

export const candidatesController = {
  // ... existing methods ...
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, role, folderId } = req.body
      const file = req.file

      if (!file) {
        return res.status(400).json({ error: 'Resume file is required' })
      }

      // 1. Upload to Drive
      const driveFile = await driveService.uploadFile(
        req.session.userId!,
        folderId,
        file.originalname,
        file.mimetype,
        file.buffer
      )

      // 2. Parse PDF
      const parsed = await parserService.parsePdf(file.buffer, role)

      // 3. Create Candidate
      const owner = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId!),
      })

      const candidate = await candidateService.create({
        userId: req.session.userId!,
        companyId: owner?.companyId || null,
        role: role,
        name: name || parsed.name,
        candidateEmail: email || parsed.email,
        phone: parsed.phone,
        resumeUrl: driveFile.webViewLink,
        driveFileId: driveFile.id,
        parsedData: parsed.sections,
        atsScore: parsed.atsScore,
      })

      return res.json(candidate)
    } catch (err) {
      return next(err)
    }
  },
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, status, search, min_ats_score, round } = req.query
      const candidates = await candidateService.list({
        userId: req.session.userId!,
        userRole: req.session.userRole as 'hr' | 'interviewer',
        userEmail: req.session.userEmail!,
        filters: {
          role: role as string | undefined,
          status: status as string | undefined,
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
  extract: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file
      if (!file) {
        return res.status(400).json({ error: 'Resume file is required' })
      }
      const parsed = await parserService.parsePdf(file.buffer)
      return res.json(parsed)
    } catch (err) {
      return next(err)
    }
  },
}
