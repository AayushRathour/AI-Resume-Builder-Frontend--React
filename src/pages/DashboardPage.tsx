import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { resumeApi } from '../api/resumeApi'
import { templateApi } from '../api/templateApi'
import { exportApi } from '../api/exportApi'
import type { Resume, ResumeTemplate } from '../types'
import type { ResumeData } from '../store/useResumeStore'
import MainLayout from '../components/layout/MainLayout'
import AtsScoreBar from '../components/AtsScoreBar'
import QuotaBadge from '../components/QuotaBadge'
import { renderTemplate } from '../utils/templateEngine'
import { DEFAULT_TEMPLATE_HTML } from '../templates/defaultTemplate'
import toast from 'react-hot-toast'
import { Plus, Copy, Trash2, Eye, EyeOff, Edit3, Globe, Lock, FileText, TrendingUp, Share2, Download } from 'lucide-react'

type ResumeMeta = {
  name?: string
  title?: string
}

function extractResumeMeta(sectionsJson?: string): ResumeMeta {
  if (!sectionsJson) return {}
  try {
    const parsed = JSON.parse(sectionsJson)
    const personal = parsed?.personal ?? parsed
    return {
      name: typeof personal?.name === 'string' ? personal.name : undefined,
      title: typeof personal?.title === 'string' ? personal.title : undefined,
    }
  } catch {
    return {}
  }
}

function parseResumeData(sectionsJson?: string): ResumeData {
  const empty: ResumeData = {
    personal: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: '',
      title: '',
    },
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
  }
  if (!sectionsJson) return empty
  try {
    const parsed = JSON.parse(sectionsJson)
    if (parsed?.personal) {
      return { ...empty, ...parsed, personal: { ...empty.personal, ...parsed.personal } }
    }
    return {
      ...empty,
      personal: {
        ...empty.personal,
        name: parsed?.name || '',
        email: parsed?.email || '',
        phone: parsed?.phone || '',
        location: parsed?.location || '',
        title: parsed?.title || '',
        linkedin: parsed?.linkedin || '',
        github: parsed?.github || '',
        website: parsed?.website || '',
      },
      summary: parsed?.summary || '',
      skills: Array.isArray(parsed?.skills) ? parsed.skills : empty.skills,
      experience: Array.isArray(parsed?.experience) ? parsed.experience : empty.experience,
      education: Array.isArray(parsed?.education) ? parsed.education : empty.education,
      projects: Array.isArray(parsed?.projects) ? parsed.projects : empty.projects,
    }
  } catch {
    return empty
  }
}

export default function DashboardPage() {
  const { user, isPremium } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  useEffect(() => {
    // If pending templates logic remains, just redirect to /templates
    const pending = Number(sessionStorage.getItem('resumeai_pending_template'))
    if (pending) {
      sessionStorage.removeItem('resumeai_pending_template')
      navigate(`/builder/new?templateId=${pending}`)
    }
  }, [navigate])

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes', user?.userId],
    queryFn: () => resumeApi.getByUser(user!.userId),
    enabled: !!user,
  })

  useEffect(() => {
    console.log('DASHBOARD DATA:', resumes)
  }, [resumes])

  const { data: templates = [] } = useQuery({
    queryKey: ['templates-all'],
    queryFn: templateApi.getAll,
  })

  const templatesById = useMemo(() => {
    const map = new Map<number, ResumeTemplate>()
    templates.forEach((t) => map.set(t.templateId, t))
    return map
  }, [templates])

  const deleteResume = useMutation({
    mutationFn: (id: number) => resumeApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resumes'] }); toast.success('Resume deleted') },
  })

  const duplicateResume = useMutation({
    mutationFn: (id: number) => resumeApi.duplicate(id),
    onSuccess: (newR) => { qc.invalidateQueries({ queryKey: ['resumes'] }); navigate(`/builder/${newR.resumeId}`) },
  })

  const togglePublish = useMutation({
    mutationFn: (r: Resume) => r.isPublic ? resumeApi.unpublish(r.resumeId) : resumeApi.publish(r.resumeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resumes'] }),
  })

  const { data: exportStats } = useQuery({
    queryKey: ['export-stats', user?.userId],
    queryFn: () => exportApi.getStats(user!.userId),
    enabled: !!user,
  })

  const copyShareLink = (r: Resume) => {
    const url = `${window.location.origin}/gallery`
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Gallery link copied to clipboard!'))
      .catch(() => toast.error('Could not copy link'))
  }

  const canCreate = isPremium || resumes.length < 3

  return (
    <MainLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Resumes</h1>
            <p className="text-slate-500 text-sm mt-1">
              {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
              {!isPremium && ` · ${3 - resumes.length} slots remaining`}
            </p>
          </div>
          <button onClick={() => canCreate ? navigate('/templates') : toast.error('Upgrade to Premium for unlimited resumes', { id: 'free-limit' })}
            className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Resume
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Resume Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-xl animate-pulse" />)}
              </div>
            ) : resumes.length === 0 ? (
              <div className="card p-16 text-center">
                <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No resumes yet</h3>
                <p className="text-slate-400 text-sm mb-6">Create your first AI-powered resume in minutes</p>
                <button onClick={() => navigate('/templates')} className="btn-primary">
                  Create your first resume
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {resumes.map((r: Resume) => {
                  const meta = extractResumeMeta(r.sectionsJson)
                  const displayName = meta.name?.trim() || r.title || 'Untitled Resume'
                  const displayTitle = meta.title?.trim() || r.targetJobTitle || 'No Title'
                  const template = r.templateId ? templatesById.get(r.templateId) : undefined
                  const resumeData = parseResumeData(r.sectionsJson)
                  const templateHtml = template?.htmlLayout || DEFAULT_TEMPLATE_HTML
                  const templateCss = template?.cssStyles || ''
                  const previewHtml = renderTemplate(templateHtml, resumeData)
                  return (
                  <div key={r.resumeId} className="card hover:shadow-md transition-all group">
                    {/* Preview area */}
                    <div className="h-36 bg-gradient-to-br from-primary-50 to-indigo-100 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                      {template?.thumbnailUrl ? (
                        <img src={template.thumbnailUrl} alt={template.name} className="w-full h-full object-cover" />
                      ) : (
                        <iframe
                          title={`Resume ${r.resumeId} preview`}
                          className="w-full h-full pointer-events-none bg-white"
                          style={{ border: 'none' }}
                          srcDoc={`
                            <html>
                              <head>
                                <style>
                                  html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
                                  #scale { transform: scale(0.12); transform-origin: top left; }
                                  #page { width: 210mm; min-height: 297mm; }
                                  body { overflow: hidden; }
                                  ${templateCss}
                                </style>
                              </head>
                              <body>
                                <div id="scale">
                                  <div id="page">
                                    ${previewHtml}
                                  </div>
                                </div>
                              </body>
                            </html>
                          `}
                        />
                      )}
                      {/* Actions overlay */}
                      <div className="absolute inset-0 bg-primary-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Link to={`/builder/${r.resumeId}`} className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors" title="Edit">
                          <Edit3 size={16} />
                        </Link>
                        <button onClick={() => duplicateResume.mutate(r.resumeId)}
                          className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors" title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => togglePublish.mutate(r)}
                          className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors" title={r.isPublic ? 'Unpublish' : 'Publish'}>
                          {r.isPublic ? <EyeOff size={16} /> : <Globe size={16} />}
                        </button>
                        {r.isPublic && (
                          <button onClick={() => copyShareLink(r)}
                            className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors" title="Copy share link">
                            <Share2 size={16} />
                          </button>
                        )}
                        <button onClick={() => { if(confirm('Delete this resume?')) deleteResume.mutate(r.resumeId) }}
                          className="p-2 bg-red-500/60 hover:bg-red-500/80 rounded-lg text-white transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-slate-800 text-sm truncate mb-1">{displayName}</h3>
                      <p className="text-xs text-slate-400 mb-3">{displayTitle}</p>
                      <AtsScoreBar score={r.atsScore} />
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          {r.isPublic ? <Globe size={11} className="text-green-500" /> : <Lock size={11} />}
                          <span>{r.isPublic ? 'Public' : 'Private'}</span>
                          <span className="text-slate-200">·</span>
                          <span className={`capitalize ${r.status === 'COMPLETE' ? 'text-green-600' : 'text-amber-600'}`}>{r.status}</span>
                        </div>
                        <Link to={`/builder/${r.resumeId}`} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                          Edit →
                        </Link>
                      </div>
                    </div>
                  </div>
                )})}

                {/* Add new card */}
                {canCreate && (
                  <button onClick={() => navigate('/templates')}
                    className="h-full min-h-[220px] border-2 border-dashed border-slate-200 hover:border-primary-300 hover:bg-primary-50 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-primary-600 transition-all group">
                    <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center group-hover:border-primary-500 transition-colors">
                      <Plus size={20} />
                    </div>
                    <span className="text-sm font-medium">New Resume</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <QuotaBadge />

            <div className="card p-4">
              <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-primary-500" /> Quick Stats
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Total Resumes', value: resumes.length },
                  { label: 'Published', value: resumes.filter((r: Resume) => r.isPublic).length },
                  { label: 'Avg ATS Score', value: resumes.length > 0 ? Math.round(resumes.reduce((a: number, r: Resume) => a + r.atsScore, 0) / resumes.length) + '/100' : 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                <Download size={14} className="text-green-500" /> Export Stats
              </h3>
              {exportStats && Object.keys(exportStats).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(exportStats).map(([format, count]) => (
                    <div key={format} className="flex justify-between text-sm">
                      <span className="text-slate-500">{format}</span>
                      <span className="font-semibold text-slate-700">{count as number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No exports yet.</p>
              )}
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-slate-700 text-sm mb-3">Quick Links</h3>
              <div className="space-y-1">
                {[
                  { to: '/templates', label: 'Browse Templates' },
                  { to: '/job-match', label: 'Job Matching' },
                  { to: '/exports', label: 'Export History' },
                  { to: '/gallery', label: 'Public Gallery' },
                ].map(({ to, label }) => (
                  <Link key={to} to={to} className="block text-sm text-primary-600 hover:text-primary-700 py-1 hover:translate-x-1 transition-transform">
                    {label} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
    </MainLayout>
  )
}
