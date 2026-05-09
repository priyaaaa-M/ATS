// src/services/backblaze.service.ts

import crypto from 'crypto'
import { Readable } from 'stream'

interface B2AuthResponse {
    authorizationToken: string
    apiUrl: string
    downloadUrl: string
    recommendedPartSize: number
}

interface B2UploadUrlResponse {
    uploadUrl: string
    authorizationToken: string
}

interface B2UploadResult {
    fileId: string
    fileName: string
    contentType: string
    contentLength: number
    fileUrl: string
}

// ── Auth cache (token valid for 24h) ──────────────────────────
let authCache: (B2AuthResponse & { expiresAt: number }) | null = null

async function getAuth(): Promise<B2AuthResponse> {
    if (authCache && Date.now() < authCache.expiresAt) {
        return authCache
    }

    const credentials = Buffer.from(
        `${process.env.B2_KEY_ID}:${process.env.B2_APP_KEY}`
    ).toString('base64')

    const res = await fetch(
        'https://api.backblazeb2.com/b2api/v3/b2_authorize_account',
        {
            headers: {
                Authorization: `Basic ${credentials}`
            },
        }
    )

    if (!res.ok) {
        throw new Error(`B2 auth failed: ${res.statusText}`)
    }

    const data = await res.json()
    
    // Support both root apiUrl (v1/v2) and nested apiInfo (v3)
    const apiUrl = data.apiUrl || data.apiInfo?.storageApi?.apiUrl
    const downloadUrl = data.downloadUrl || data.apiInfo?.storageApi?.downloadUrl

    if (!apiUrl) {
        throw new Error('B2 auth failed: Missing apiUrl')
    }

    const result = {
        ...data,
        apiUrl,
        downloadUrl,
    }

    authCache = {
        ...result,
        expiresAt: Date.now() + 23 * 60 * 60 * 1000 // 23h
    }

    return result
}

// ── Get upload URL ─────────────────────────────────────────────
async function getUploadUrl(
    auth: B2AuthResponse
): Promise<B2UploadUrlResponse> {
    const res = await fetch(
        `${auth.apiUrl}/b2api/v3/b2_get_upload_url`,
        {
            method: 'POST',
            headers: {
                Authorization: auth.authorizationToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bucketId: process.env.B2_BUCKET_ID
            }),
        }
    )

    if (!res.ok) {
        throw new Error(`B2 get upload URL failed: ${res.statusText}`)
    }

    return res.json()
}

// ── Upload single file ─────────────────────────────────────────
async function uploadFile(
    uploadUrl: string,
    uploadToken: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
    metadata: Record<string, string> = {}
): Promise<B2UploadResult & { downloadUrl: string }> {

    const auth = await getAuth()

    const sha1 = crypto
        .createHash('sha1')
        .update(buffer)
        .digest('hex')

    // Build metadata headers (B2 custom headers)
    const metadataHeaders: Record<string, string> = {}
    Object.entries(metadata).forEach(([key, value]) => {
        // B2 info headers: X-Bz-Info-{key}
        metadataHeaders[`X-Bz-Info-${key}`] =
            encodeURIComponent(value)
    })

    const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            Authorization: uploadToken,
            'X-Bz-File-Name': encodeURIComponent(fileName),
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            'X-Bz-Content-Sha1': sha1,
            ...metadataHeaders,
        },
        body: new Uint8Array(buffer),
    })

    if (!res.ok) {
        const error = await res.text()
        throw new Error(`B2 upload failed: ${error}`)
    }

    const data = await res.json()

    return {
        fileId: data.fileId,
        fileName: data.fileName,
        contentType: mimeType,
        contentLength: buffer.length,
        fileUrl: `${auth.downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${fileName}`,
        downloadUrl: auth.downloadUrl,
    }
}

// ── Public service ─────────────────────────────────────────────
export const backblazeService = {

    // Upload single resume
    uploadResume: async (
        buffer: Buffer,
        originalFilename: string,
        mimeType: string,
        metadata: {
            candidateName?: string
            role?: string
            userId: string
            source: 'manual' | 'drive' | 'slack'
        }
    ): Promise<{ fileId: string; fileUrl: string }> => {

        const auth = await getAuth()
        const { uploadUrl, authorizationToken } =
            await getUploadUrl(auth)

        // Build clean filename: userId/role/timestamp-original
        const timestamp = Date.now()
        const cleanFilename = originalFilename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileName =
            `resumes/${metadata.userId}/${metadata.role || 'general'}` +
            `/${timestamp}-${cleanFilename}`

        const result = await uploadFile(
            uploadUrl,
            authorizationToken,
            fileName,
            buffer,
            mimeType,
            {
                candidate: metadata.candidateName || 'unknown',
                role: metadata.role || 'general',
                source: metadata.source,
            }
        )

        return {
            fileId: result.fileId,
            fileUrl: result.fileUrl,
        }
    },

    // Bulk upload — processes in batches of 5
    uploadBulk: async (
        files: Array<{
            buffer: Buffer
            filename: string
            mimeType: string
            role?: string
            sourceName?: string
            campaignName?: string
        }>,
        userId: string,
        onProgress?: (done: number, total: number) => void
    ): Promise<Array<{
        filename: string
        fileId?: string
        fileUrl?: string
        error?: string
    }>> => {

        const BATCH = 5
        const results: Array<{
            filename: string
            fileId?: string
            fileUrl?: string
            error?: string
        }> = []

        // Get auth once for all uploads
        const auth = await getAuth()

        for (let i = 0; i < files.length; i += BATCH) {
            const batch = files.slice(i, i + BATCH)

            // Each batch uses its own upload URL
            const batchResults = await Promise.allSettled(
                batch.map(async (file) => {
                    const { uploadUrl, authorizationToken } =
                        await getUploadUrl(auth)

                    const timestamp = Date.now()
                    const clean = file.filename
                        .replace(/[^a-zA-Z0-9._-]/g, '_')
                    const fileName =
                        `resumes/${userId}/${file.role || 'general'}/${file.sourceName || 'manual-upload'}` +
                        `/${timestamp}-${clean}`

                    return uploadFile(
                        uploadUrl,
                        authorizationToken,
                        fileName,
                        file.buffer,
                        file.mimeType,
                        {
                            role: file.role || 'general',
                            source: 'manual',
                            candidateSource: file.sourceName || 'manual-upload',
                            campaign: file.campaignName || '',
                        }
                    )
                })
            )

            batchResults.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    results.push({
                        filename: batch[idx].filename,
                        fileId: result.value.fileId,
                        fileUrl: result.value.fileUrl,
                    })
                } else {
                    results.push({
                        filename: batch[idx].filename,
                        error: result.reason?.message || 'Upload failed',
                    })
                }
            })

            onProgress?.(
                Math.min(i + BATCH, files.length),
                files.length
            )

            // Small delay between batches
            if (i + BATCH < files.length) {
                await new Promise(r => setTimeout(r, 200))
            }
        }

        return results
    },

    // Delete a file
    deleteFile: async (
        fileId: string,
        fileName: string
    ): Promise<void> => {
        const auth = await getAuth()

        await fetch(
            `${auth.apiUrl}/b2api/v3/b2_delete_file_version`,
            {
                method: 'POST',
                headers: {
                    Authorization: auth.authorizationToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fileId, fileName }),
            }
        )
    },

    // Generate a short-lived download URL
    getDownloadUrl: async (
        fileName: string,
        validSeconds: number = 3600
    ): Promise<string> => {
        const auth = await getAuth()

        const res = await fetch(
            `${auth.apiUrl}/b2api/v3/b2_get_download_authorization`,
            {
                method: 'POST',
                headers: {
                    Authorization: auth.authorizationToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bucketId: process.env.B2_BUCKET_ID,
                    fileNamePrefix: fileName,
                    validDurationInSeconds: validSeconds,
                }),
            }
        )

        if (!res.ok) {
            const error = await res.text()
            throw new Error(`B2 download authorization failed: ${error}`)
        }

        const data = await res.json()
        return `${auth.downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${fileName}?Authorization=${data.authorizationToken}`
    },

    getDownloadUrlForFileUrl: async (
        fileUrl: string,
        validSeconds: number = 3600
    ): Promise<string> => {
        const bucketName = process.env.B2_BUCKET_NAME
        if (!bucketName) {
            throw new Error('B2_BUCKET_NAME is not configured')
        }

        const url = new URL(fileUrl)
        const prefix = `/file/${bucketName}/`
        const fileIndex = url.pathname.indexOf(prefix)

        if (fileIndex === -1) {
            throw new Error('Resume URL is not a Backblaze file URL')
        }

        const fileName = decodeURIComponent(url.pathname.slice(fileIndex + prefix.length))
        return backblazeService.getDownloadUrl(fileName, validSeconds)
    },
}
