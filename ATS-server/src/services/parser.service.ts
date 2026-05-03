import { PDFDocument } from 'pdf-lib'
import pdfParse from 'pdf-parse'
import type { ParsedResumeResult, ParsedResumeSections } from '../types'

const SECTION_HEADERS = {
  experience: /(work experience|experience|employment)/i,
  education: /(education|academic)/i,
  skills: /(skills|technical skills|technologies)/i,
  projects: /(projects|personal projects)/i,
}

const ROLE_SKILLS: Record<string, string[]> = {
  backend: ['node', 'python', 'java', 'sql', 'api', 'express'],
  frontend: ['react', 'vue', 'angular', 'css', 'html', 'typescript'],
  devops: ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform'],
  fullstack: [
    'node',
    'python',
    'java',
    'sql',
    'api',
    'express',
    'react',
    'vue',
    'angular',
    'css',
    'html',
    'typescript',
  ],
}

function extractEmail(text: string) {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)?.[0]
}

function extractPhone(text: string) {
  return text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/g)?.[0]
}

function extractSocials(text: string) {
  return {
    linkedin: text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i)?.[0],
    github: text.match(/github\.com\/[a-zA-Z0-9_-]+/i)?.[0],
    portfolio: text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9_-]+\.(com|net|org|io|dev|me))(?!\/in\/|\/github\.com)/i)?.[0],
  }
}

function extractName(text: string) {
  const candidates = text
    .split('\n')
    .slice(0, 3)
    .map((line) => line.trim())
    .filter(Boolean)

  return candidates.find((line) => {
    const words = line.split(/\s+/)
    return words.length >= 2 && words.length <= 4 && !/\d|@/.test(line)
  })
}

function splitSections(text: string) {
  const lines = text.split('\n')
  const sections: Record<string, string[]> = {
    experience: [],
    education: [],
    skills: [],
    projects: [],
  }

  let current: keyof typeof sections | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    if (SECTION_HEADERS.experience.test(line)) current = 'experience'
    else if (SECTION_HEADERS.education.test(line)) current = 'education'
    else if (SECTION_HEADERS.skills.test(line)) current = 'skills'
    else if (SECTION_HEADERS.projects.test(line)) current = 'projects'
    else if (current) sections[current].push(line)
  }

  return sections
}

function parseExperience(lines: string[]) {
  return lines
    .filter(Boolean)
    .slice(0, 10)
    .map((line) => {
      const [companyTitle, duration] = line.split(/\s{2,}| - | — /)
      return {
        company: companyTitle?.split(',')[0],
        title: companyTitle?.split(',')[1] || companyTitle,
        duration,
        description: line,
        current: /present/i.test(line),
        technologies: line.match(/[A-Za-z+#.]{2,}/g)?.slice(0, 6) || [],
      }
    })
}

function parseEducation(lines: string[]) {
  return lines
    .filter(Boolean)
    .slice(0, 10)
    .map((line) => ({
      institution: line.split(',')[0],
      degree: line.match(/(b\.tech|m\.tech|mba|bsc|msc|bachelor|master)/i)?.[0],
      year: line.match(/\b(19|20)\d{2}(?:\s*-\s*(19|20)\d{2})?\b/)?.[0],
      grade: line.match(/(cgpa|gpa|grade)[:\s]*([0-9.]+)/i)?.[0],
    }))
}

function parseSkills(lines: string[]) {
  const tokens = lines
    .join(', ')
    .split(/,|•|\||\//)
    .map((token) => token.trim())
    .filter(Boolean)

  return tokens.slice(0, 50).map((name) => ({
    name,
    category: 'technical',
  }))
}

function parseProjects(lines: string[]) {
  return lines
    .filter(Boolean)
    .slice(0, 10)
    .map((line) => ({
      name: line.split(/[:|-]/)[0]?.trim(),
      description: line,
      tech: line.match(/[A-Za-z+#.]{2,}/g)?.slice(0, 8) || [],
    }))
}

function calculateAtsScore(
  sections: ParsedResumeSections,
  role = ''
) {
  let score = 0
  const skillNames = sections.skills.map((skill) => skill.name.toLowerCase())
  const roleKey = Object.keys(ROLE_SKILLS).find((key) => role.includes(key)) || 'backend'
  const expectedSkills = ROLE_SKILLS[roleKey]

  score += sections.experience.length > 0 ? 20 : 0
  score += Math.min(sections.experience.length * 5, 20)
  score += sections.education.length > 0 ? 10 : 0
  score += sections.projects.length > 0 ? 10 : 0
  const matchedSkills = expectedSkills.filter((skill) =>
    skillNames.some((entry) => entry.includes(skill))
  ).length
  score += Math.round((matchedSkills / expectedSkills.length) * 25)

  return Math.min(score, 100)
}

export const parserService = {
  parsePdf: async (buffer: Buffer, role = ''): Promise<ParsedResumeResult> => {
    await PDFDocument.load(buffer)
    const data = await pdfParse(buffer)
    const text = data.text || ''

    const sectionsSplit = splitSections(text)
    const sections: ParsedResumeSections = {
      experience: parseExperience(sectionsSplit.experience),
      education: parseEducation(sectionsSplit.education),
      skills: parseSkills(sectionsSplit.skills),
      projects: parseProjects(sectionsSplit.projects),
    }

    const email = extractEmail(text)
    const phone = extractPhone(text)
    const socials = extractSocials(text)
    const name = extractName(text)
    let atsScore = calculateAtsScore(sections, role)
    if (email) atsScore += 10
    if (phone) atsScore += 5

    return {
      name,
      email,
      phone,
      socials,
      atsScore: Math.min(atsScore, 100),
      sections,
    }
  },
}
