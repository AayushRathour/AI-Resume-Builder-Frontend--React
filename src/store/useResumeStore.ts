import { create } from 'zustand'
/**
 * Central Zustand store for resume builder state.
 * Maintains section data, step navigation, template selection, and JSON hydration.
 */

// ── Structured data types ────────────────────────────────────────────────

export interface PersonalInfo {
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
  title: string // Job title / headline
}

export interface ExperienceItem {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export interface EducationItem {
  id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  description: string
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  technologies: string
  link: string
}

export interface ResumeData {
  personal: PersonalInfo
  summary: string
  skills: string[]
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: ProjectItem[]
}

// ── Steps definition ─────────────────────────────────────────────────────

export const STEPS = [
  { key: 'personal', label: 'Personal Info', icon: 'User' },
  { key: 'summary', label: 'Summary', icon: 'FileText' },
  { key: 'skills', label: 'Skills', icon: 'Zap' },
  { key: 'experience', label: 'Experience', icon: 'Briefcase' },
  { key: 'education', label: 'Education', icon: 'GraduationCap' },
  { key: 'projects', label: 'Projects', icon: 'FolderOpen' },
] as const

export type StepKey = (typeof STEPS)[number]['key']

// ── Defaults ─────────────────────────────────────────────────────────────

const defaultPersonal: PersonalInfo = {
  name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  website: '',
  title: '',
}

const defaultData: ResumeData = {
  personal: { ...defaultPersonal },
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
}

// ── Utility ──────────────────────────────────────────────────────────────

let _idCounter = 0
/** Generates temporary IDs for in-memory section entries before backend sync. */
function uid(): string {
  return `item_${Date.now()}_${++_idCounter}`
}

// ── Store interface ──────────────────────────────────────────────────────

interface ResumeStore {
  // Resume metadata
  resumeId: number | null
  resumeTitle: string
  targetJobTitle: string
  templateId: number | null

  // Structured data
  data: ResumeData

  // Section order (for drag & drop)
  sectionOrder: StepKey[]

  // Step management
  currentStep: number
  totalSteps: number

  // ── Personal ───────────────────────────────────────────────────────
  setPersonalField: (field: keyof PersonalInfo, value: string) => void

  // ── Summary ────────────────────────────────────────────────────────
  setSummary: (value: string) => void

  // ── Skills ─────────────────────────────────────────────────────────
  addSkill: (skill: string) => void
  removeSkill: (index: number) => void
  updateSkill: (index: number, value: string) => void
  setSkills: (skills: string[]) => void

  // ── Experience ─────────────────────────────────────────────────────
  addExperience: () => void
  updateExperience: (id: string, field: keyof ExperienceItem, value: any) => void
  removeExperience: (id: string) => void
  reorderExperience: (startIndex: number, endIndex: number) => void

  // ── Education ──────────────────────────────────────────────────────
  addEducation: () => void
  updateEducation: (id: string, field: keyof EducationItem, value: any) => void
  removeEducation: (id: string) => void
  reorderEducation: (startIndex: number, endIndex: number) => void

  // ── Projects ───────────────────────────────────────────────────────
  addProject: () => void
  updateProject: (id: string, field: keyof ProjectItem, value: any) => void
  removeProject: (id: string) => void
  reorderProject: (startIndex: number, endIndex: number) => void

  // ── Metadata ───────────────────────────────────────────────────────
  setResumeTitle: (title: string) => void
  setTargetJobTitle: (title: string) => void
  setTemplateId: (id: number | null) => void
  setResumeId: (id: number | null) => void

  // ── Section order ──────────────────────────────────────────────────
  setSectionOrder: (order: StepKey[]) => void

  // ── Navigation ─────────────────────────────────────────────────────
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void

  // ── Serialization ──────────────────────────────────────────────────
  toSectionsJson: () => string
  loadFromSectionsJson: (json: string) => void
  loadFromResume: (resume: {
    resumeId: number
    title: string
    targetJobTitle?: string
    templateId?: number
    sectionsJson?: string
  }) => void
  reset: () => void
}

// ── Store creation ───────────────────────────────────────────────────────

const useResumeStore = create<ResumeStore>((set, get) => ({
  // Initial state
  resumeId: null,
  resumeTitle: 'Untitled Resume',
  targetJobTitle: '',
  templateId: null,
  data: { ...defaultData, personal: { ...defaultPersonal } },
  sectionOrder: ['personal', 'summary', 'skills', 'experience', 'education', 'projects'],
  currentStep: 0,
  totalSteps: STEPS.length,

  // ── Personal ─────────────────────────────────────────────────────────
  setPersonalField: (field, value) =>
    set((s) => ({
      data: { ...s.data, personal: { ...s.data.personal, [field]: value } },
    })),

  // ── Summary ──────────────────────────────────────────────────────────
  setSummary: (value) =>
    set((s) => ({ data: { ...s.data, summary: value } })),

  // ── Skills ───────────────────────────────────────────────────────────
  addSkill: (skill) =>
    set((s) => ({
      data: { ...s.data, skills: [...s.data.skills, skill] },
    })),
  removeSkill: (index) =>
    set((s) => ({
      data: { ...s.data, skills: s.data.skills.filter((_, i) => i !== index) },
    })),
  updateSkill: (index, value) =>
    set((s) => ({
      data: {
        ...s.data,
        skills: s.data.skills.map((sk, i) => (i === index ? value : sk)),
      },
    })),
  setSkills: (skills) =>
    set((s) => ({ data: { ...s.data, skills } })),

  // ── Experience ───────────────────────────────────────────────────────
  addExperience: () =>
    set((s) => ({
      data: {
        ...s.data,
        experience: [
          ...s.data.experience,
          { id: uid(), company: '', position: '', startDate: '', endDate: '', current: false, description: '' },
        ],
      },
    })),
  updateExperience: (id, field, value) =>
    set((s) => ({
      data: {
        ...s.data,
        experience: s.data.experience.map((exp) =>
          exp.id === id ? { ...exp, [field]: value } : exp
        ),
      },
    })),
  removeExperience: (id) =>
    set((s) => ({
      data: {
        ...s.data,
        experience: s.data.experience.filter((exp) => exp.id !== id),
      },
    })),
  reorderExperience: (startIndex, endIndex) =>
    set((s) => {
      const result = Array.from(s.data.experience)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return { data: { ...s.data, experience: result } }
    }),

  // ── Education ────────────────────────────────────────────────────────
  addEducation: () =>
    set((s) => ({
      data: {
        ...s.data,
        education: [
          ...s.data.education,
          { id: uid(), institution: '', degree: '', field: '', startDate: '', endDate: '', description: '' },
        ],
      },
    })),
  updateEducation: (id, field, value) =>
    set((s) => ({
      data: {
        ...s.data,
        education: s.data.education.map((edu) =>
          edu.id === id ? { ...edu, [field]: value } : edu
        ),
      },
    })),
  removeEducation: (id) =>
    set((s) => ({
      data: {
        ...s.data,
        education: s.data.education.filter((edu) => edu.id !== id),
      },
    })),
  reorderEducation: (startIndex, endIndex) =>
    set((s) => {
      const result = Array.from(s.data.education)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return { data: { ...s.data, education: result } }
    }),

  // ── Projects ─────────────────────────────────────────────────────────
  addProject: () =>
    set((s) => ({
      data: {
        ...s.data,
        projects: [
          ...s.data.projects,
          { id: uid(), name: '', description: '', technologies: '', link: '' },
        ],
      },
    })),
  updateProject: (id, field, value) =>
    set((s) => ({
      data: {
        ...s.data,
        projects: s.data.projects.map((proj) =>
          proj.id === id ? { ...proj, [field]: value } : proj
        ),
      },
    })),
  removeProject: (id) =>
    set((s) => ({
      data: {
        ...s.data,
        projects: s.data.projects.filter((proj) => proj.id !== id),
      },
    })),
  reorderProject: (startIndex, endIndex) =>
    set((s) => {
      const result = Array.from(s.data.projects)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return { data: { ...s.data, projects: result } }
    }),

  // ── Metadata ─────────────────────────────────────────────────────────
  setResumeTitle: (title) => set({ resumeTitle: title }),
  setTargetJobTitle: (title) => set({ targetJobTitle: title }),
  setTemplateId: (id) => set({ templateId: id }),
  setResumeId: (id) => set({ resumeId: id }),

  // ── Section order ────────────────────────────────────────────────────
  setSectionOrder: (order) => set({ sectionOrder: order }),

  // ── Navigation ───────────────────────────────────────────────────────
  setStep: (step) => set({ currentStep: Math.max(0, Math.min(step, STEPS.length - 1)) }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, STEPS.length - 1) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

  // ── Serialization ────────────────────────────────────────────────────
  toSectionsJson: () => {
    const { data } = get()
    return JSON.stringify(data)
  },

  loadFromSectionsJson: (json) => {
    if (!json) return
    try {
      const parsed = JSON.parse(json)

      // New structured format: has 'personal' object
      if (parsed.personal && typeof parsed.personal === 'object') {
        set({
          data: {
            personal: { ...defaultPersonal, ...parsed.personal },
            summary: parsed.summary || '',
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            experience: Array.isArray(parsed.experience)
              ? parsed.experience.map((e: any) => ({ ...e, id: e.id || uid() }))
              : [],
            education: Array.isArray(parsed.education)
              ? parsed.education.map((e: any) => ({ ...e, id: e.id || uid() }))
              : [],
            projects: Array.isArray(parsed.projects)
              ? parsed.projects.map((p: any) => ({ ...p, id: p.id || uid() }))
              : [],
          },
        })
        return
      }

      // Legacy flat format: { name: "...", email: "...", skills: "JS, Python", ... }
      const personal: PersonalInfo = { ...defaultPersonal }
      const personalKeys = ['name', 'email', 'phone', 'location', 'linkedin', 'github', 'website', 'title']
      for (const key of personalKeys) {
        if (parsed[key]) personal[key as keyof PersonalInfo] = parsed[key]
      }

      const skills = parsed.skills
        ? typeof parsed.skills === 'string'
          ? parsed.skills.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)
          : Array.isArray(parsed.skills)
            ? parsed.skills
            : []
        : []

      // Try to parse experience/education from legacy text
      const parseTextToItems = (text: string, type: 'experience' | 'education' | 'projects') => {
        if (!text) return []
        // If it's already an array (somehow stored as JSON string inside)
        try {
          const arr = JSON.parse(text)
          if (Array.isArray(arr)) return arr.map((item: any) => ({ ...item, id: item.id || uid() }))
        } catch { /* not JSON */ }
        // Otherwise return as single-item description
        if (type === 'experience') return [{ id: uid(), company: '', position: '', startDate: '', endDate: '', current: false, description: text }]
        if (type === 'education') return [{ id: uid(), institution: '', degree: '', field: '', startDate: '', endDate: '', description: text }]
        return [{ id: uid(), name: '', description: text, technologies: '', link: '' }]
      }

      set({
        data: {
          personal,
          summary: parsed.summary || '',
          skills,
          experience: parseTextToItems(parsed.experience, 'experience'),
          education: parseTextToItems(parsed.education, 'education'),
          projects: parseTextToItems(parsed.projects, 'projects'),
        },
      })
    } catch (e) {
      console.error('Failed to parse sectionsJson:', e)
    }
  },

  loadFromResume: (resume) => {
    set({
      resumeId: resume.resumeId,
      resumeTitle: resume.title || 'Untitled Resume',
      targetJobTitle: resume.targetJobTitle || '',
      templateId: resume.templateId ?? null,
      currentStep: 0,
    })
    get().loadFromSectionsJson(resume.sectionsJson || '')
  },

  reset: () =>
    set({
      resumeId: null,
      resumeTitle: 'Untitled Resume',
      targetJobTitle: '',
      templateId: null,
      data: { ...defaultData, personal: { ...defaultPersonal } },
      sectionOrder: ['personal', 'summary', 'skills', 'experience', 'education', 'projects'],
      currentStep: 0,
    }),
}))

export default useResumeStore
