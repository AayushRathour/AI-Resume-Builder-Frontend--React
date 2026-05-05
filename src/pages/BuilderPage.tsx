import { useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { resumeApi } from '../api/resumeApi'
import { templateApi } from '../api/templateApi'
import { exportApi } from '../api/exportApi'
import type { Resume, ResumeTemplate } from '../types'
import useResumeStore, { STEPS } from '../store/useResumeStore'
import MainLayout from '../components/layout/MainLayout'
import toast from 'react-hot-toast'
import { Download, Loader2, Globe, Lock, Save } from 'lucide-react'

// Step components
import StepIndicator from '../components/builder/StepIndicator'
import StepNavigation from '../components/builder/StepNavigation'
import LivePreview from '../components/builder/LivePreview'
import TemplateSwitcher from '../components/builder/TemplateSwitcher'
import PersonalInfoStep from '../components/builder/PersonalInfoStep'
import SummaryStep from '../components/builder/SummaryStep'
import SkillsStep from '../components/builder/SkillsStep'
import ExperienceStep from '../components/builder/ExperienceStep'
import EducationStep from '../components/builder/EducationStep'
import ProjectsStep from '../components/builder/ProjectsStep'

// ── Step renderer ────────────────────────────────────────────────────────

function CurrentStepContent() {
  const currentStep = useResumeStore((s) => s.currentStep)
  const stepKey = STEPS[currentStep]?.key

  switch (stepKey) {
    case 'personal': return <PersonalInfoStep />
    case 'summary': return <SummaryStep />
    case 'skills': return <SkillsStep />
    case 'experience': return <ExperienceStep />
    case 'education': return <EducationStep />
    case 'projects': return <ProjectsStep />
    default: return <PersonalInfoStep />
  }
}

// ── Main Builder Page ────────────────────────────────────────────────────

export default function BuilderPage() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()

  const isNew = resumeId === 'new'
  const urlTemplateId = Number(searchParams.get('templateId')) || null

  // Zustand store selectors
  const store = useResumeStore()
  const storeTemplateId = useResumeStore((s) => s.templateId)
  const resumeTitle = useResumeStore((s) => s.resumeTitle)
  const targetJobTitle = useResumeStore((s) => s.targetJobTitle)

  // ── Data fetching ────────────────────────────────────────────────────

  // Load existing resume
  const { data: resume, isLoading: resumeLoading } = useQuery<Resume>({
    queryKey: ['resume', resumeId],
    queryFn: () => resumeApi.getById(Number(resumeId)),
    enabled: !isNew && !!resumeId,
  })

  // Determine which template to fetch
  const templateIdToFetch = storeTemplateId ?? (isNew ? urlTemplateId : resume?.templateId) ?? null

  // Fetch template (only if one is selected)
  const { data: template, isLoading: templateLoading } = useQuery<ResumeTemplate>({
    queryKey: ['template-detail', templateIdToFetch],
    queryFn: () => templateApi.getById(templateIdToFetch!),
    enabled: !!templateIdToFetch && templateIdToFetch > 0,
  })

  // ── Initialize store from loaded data ────────────────────────────────

  useEffect(() => {
    if (resume && !isNew) {
      store.loadFromResume({
        resumeId: resume.resumeId,
        title: resume.title,
        targetJobTitle: resume.targetJobTitle,
        templateId: resume.templateId,
        sectionsJson: resume.sectionsJson,
      })
    } else if (isNew) {
      store.reset()
      if (urlTemplateId) {
        store.setTemplateId(urlTemplateId)
      }
    }
    // Only run when resume data changes or on mount for new
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, isNew])

  // ── Save mutation ────────────────────────────────────────────────────

  const buildSavePayload = () => {
    const state = useResumeStore.getState()
    const personalName = state.data.personal.name?.trim()
    const personalTitle = state.data.personal.title?.trim()
    const resumeTitleInput = state.resumeTitle?.trim()
    const targetJobTitleInput = state.targetJobTitle?.trim()
    const resolvedResumeTitle = resumeTitleInput && resumeTitleInput !== 'Untitled Resume'
      ? resumeTitleInput
      : (personalName || 'Untitled Resume')
    const resolvedTargetJobTitle = targetJobTitleInput && targetJobTitleInput !== 'No Title'
      ? targetJobTitleInput
      : (personalTitle || 'No Title')
    const payload = {
      name: personalName || resolvedResumeTitle,
      title: resolvedResumeTitle,
      email: state.data.personal.email || undefined,
      phone: state.data.personal.phone || undefined,
      location: state.data.personal.location || undefined,
      targetJobTitle: resolvedTargetJobTitle,
      templateId: state.templateId ?? null,
      language: 'English',
      summary: state.data.summary || undefined,
      skills: JSON.stringify(state.data.skills ?? []),
      experience: JSON.stringify(state.data.experience ?? []),
      education: JSON.stringify(state.data.education ?? []),
      projects: JSON.stringify(state.data.projects ?? []),
      sectionsJson: state.toSectionsJson(),
    }
    console.log('SAVING:', payload)
    return payload
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildSavePayload()
      if (isNew) {
        return resumeApi.create(payload as any)
      }
      return resumeApi.update(Number(resumeId), payload as any)
    },
    onSuccess: (savedResume: Resume) => {
      toast.success(isNew ? 'Resume created!' : 'Resume saved!')
      qc.invalidateQueries({ queryKey: ['resume', String(savedResume.resumeId)] })
      if (isNew) {
        store.setResumeId(savedResume.resumeId)
        navigate(`/builder/${savedResume.resumeId}`, { replace: true })
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save resume.'),
  })

  // ── Publish toggle ───────────────────────────────────────────────────

  const togglePublish = useMutation({
    mutationFn: () =>
      resume!.isPublic ? resumeApi.unpublish(resume!.resumeId) : resumeApi.publish(resume!.resumeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resume', resumeId] }),
  })

  // ── Export ───────────────────────────────────────────────────────────

  const handleExport = async (format: 'PDF') => {
    if (isNew) {
      toast.error('Please save your resume first')
      return
    }
    toast.loading('Preparing PDF...', { id: 'pdf' })
    try {
      const savedResume = await saveMutation.mutateAsync()
      const exportResumeId = savedResume?.resumeId ?? Number(resumeId)
      const exportTemplateId = savedResume?.templateId ?? storeTemplateId ?? templateIdToFetch ?? null
      await exportApi.exportPdf(exportResumeId, user!.userId, exportTemplateId)
      toast.success('PDF generated! Check your downloads.', { id: 'pdf' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Export failed.'
      toast.error(message, { id: 'pdf' })
    }
  }

  // ── Loading state ────────────────────────────────────────────────────

  if (resumeLoading || (templateLoading && !!templateIdToFetch)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading your resume...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <input
                value={resumeTitle}
                onChange={(e) => store.setResumeTitle(e.target.value)}
                className="text-2xl font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0"
                placeholder="Resume Title"
              />
            </div>
            <input
              value={targetJobTitle}
              onChange={(e) => store.setTargetJobTitle(e.target.value)}
              className="text-sm text-slate-500 bg-transparent border-none outline-none focus:ring-0 p-0 mt-0.5"
              placeholder="Target Job Title (e.g. Software Engineer)"
            />
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <>
                <button
                  onClick={() => togglePublish.mutate()}
                  className="flex items-center gap-1.5 text-xs btn-secondary py-2 px-4"
                >
                  {resume?.isPublic ? (
                    <><Globe size={14} className="text-green-500" /> Published</>
                  ) : (
                    <><Lock size={14} /> Private</>
                  )}
                </button>
                <button
                  onClick={() => handleExport('PDF')}
                  className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Download size={14} /> Export PDF
                </button>
              </>
            )}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              {saveMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {isNew ? 'Create & Save' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-6">
          <StepIndicator />
        </div>

        {/* Main layout: Form + Preview */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Form steps */}
          <div className="space-y-4">
            <div className="card p-6">
              <CurrentStepContent />
              <StepNavigation />
            </div>

            {/* Template Switcher */}
            <TemplateSwitcher />
          </div>

          {/* Right: Live Preview */}
          <div>
            <LivePreview
              templateHtml={template?.htmlLayout}
              templateCss={template?.cssStyles}
              templateName={template?.name}
              useEmptyTemplate={!templateIdToFetch}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
