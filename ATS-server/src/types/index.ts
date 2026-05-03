export type UserRole = 'hr' | 'interviewer'

export interface ParsedEducation {
  institution?: string
  degree?: string
  year?: string
  grade?: string
}

export interface ParsedExperience {
  company?: string
  title?: string
  duration?: string
  description?: string
  current?: boolean
  technologies?: string[]
}

export interface ParsedProject {
  name?: string
  description?: string
  tech?: string[]
}

export interface ParsedSkill {
  name: string
  level?: string
  category?: string
}

export interface ParsedResumeSections {
  education: ParsedEducation[]
  experience: ParsedExperience[]
  projects: ParsedProject[]
  skills: ParsedSkill[]
}

export interface ParsedResumeResult {
  name?: string
  email?: string
  phone?: string
  socials?: {
    linkedin?: string
    github?: string
    portfolio?: string
  }
  atsScore: number
  sections: ParsedResumeSections
}

export interface CandidateFilters {
  role?: string
  status?: string
  search?: string
  minAtsScore?: number
  round?: number
}

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}
