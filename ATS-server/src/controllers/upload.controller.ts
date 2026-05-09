import type { Request, Response } from 'express'
import { backblazeService } from '../services/backblaze.service'
import { parserService } from '../services/parser.service'
import { candidateService } from '../services/candidate.service'
import { AppError } from '../types'

export const uploadController = {
  bulkUpload: async (req: Request, res: Response) => {
    const files = (req as any).files as any[]
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400)
    }

    const { userId } = req.session
    if (!userId) {
      throw new AppError('Unauthorized', 401)
    }

    const role = (req.body.role as string) || 'unassigned'

    // Step 1: Upload all files to Backblaze
    let uploadResults = []
    try {
      uploadResults = await backblazeService.uploadBulk(
        files.map((f) => ({
          buffer: f.buffer,
          filename: f.originalname,
          mimeType: f.mimetype,
          role,
        })),
        userId
      )
    } catch (err: any) {
      console.error('[UPLOAD] Fatal error during uploadBulk:', err.message)
      return res.status(500).json({ error: 'Storage service failure', details: err.message })
    }

    // Step 2: Parse all successfully uploaded files with Groq/Fallback
    const successfulUploads = uploadResults.filter((r) => r.fileUrl && !r.error)
    console.log(`[UPLOAD] Successful uploads: ${successfulUploads.length}/${files.length}`)
    
    const filesToParse = files.filter((f) => 
      successfulUploads.some((u) => 
        u.filename.trim().toLowerCase() === f.originalname.trim().toLowerCase()
      )
    )
    console.log(`[UPLOAD] Files to parse: ${filesToParse.length}`)

    const parseResults = await parserService.parseBulk(
      filesToParse.map((f) => ({
        buffer: f.buffer,
        mimeType: f.mimetype,
        filename: f.originalname,
        role,
      }))
    )
    console.log(`[UPLOAD] Parse results: ${parseResults.length}`)

    // Step 3: Create candidates in the database
    console.log(`[UPLOAD] Starting creation for ${parseResults.length} candidates...`)
    const creationResults = await Promise.allSettled(
      parseResults.map(async (parsed) => {
        const upload = successfulUploads.find((u) => u.filename === parsed.filename)
        try {
          const result = await candidateService.create({
            userId,
            role,
            name: parsed.name || parsed.filename.split('.')[0],
            candidateEmail: (parsed.email && parsed.email.includes('@')) ? parsed.email : undefined,
            phone: parsed.phone,
            resumeUrl: upload?.fileUrl,
            parsedData: parsed.sections,
            atsScore: parsed.atsScore,
          })
          return result
        } catch (err: any) {
          console.error(`[UPLOAD] Failed to create candidate for ${parsed.filename}:`, err.message)
          throw err
        }
      })
    )

    const successfulCount = creationResults.filter((r) => r.status === 'fulfilled').length
    console.log(`[UPLOAD] Finished. Success: ${successfulCount}/${files.length}`)

    res.status(207).json({
      total: files.length,
      successful: successfulCount,
      results: uploadResults.map((u) => {
        const parse = parseResults.find((p) => p.filename === u.filename)
        const creation = creationResults.find(
          (c, idx) => parseResults[idx]?.filename === u.filename
        )
        return {
          filename: u.filename,
          uploaded: !!u.fileUrl,
          parsed: !!parse,
          created: creation?.status === 'fulfilled',
          error: u.error || (creation?.status === 'rejected' ? (creation.reason as any).message : undefined),
        }
      }),
    })
  },
}
