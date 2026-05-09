// src/services/parser.service.ts
// Replaces the old regex-based parser entirely
// Uses Groq LLaMA for universal resume parsing

import Groq from 'groq-sdk'
import pdfParse from 'pdf-parse'
import { config } from '../config'

const groqApiKey = config.groqApiKey
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

if (!groq) {
  console.warn('[PARSER] GROQ_API_KEY not found. Parsing will use regex fallback.')
} else {
  console.log('[PARSER] Groq initialized successfully.')
}

// ── Types ──────────────────────────────────────────────────────
export interface ParsedExperience {
  company: string
  title: string
  duration: string
  location?: string
  description: string
  current: boolean
  technologies: string[]
}

export interface ParsedEducation {
  institution: string
  degree: string
  field?: string
  year?: string
  grade?: string
}

export interface ParsedProject {
  name: string
  description: string
  tech: string[]
  url?: string
}

export interface ParsedSkill {
  name: string
  category?: string
}

export interface ParsedResumeSections {
  experience: ParsedExperience[]
  education: ParsedEducation[]
  skills: ParsedSkill[]
  projects: ParsedProject[]
}

export interface ParsedResumeResult {
  name?: string
  email?: string
  phone?: string
  linkedinUrl?: string
  location?: string
  summary?: string
  atsScore: number
  sections: ParsedResumeSections
  rawText?: string
  parseMethod: 'groq' | 'fallback'
}

// ── Text extraction from various formats ──────────────────────
async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {

  // PDF
  if (mimeType === 'application/pdf' ||
    mimeType.includes('pdf')) {
    try {
      const data = await pdfParse(buffer)
      return data.text || ''
    } catch {
      throw new Error('Could not read PDF file')
    }
  }

  // Plain text
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8')
  }

  // DOCX — extract text from XML inside zip
  if (mimeType.includes('wordprocessingml') ||
    mimeType.includes('docx') ||
    mimeType.includes('document')) {
    try {
      // Use mammoth for docx
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ''
    } catch {
      // Fallback: try raw text extraction
      return buffer.toString('utf-8')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
    }
  }

  // DOC (old format) — best effort
  if (mimeType.includes('msword')) {
    return buffer.toString('latin1')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
  }

  // RTF
  if (mimeType.includes('rtf')) {
    return buffer.toString('utf-8')
      .replace(/\{[^{}]*\}/g, ' ')
      .replace(/\\\w+/g, ' ')
      .replace(/\s+/g, ' ')
  }

  // Image-based PDF or scanned document
  // Groq vision can handle this
  if (mimeType.includes('image')) {
    return `[IMAGE_RESUME base64:${buffer.toString('base64').slice(0, 100)}...]`
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}

// ── Groq-powered parsing ───────────────────────────────────────
async function parseWithGroq(
  text: string,
  role: string = ''
): Promise<ParsedResumeResult> {
  if (!groq) {
    throw new Error('Groq is not configured')
  }

  const prompt = `You are a resume parser. Extract structured information from this resume.

The resume is for a candidate applying for: "${role || 'any position'}"

Return ONLY a valid JSON object with this exact structure:
{
  "name": "full name or null",
  "email": "email or null",
  "phone": "phone or null",
  "linkedinUrl": "linkedin url or null",
  "location": "city, country or null",
  "summary": "2-3 sentence professional summary or null",
  "experience": [
    {
      "company": "company name",
      "title": "job title",
      "duration": "date range e.g. Jan 2022 - Present",
      "location": "city or remote or null",
      "description": "what they did in 1-2 sentences",
      "current": true or false,
      "technologies": ["tech1", "tech2"]
    }
  ],
  "education": [
    {
      "institution": "university or school name",
      "degree": "degree type e.g. B.Tech, MBA, High School",
      "field": "field of study or null",
      "year": "graduation year or year range",
      "grade": "GPA or percentage or null"
    }
  ],
  "skills": [
    {
      "name": "skill name",
      "category": "technical or soft or domain"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "what it does in 1 sentence",
      "tech": ["tech used"],
      "url": "github or project url or null"
    }
  ]
}

IMPORTANT RULES:
- Extract ALL experience entries, not just engineering ones
- Handle any profession: doctor, teacher, designer, accountant, etc.
- If dates are ambiguous, extract them as-is
- For skills, extract everything mentioned: tools, languages, soft skills, domain knowledge
- If something is not present in the resume, use null or empty array
- Do NOT add information that is not in the resume
- Return ONLY the JSON, no other text

RESUME TEXT:
${text.slice(0, 6000)}`

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content || '{}'

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Try to extract JSON from response
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      parsed = JSON.parse(match[0])
    } else {
      throw new Error('Groq returned invalid JSON')
    }
  }

  const sections: ParsedResumeSections = {
    experience: (parsed.experience || []).map((e: any) => ({
      company: e.company || 'Unknown Company',
      title: e.title || 'Unknown Title',
      duration: e.duration || '',
      location: e.location || undefined,
      description: e.description || '',
      current: !!e.current,
      technologies: Array.isArray(e.technologies)
        ? e.technologies : [],
    })),
    education: (parsed.education || []).map((e: any) => ({
      institution: e.institution || '',
      degree: e.degree || '',
      field: e.field || undefined,
      year: e.year || undefined,
      grade: e.grade || undefined,
    })),
    skills: (parsed.skills || []).map((s: any) => ({
      name: typeof s === 'string' ? s : s.name || '',
      category: typeof s === 'string'
        ? 'technical' : s.category || 'technical',
    })).filter((s: any) => s.name),
    projects: (parsed.projects || []).map((p: any) => ({
      name: p.name || '',
      description: p.description || '',
      tech: Array.isArray(p.tech) ? p.tech : [],
      url: p.url || undefined,
    })),
  }

  const atsScore = calculateAtsScore(
    sections,
    role,
    !!parsed.email,
    !!parsed.phone
  )

  return {
    name: parsed.name || undefined,
    email: parsed.email || undefined,
    phone: parsed.phone || undefined,
    linkedinUrl: parsed.linkedinUrl || undefined,
    location: parsed.location || undefined,
    summary: parsed.summary || undefined,
    atsScore,
    sections,
    parseMethod: 'groq',
  }
}

// ── ATS Score (role-agnostic) ──────────────────────────────────
function calculateAtsScore(
  sections: ParsedResumeSections,
  role: string,
  hasEmail: boolean,
  hasPhone: boolean
): number {
  let score = 0

  // Contact info
  if (hasEmail) score += 10
  if (hasPhone) score += 5

  // Experience
  if (sections.experience.length > 0) score += 15
  score += Math.min(sections.experience.length * 4, 20)

  // Education
  if (sections.education.length > 0) score += 10

  // Projects
  if (sections.projects.length > 0) score += 10

  // Skills
  if (sections.skills.length > 5) score += 10
  if (sections.skills.length > 15) score += 5

  // Role matching (if role is provided)
  if (role) {
    const roleKeywords = role.toLowerCase().split(/[\s-_]+/)
    const allText = [
      ...sections.experience.map(e =>
        `${e.title} ${e.company} ${e.description} ${e.technologies.join(' ')}`
      ),
      ...sections.skills.map(s => s.name),
    ].join(' ').toLowerCase()

    const matched = roleKeywords.filter(
      kw => kw.length > 3 && allText.includes(kw)
    ).length

    if (roleKeywords.length > 0) {
      score += Math.round(
        (matched / roleKeywords.length) * 15
      )
    }
  }

  return Math.min(score, 100)
}

// ── Fallback regex parser (when Groq fails) ───────────────────
function parseWithFallback(
  text: string,
  role: string = ''
): ParsedResumeResult {

  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  )
  const phoneMatch = text.match(
    /[\+]?[\d][\d\s\-\(\)]{7,14}[\d]/
  )
  const linkedinMatch = text.match(
    /linkedin\.com\/in\/[a-zA-Z0-9\-_]+/
  )

  // Name: first non-empty line that looks like a name
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const name = lines.find(line => {
    const words = line.split(/\s+/)
    return words.length >= 2 &&
      words.length <= 4 &&
      !/[@\d:|•\-–]/.test(line) &&
      line.length < 60
  })

  // Skills: anything after skills section
  const skillsIdx = text.search(
    /skills|technologies|competencies/i
  )
  let skills: ParsedSkill[] = []
  if (skillsIdx > -1) {
    const skillsText = text.slice(skillsIdx, skillsIdx + 500)
    skills = skillsText
      .split(/[,\n•|\/]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 40)
      .slice(0, 30)
      .map(name => ({ name, category: 'technical' }))
  }

  const sections: ParsedResumeSections = {
    experience: [],
    education: [],
    skills,
    projects: [],
  }

  const atsScore = calculateAtsScore(
    sections,
    role,
    !!emailMatch,
    !!phoneMatch
  )

  return {
    name,
    email: emailMatch?.[0],
    phone: phoneMatch?.[0],
    linkedinUrl: linkedinMatch
      ? `https://${linkedinMatch[0]}` : undefined,
    atsScore,
    sections,
    parseMethod: 'fallback',
  }
}

// ── Main export ────────────────────────────────────────────────
export const parserService = {
  parsePdf: async (
    buffer: Buffer,
    role: string = '',
    mimeType: string = 'application/pdf'
  ): Promise<ParsedResumeResult> => {

    // Step 1: extract text
    let text: string
    try {
      text = await extractText(buffer, mimeType)
    } catch (err: any) {
      console.error('[PARSER] Text extraction failed:', err.message)
      return {
        atsScore: 0,
        sections: {
          experience: [],
          education: [],
          skills: [],
          projects: []
        },
        parseMethod: 'fallback',
      }
    }

    if (!text || text.trim().length < 50) {
      console.warn('[PARSER] Extracted text too short, using fallback')
      return parseWithFallback(text, role)
    }

    // Step 2: parse with Groq
    try {
      const result = await parseWithGroq(text, role)
      console.log(
        `[PARSER] Groq parsed: ${result.name}, ` +
        `score: ${result.atsScore}, ` +
        `exp: ${result.sections.experience.length}, ` +
        `skills: ${result.sections.skills.length}`
      )
      return result
    } catch (err: any) {
      console.error('[PARSER] Groq failed:', err.message)
      console.log('[PARSER] Using regex fallback')
      return parseWithFallback(text, role)
    }
  },

  // Parse multiple at once (for bulk)
  parseBulk: async (
    files: Array<{
      buffer: Buffer
      mimeType: string
      filename: string
      role?: string
    }>
  ): Promise<Array<ParsedResumeResult & { filename: string }>> => {
    console.log(`[PARSER] Bulk parsing ${files.length} files...`)
    // Increased batch size for faster parallel parsing
    const BATCH = 5
    const results: Array<ParsedResumeResult & { filename: string }> = []

    for (let i = 0; i < files.length; i += BATCH) {
      const batch = files.slice(i, i + BATCH)
      const batchResults = await Promise.allSettled(
        batch.map(f =>
          parserService.parsePdf(f.buffer, f.role || '', f.mimeType)
        )
      )

      batchResults.forEach((result, idx) => {
        results.push({
          filename: batch[idx].filename,
          ...(result.status === 'fulfilled'
            ? result.value
            : {
              atsScore: 0,
              sections: {
                experience: [],
                education: [],
                skills: [],
                projects: []
              },
              parseMethod: 'fallback' as const,
            }
          )
        })
      })

      // 500ms delay between batches
      if (i + BATCH < files.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    return results
  }
}