import type { Request, Response } from 'express'
import { backblazeService } from '../services/backblaze.service'
import { parserService } from '../services/parser.service'
import { candidateService } from '../services/candidate.service'
import { importBatchService } from '../services/importBatch.service'
import { AppError } from '../types'

function cleanImportValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseApprovedFilenames(value: unknown) {
  if (!value) return null
  if (Array.isArray(value)) return value.map(String)
  if (typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : null
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

function getUploadContext(req: Request) {
  const role = cleanImportValue(req.body.role)
  const sourceName = cleanImportValue(req.body.sourceName || req.body.source)
  const campaignName = cleanImportValue(req.body.campaignName)

  if (!role || role === 'unassigned') {
    throw new AppError('Role is required for manual resume upload', 400)
  }

  if (!sourceName) {
    throw new AppError('Source is required for manual resume upload', 400)
  }

  return { role, sourceName, campaignName }
}

export const uploadController = {
  previewBulkUpload: async (req: Request, res: Response) => {
    const files = (req as any).files as any[]
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400)
    }

    const { userId } = req.session
    if (!userId) {
      throw new AppError('Unauthorized', 401)
    }

    const { role, sourceName, campaignName } = getUploadContext(req)
    const parseResults = await parserService.parseBulk(
      files.map((f) => ({
        buffer: f.buffer,
        mimeType: f.mimetype,
        filename: f.originalname,
        role,
      }))
    )

    const rows = await Promise.all(
      parseResults.map(async (parsed) => {
        const normalizedEmail =
          parsed.email && parsed.email.includes('@')
            ? parsed.email.toLowerCase()
            : undefined
        const duplicate = await candidateService.findDuplicateByEmail(
          userId,
          normalizedEmail,
          role
        )

        return {
          filename: parsed.filename,
          candidateName: parsed.name || parsed.filename.split('.')[0],
          email: normalizedEmail || null,
          phone: parsed.phone || null,
          role,
          sourceName,
          campaignName: campaignName || null,
          atsScore: parsed.atsScore,
          duplicate: Boolean(duplicate),
          duplicateCandidateId: duplicate?.id ?? null,
          parseStatus: parsed.parseMethod === 'fallback' && parsed.atsScore === 0 ? 'weak' : 'ok',
        }
      })
    )

    return res.json({
      total: rows.length,
      importable: rows.filter((row) => !row.duplicate && row.parseStatus !== 'weak').length,
      duplicates: rows.filter((row) => row.duplicate).length,
      weakParses: rows.filter((row) => row.parseStatus === 'weak').length,
      rows,
    })
  },

  bulkUpload: async (req: Request, res: Response) => {
    let files = (req as any).files as any[]
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400)
    }

    const { userId, companyId } = req.session
    if (!userId) {
      throw new AppError('Unauthorized', 401)
    }

    const { role, sourceName, campaignName } = getUploadContext(req)
    const approvedFilenames = parseApprovedFilenames(req.body.approvedFilenames)
    if (approvedFilenames) {
      const approved = new Set(approvedFilenames)
      files = files.filter((file) => approved.has(file.originalname))
    }

    if (files.length === 0) {
      throw new AppError('No approved files selected for import', 400)
    }

    const batch = await importBatchService.create({
      companyId,
      userId,
      roleName: role,
      sourceName,
      campaignName: campaignName || null,
      importMethod: 'manual',
      totalFiles: files.length,
      status: 'importing',
    })

    // Step 1: Upload all files to Backblaze
    let uploadResults = []
    try {
      uploadResults = await backblazeService.uploadBulk(
        files.map((f) => ({
          buffer: f.buffer,
          filename: f.originalname,
          mimeType: f.mimetype,
          role,
          sourceName,
          campaignName,
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
    let duplicateCount = 0
    const creationResults = await Promise.allSettled(
      parseResults.map(async (parsed) => {
        const upload = successfulUploads.find((u) => u.filename === parsed.filename)
        try {
          const normalizedEmail =
            parsed.email && parsed.email.includes('@')
              ? parsed.email.toLowerCase()
              : undefined
          const duplicate = await candidateService.findDuplicateByEmail(
            userId,
            normalizedEmail,
            role
          )

          if (duplicate) {
            duplicateCount += 1
            return {
              duplicate: true,
              candidateId: duplicate.id,
              filename: parsed.filename,
            }
          }

          const result = await candidateService.create({
            userId,
            role,
            source: sourceName,
            name: parsed.name || parsed.filename.split('.')[0],
            candidateEmail: normalizedEmail,
            phone: parsed.phone,
            resumeUrl: upload?.fileUrl,
            parsedData: {
              ...parsed.sections,
              importMetadata: {
                importMethod: 'manual',
                importBatchId: batch.id,
                sourceName,
                campaignName: campaignName || undefined,
                originalFilename: parsed.filename,
              },
            },
            atsScore: parsed.atsScore,
          })
          return result
        } catch (err: any) {
          console.error(`[UPLOAD] Failed to create candidate for ${parsed.filename}:`, err.message)
          throw err
        }
      })
    )

    const successfulCount = creationResults.filter(
      (r) => r.status === 'fulfilled' && !(r.value as { duplicate?: boolean }).duplicate
    ).length
    const failedCount = Math.max(files.length - successfulCount - duplicateCount, 0)
    await importBatchService.update(batch.id, {
      status: failedCount > 0 ? 'completed_with_errors' : 'completed',
      successfulCount,
      failedCount,
      duplicateCount,
    })
    console.log(`[UPLOAD] Finished. Success: ${successfulCount}/${files.length}`)

    res.status(207).json({
      batchId: batch.id,
      total: files.length,
      successful: successfulCount,
      failed: failedCount,
      duplicates: duplicateCount,
      results: uploadResults.map((u) => {
        const parse = parseResults.find((p) => p.filename === u.filename)
        const creation = creationResults.find(
          (c, idx) => parseResults[idx]?.filename === u.filename
        )
        const isDuplicate =
          creation?.status === 'fulfilled' &&
          Boolean((creation.value as { duplicate?: boolean }).duplicate)
        return {
          filename: u.filename,
          uploaded: !!u.fileUrl,
          parsed: !!parse,
          created: creation?.status === 'fulfilled' && !isDuplicate,
          duplicate: isDuplicate,
          error: u.error || (creation?.status === 'rejected' ? (creation.reason as any).message : undefined),
        }
      }),
    })
  },
}
