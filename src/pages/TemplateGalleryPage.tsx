import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { templateApi } from '../api/templateApi'
import type { ResumeTemplate } from '../types'
import MainLayout from '../components/layout/MainLayout'
import { Search, Filter, Star, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { renderTemplate } from '../utils/templateEngine'

const CATEGORIES = ['ALL', 'PROFESSIONAL', 'CREATIVE', 'MODERN', 'MINIMALIST', 'ATS_OPTIMISED']
const PLANS = ['ALL', 'FREE', 'PREMIUM']

const SAMPLE_RESUME_DATA = {
  personal: {
    name: 'Aayush Rathour',
    email: 'john@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, IN',
    linkedin: 'https://linkedin.com/in/AayushRathour',
    github: 'https://github.com/AayushRathour',
    website: 'https://AayushRathour.dev',
    title: 'Software Engineer',
  },
  summary: 'Experienced professional with a track record of delivering results.',
  skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  experience: [
    {
      id: 'sample-exp',
      company: 'TechCorp',
      position: 'Senior Developer',
      startDate: '2020',
      endDate: 'Present',
      current: true,
      description: 'Built and shipped customer-facing product features.',
    },
  ],
  education: [
    {
      id: 'sample-edu',
      institution: 'IIT Delhi',
      degree: 'B.Tech',
      field: 'Computer Science',
      startDate: '2016',
      endDate: '2020',
      description: 'Graduated with distinction.',
    },
  ],
  projects: [
    {
      id: 'sample-proj',
      name: 'ResumeAI',
      description: 'AI-powered resume builder.',
      technologies: 'React, Spring Boot',
      link: 'https://example.com',
    },
  ],
}

function previewTemplateHtml(template: ResumeTemplate) {
  if (!template.htmlLayout) return ''
  return renderTemplate(template.htmlLayout, SAMPLE_RESUME_DATA as any)
}

export default function TemplateGalleryPage() {
  const { isAuthenticated, isPremium } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [plan, setPlan] = useState('ALL')
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null)

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates-all'],
    queryFn: templateApi.getAll,
  })

  const defaultTemplate = templates.find((t: ResumeTemplate) =>
    t.isActive && t.name?.toLowerCase().includes('default')
  )

  const filtered = templates.filter((t: ResumeTemplate) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'ALL' || !t.category || t.category === category
    const matchPlan = plan === 'ALL' || (plan === 'FREE' ? !t.isPremium : t.isPremium)
    return matchSearch && matchCat && matchPlan
  })

  const handleUseTemplate = (t: ResumeTemplate) => {
    if (t.isPremium && !isPremium) {
      toast.error('Upgrade to Premium to use this template')
      return
    }
    if (!isAuthenticated) {
      sessionStorage.setItem('resumeai_pending_template', String(t.templateId))
      navigate('/login')
      return
    }
    navigate(`/builder/new?templateId=${t.templateId}`)
  }

  return (
    <MainLayout>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Resume Templates</h1>
          <p className="text-slate-500">Professional designs optimised for ATS systems and human reviewers</p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-9" placeholder="Search templates..." />
          </div>
          <div className="flex gap-2">
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-field text-sm w-auto">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={plan} onChange={e => setPlan(e.target.value)} className="input-field text-sm w-auto">
              {PLANS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Start without template */}
        <div className="card p-4 mb-4 flex items-center justify-between bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-100">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Start from scratch</h3>
            <p className="text-xs text-slate-500">Use our clean default template — you can switch templates later anytime.</p>
          </div>
          <button
            onClick={() => {
              if (isLoading) {
                toast.loading('Loading templates...', { id: 'templates-loading' })
                return
              }
              if (!defaultTemplate) {
                toast.error('Default template not found')
                return
              }
              if (!isAuthenticated) {
                sessionStorage.setItem('resumeai_pending_template', String(defaultTemplate.templateId))
                navigate('/login')
                return
              }
              navigate(`/builder/new?templateId=${defaultTemplate.templateId}`)
            }}
            className="btn-primary text-sm shrink-0"
          >
            Start Without Template →
          </button>
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-500 mb-4">{filtered.length} templates</p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Filter size={40} className="mx-auto mb-3 opacity-30" />
            <p>No templates match your filters</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((t: ResumeTemplate) => (
              <div key={t.templateId} className="template-card group">
                {/* Thumbnail */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {t.thumbnailUrl ? (
                    <img src={t.thumbnailUrl} alt={t.name} className="w-full h-full object-cover" />
                  ) : t.htmlLayout ? (
                    <iframe
                      title={t.name}
                      className="w-full h-full pointer-events-none"
                      style={{ border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                      srcDoc={`
                        <html>
                          <head>
                            <style>
                              body { margin: 0; padding: 1rem; font-size: 12px; }
                              ${t.cssStyles || ''}
                            </style>
                          </head>
                          <body>
                            ${previewTemplateHtml(t)}
                          </body>
                        </html>
                      `}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-4 w-full">
                        <div className="h-2 bg-slate-300 rounded mb-1.5 w-3/4 mx-auto" />
                        <div className="h-1.5 bg-slate-200 rounded mb-1 w-1/2 mx-auto" />
                        <div className="h-1 bg-slate-200 rounded mb-3 w-2/3 mx-auto" />
                      </div>
                    </div>
                  )}
                  {t.isPremium && (
                    <div className="absolute top-2 right-2 badge-premium flex items-center gap-1 z-10">
                      <Star size={10} /> Premium
                    </div>
                  )}
                  {!t.isPremium && (
                    <div className="absolute top-2 right-2 badge-free z-10">Free</div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                    <button onClick={() => setPreviewTemplate(t)}
                      className="text-xs bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/30">
                      Preview
                    </button>
                    <button onClick={() => handleUseTemplate(t)}
                      className="text-xs bg-white text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
                      Use This
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-800 text-sm">{t.name}</h3>
                    {t.isPremium && !isPremium && <Lock size={12} className="text-amber-400" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 capitalize">{t.category?.toLowerCase().replace('_', ' ')}</span>
                    <span className="text-xs text-slate-400">{t.usageCount} uses</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setPreviewTemplate(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">{previewTemplate.name}</h3>
                <p className="text-xs text-slate-400">{previewTemplate.category} · {previewTemplate.isPremium ? 'Premium' : 'Free'}</p>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            <div className="p-6 h-[500px]">
              {previewTemplate.htmlLayout ? (
                <iframe
                  title="Preview"
                  className="w-full h-full border-none"
                  srcDoc={`
                    <html>
                      <head>
                        <style>
                          body { margin: 0; padding: 2rem; background: white; }
                          ${previewTemplate.cssStyles || ''}
                        </style>
                      </head>
                      <body>
                        ${previewTemplateHtml(previewTemplate)}
                      </body>
                    </html>
                  `}
                />
              ) : (
                <p className="text-slate-400 text-center py-8">Template preview not available</p>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setPreviewTemplate(null)} className="btn-secondary">Close</button>
              <button onClick={() => { handleUseTemplate(previewTemplate); setPreviewTemplate(null) }} className="btn-primary">
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
