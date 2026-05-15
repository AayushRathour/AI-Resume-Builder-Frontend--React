// ── Auth ──────────────────────────────────────────────────
export interface User {
  userId: number
  fullName: string
  email: string
  phone?: string
  role: 'USER' | 'ADMIN'
  subscriptionPlan: 'FREE' | 'PREMIUM'
  isActive: boolean
  isDeleted?: boolean
  deletedAt?: string
  provider: 'LOCAL' | 'GOOGLE' | 'LINKEDIN'
  createdAt: string
}

export interface AuthResponse {
  token: string
  email: string
  fullName: string
  role: string
  subscriptionPlan: string
  userId: number
  provider?: string   // optional — set by OAuthSuccessPage, omitted by form login
  // OTP flow fields
  requiresOtp?: boolean
  otpEmail?: string
  userName?: string
  otpPurpose?: string
  rawOtp?: string  // Raw OTP for EmailJS sending (only present during register/login response)
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  phone?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
}

// ── OTP ───────────────────────────────────────────────────
export interface OtpResponse {
  success: boolean
  message: string
  email?: string
  name?: string
  expiresInSeconds?: number
  resendCooldownSeconds?: number
  rawOtp?: string  // Raw OTP for EmailJS sending (only on generate/resend)
  authResponse?: AuthResponse
}

export interface OtpRequest {
  email: string
  purpose: string  // REGISTER | LOGIN | RESET_PASSWORD
}

export interface OtpVerifyRequest {
  email: string
  otp: string
  purpose: string
}


// ── Resume ────────────────────────────────────────────────
export interface Resume {
  resumeId: number
  userId: number
  name?: string
  title: string
  email?: string
  phone?: string
  location?: string
  targetJobTitle?: string
  templateId?: number
  summary?: string
  skills?: string
  experience?: string
  education?: string
  projects?: string
  atsScore: number | null
  status: 'DRAFT' | 'COMPLETE'
  language: string
  sectionsJson?: string
  isPublic: boolean
  viewCount: number
  createdAt: string
  updatedAt?: string
}

// ── Section ───────────────────────────────────────────────
export type SectionType =
  | 'SUMMARY' | 'EXPERIENCE' | 'EDUCATION' | 'SKILLS'
  | 'CERTIFICATIONS' | 'PROJECTS' | 'LANGUAGES' | 'VOLUNTEER' | 'CUSTOM'

export interface ResumeSection {
  sectionId: number
  resumeId: number
  sectionType: SectionType
  title: string
  content: string    // JSON string
  displayOrder: number
  isVisible: boolean
  aiGenerated: boolean
  createdAt: string
  updatedAt?: string
}

export interface ReorderRequest {
  sectionId: number
  displayOrder: number
}

// ── Template ──────────────────────────────────────────────
export interface ResumeTemplate {
  templateId: number
  name: string
  description?: string
  thumbnailUrl?: string
  htmlLayout: string
  cssStyles: string
  fieldsJson?: string
  category: 'PROFESSIONAL' | 'CREATIVE' | 'MODERN' | 'MINIMALIST' | 'ATS_OPTIMISED'
  isPremium: boolean
  isActive: boolean
  usageCount: number
  createdAt: string
}

// ── AI ────────────────────────────────────────────────────
export interface AiRequest {
  requestId: string
  userId: number
  resumeId?: number
  requestType: string
  inputPrompt: string
  aiResponse: string
  model: string
  tokensUsed: number
  status: 'QUEUED' | 'COMPLETED' | 'FAILED'
  createdAt: string
  completedAt?: string
}

export interface AtsResult {
  score: number
  missingKeywords: string[]
  suggestions: string[]
  rawResponse: string
}

export interface QuotaInfo {
  contentRemaining: number
  atsRemaining: number
  contentAllowed: number
  atsAllowed: number
  contentUsed: number
  atsUsed: number
}

// ── Export ────────────────────────────────────────────────
export interface ExportJob {
  jobId: string
  resumeId: number
  userId: number
  format: 'PDF' | 'DOCX' | 'JSON'
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  fileUrl?: string
  fileSizeKb?: number
  requestedAt: string
  completedAt?: string
  expiresAt?: string
}

// ── JobMatch ──────────────────────────────────────────────
export interface JobMatch {
  matchId: number | string
  resumeId: number
  userId: number
  jobTitle: string
  jobDescription: string
  company?: string
  location?: string
  jobUrl?: string
  matchScore: number
  missingSkills?: string
  recommendations?: string
  source: 'LINKEDIN' | 'NAUKRI' | 'MANUAL' | 'THEIRSTACK'
  isBookmarked: boolean
  matchedAt: string
}

// ── Notification ──────────────────────────────────────────
export interface Notification {
  notificationId: number | string
  recipientId: number
  type: string
  title: string
  message: string
  channel: 'APP' | 'EMAIL'
  relatedId?: number
  relatedType?: string
  isRead: boolean
  sentAt: string
}
