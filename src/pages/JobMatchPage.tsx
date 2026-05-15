import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { resumeApi } from '../api/resumeApi'
import { jobMatchApi } from '../api/jobMatchApi'
import type { JobMatch, Resume } from '../types'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { Briefcase, Search, Bookmark, BookmarkCheck, Loader2, Target, MapPin, TrendingUp, ExternalLink, UploadCloud, FileText, SearchCheck, Sparkles, BadgeCheck, HardDriveDownload, CheckCircle2, Bot } from 'lucide-react'

/**
 * Job matching page for resume-to-job analysis workflows.
 * Covers resume parsing, live search, saved jobs, and scored match results.
 */
type JobListing = {
  title?: string
  company?: string
  location?: string
  url?: string
  description?: string
  source?: string
}

type ExtractedData = {
  skills?: string[]
  roles?: string[]
  keywords?: string[]
  experienceLevel?: string
  summary?: string
}

const analysisStages = [
  { key: 'uploading', label: 'Uploading resume', icon: UploadCloud },
  { key: 'extracting', label: 'Analyzing skills and keywords', icon: Sparkles },
  { key: 'searching', label: 'Searching jobs', icon: SearchCheck },
  { key: 'matching', label: 'Matching jobs to resume', icon: Briefcase },
  { key: 'done', label: 'Analysis complete', icon: CheckCircle2 },
] as const

export default function JobMatchPage() {
  const { user, isPremium } = useAuth()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'analyze' | 'live' | 'saved' | 'matches'>('analyze')
  const [selectedResumeId, setSelectedResumeId] = useState<number | ''>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('India')
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [savedJobs, setSavedJobs] = useState<JobListing[]>([])
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveInitialized, setLiveInitialized] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analysisStage, setAnalysisStage] = useState<'idle' | 'uploading' | 'extracting' | 'searching' | 'matching' | 'done' | 'error'>('idle')
  const [analysisResumeLabel, setAnalysisResumeLabel] = useState('')
  const [noJobsReason, setNoJobsReason] = useState('')

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes', user?.userId],
    queryFn: () => resumeApi.getByUser(user!.userId),
    enabled: !!user,
  })

  const { data: matches = [] } = useQuery({
    queryKey: ['matches', user?.userId],
    queryFn: () => jobMatchApi.getTopMatches(user!.userId),
    enabled: !!user && isPremium,
  })

  const bookmark = useMutation({
    mutationFn: ({ matchId, bookmarked }: { matchId: number | string; bookmarked: boolean }) =>
      jobMatchApi.bookmark(matchId, bookmarked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  })

  /** Builds compact search terms from manual input and extracted profile attributes. */
  const buildSearchQuery = (data: ExtractedData | null) => {
    const tokens = [
      jobTitle.trim(),
      ...(data?.roles ?? []),
      ...(data?.skills ?? []),
      ...(data?.keywords ?? []),
    ]
      .map(token => token.trim())
      .filter(Boolean)

    return Array.from(new Set(tokens)).slice(0, 8).join(' ')
  }

  const handleAnalyze = async () => {
    // if (!isPremium) { toast.error('Job matching requires Premium'); return }
    if (!selectedResumeId && !uploadedFile) { toast.error('Select a resume or upload a PDF'); return }
    setAnalyzeLoading(true)
    setAnalysisStage('uploading')
    setNoJobsReason('')
    setAnalysisResumeLabel(uploadedFile?.name ?? resumes.find((resume: Resume) => resume.resumeId === selectedResumeId)?.title ?? 'Selected resume')
    setExtractedData(null)
    try {
      const formData = new FormData()
      if (uploadedFile) {
        formData.append('file', uploadedFile)
      }
      if (selectedResumeId) {
        formData.append('resumeId', selectedResumeId.toString())
      }
      if (user) formData.append('userId', user.userId.toString())
      if (jobTitle.trim()) formData.append('jobTitle', jobTitle.trim())
      if (location) formData.append('location', location)

      setAnalysisStage('extracting')
      const response = await jobMatchApi.analyzeWithFile(formData)
      const nextExtractedData = response?.extractedData ?? null
      setExtractedData(nextExtractedData)
      setAnalysisStage('searching')

      const searchQuery = buildSearchQuery(nextExtractedData)
      const backendJobs = Array.isArray(response?.jobs) ? response.jobs : []
      const searchJobs = await jobMatchApi.search(
        searchQuery || jobTitle.trim() || 'software developer',
        location
      )
      const nextJobs = searchJobs.length > 0 ? searchJobs : backendJobs

      setAnalysisStage('matching')
      setJobs(nextJobs)
      if (nextJobs.length > 0) setSavedJobs(nextJobs)

      setAnalysisStage('done')
      qc.invalidateQueries({ queryKey: ['matches'] })
      if (nextJobs.length === 0) {
        setNoJobsReason('No jobs matched from external providers or fallback pool for this query right now. Try a broader title (for example "Software Developer") or remove location.')
      }
      toast.success(`Analysis complete. Found ${nextJobs.length || '0'} jobs.`)
    } catch (e: any) {
      setAnalysisStage('error')
      const errorMsg = e.response?.data?.error || e.response?.data || e.message || 'Analysis failed'
      console.error('Analysis error:', errorMsg)
      toast.error(`Analysis failed: ${errorMsg}`, { id: 'job-analyze-err' }) 
    } finally { 
      setAnalyzeLoading(false) 
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
      setSelectedResumeId('') // Clear selected resume if file is uploaded
    }
  }

  const handleFetchJobs = async () => {
    // if (!isPremium) { toast.error('Live job search requires Premium', { id: 'job-premium' }); return }
    setLiveInitialized(true)
    setLiveLoading(true)
    try {
      const nextJobs = await jobMatchApi.search(jobTitle.trim() || 'software developer', location)
      setJobs(nextJobs)
      if (nextJobs.length > 0) setSavedJobs(nextJobs)
      if (nextJobs.length === 0) toast('No jobs found. Try different search terms.')
    } catch { toast.error('Could not fetch jobs from Adzuna.', { id: 'job-fetch-err' }) }
    finally { setLiveLoading(false) }
  }

  const handleFetchSavedJobs = async () => {
    setSavedLoading(true)
    try {
      const nextJobs = await jobMatchApi.getSavedJobs()
      setSavedJobs(nextJobs)
      if (nextJobs.length === 0) toast('No saved jobs found yet.')
    } catch {
      toast.error('Could not load saved jobs.', { id: 'job-saved-err' })
    } finally {
      setSavedLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'live' && jobs.length === 0 && !liveLoading && !liveInitialized && isPremium) {
      void handleFetchJobs()
    }
  }, [activeTab, jobs.length, liveLoading, liveInitialized, isPremium])

  useEffect(() => {
    if (activeTab === 'saved' && savedJobs.length === 0 && !savedLoading) {
      void handleFetchSavedJobs()
    }
  }, [activeTab, savedJobs.length, savedLoading])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase size={24} className="text-primary-500" /> Job Matching
          </h1>
          <p className="text-slate-500 text-sm mt-1">Analyse your resume against job descriptions and find matching jobs</p>
          {!isPremium && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <BadgeCheck size={14} className="inline-block mr-1 align-[-2px]" /> Job matching is a Premium feature. <a href="/profile" className="underline font-medium">Upgrade to unlock</a>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-6">
          {[
            { key: 'analyze', label: 'Analyze Resume', icon: FileText },
            { key: 'live', label: 'Live Job Search', icon: SearchCheck },
            { key: 'saved', label: 'Saved Jobs', icon: HardDriveDownload },
            { key: 'matches', label: `My Matches (${matches.length})`, icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <span className="inline-flex items-center gap-2">
                <Icon size={14} />
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* ANALYZE TAB */}
        {activeTab === 'analyze' && (
          <div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-slate-700">Find Matching Jobs</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">1. Select Existing Resume</label>
                <select value={selectedResumeId} onChange={e => {
                    setSelectedResumeId(Number(e.target.value))
                    if (e.target.value) setUploadedFile(null)
                  }}
                  className="input-field" disabled={!isPremium}>
                  <option value="">Choose a resume...</option>
                  {resumes.map((r: Resume) => (
                    <option key={r.resumeId} value={r.resumeId}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div className="text-center text-sm text-slate-400 font-medium my-2">OR</div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Upload Resume (PDF)</label>
                <div 
                  onClick={() => isPremium && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${!isPremium ? 'border-slate-200 bg-slate-50 opacity-50' : uploadedFile ? 'border-primary-400 bg-primary-50' : 'border-slate-300 hover:border-primary-400'}`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" disabled={!isPremium} />
                  <UploadCloud size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    {uploadedFile ? uploadedFile.name : 'Click to upload PDF'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Title (Optional)</label>
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  className="input-field" placeholder="e.g. Senior React Developer" disabled={!isPremium} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Location (Optional)</label>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  className="input-field" placeholder="e.g. Remote, India, New York" disabled={!isPremium} />
              </div>
              
              <button onClick={handleAnalyze} disabled={!isPremium || analyzeLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                {analyzeLoading ? <><Loader2 size={14} className="animate-spin" /> Analyzing & Fetching...</> : <><Search size={14} /> Find Jobs</>}
              </button>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Bot size={14} className="text-primary-500" /> Resume analysis progress
                </div>
                <div className="space-y-2">
                  {analysisStages.map((step, index) => {
                    const activeIndex = analysisStages.findIndex(item => item.key === analysisStage)
                    const isActive = analysisStage === step.key
                    const isDone = activeIndex > index || analysisStage === 'done'
                    const StageIcon = step.icon

                    return (
                      <div key={step.key} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-primary-50 text-primary-700' : isDone ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'}`}>
                        <span className="shrink-0">
                          {isDone ? <CheckCircle2 size={14} /> : <StageIcon size={14} />}
                        </span>
                        <span>{step.label}</span>
                      </div>
                    )
                  })}
                </div>
                {(analysisResumeLabel || extractedData) && (
                  <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Sparkles size={16} className="text-amber-500" /> 🧠 AI Extracted Profile
                    </div>
                    {analysisResumeLabel && (
                      <div className="text-xs text-slate-600">
                        <span className="font-medium text-slate-700">📄 Resume:</span> {analysisResumeLabel}
                      </div>
                    )}
                    {extractedData?.roles?.length ? (
                      <div className="text-xs text-slate-600">
                        <span className="font-medium text-slate-700">💼 Roles:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {extractedData.roles.slice(0, 5).map((role) => (
                            <span key={role} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {extractedData?.skills?.length ? (
                      <div className="text-xs text-slate-600">
                        <span className="font-medium text-slate-700">⚙️ Top Skills:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {extractedData.skills.slice(0, 8).map((skill) => (
                            <span key={skill} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              [{skill}]
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {extractedData?.keywords?.length ? (
                      <div className="text-xs text-slate-600">
                        <span className="font-medium text-slate-700">🔑 Keywords:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {extractedData.keywords.slice(0, 10).map((kw) => (
                            <span key={kw} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {extractedData?.experienceLevel ? (
                      <div className="text-xs text-slate-600">
                        <span className="font-medium text-slate-700">📊 Experience Level:</span> <span className="ml-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">{extractedData.experienceLevel}</span>
                      </div>
                    ) : null}
                    {extractedData?.summary ? (
                      <div className="text-xs text-slate-600">
                        <span className="font-medium text-slate-700">📝 Summary:</span>
                        <p className="mt-1 text-slate-500 leading-relaxed whitespace-pre-wrap">{extractedData.summary}</p>
                      </div>
                    ) : null}
                  </div>
                )}
                {analysisStage === 'done' && (
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Resume analysis done. Starting job search results below.
                  </div>
                )}
                {analysisStage === 'done' && jobs.length === 0 && noJobsReason && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                    <p className="font-medium">No matching jobs found yet.</p>
                    <p className="mt-1">{noJobsReason}</p>
                  </div>
                )}
              </div>
            </div>

              <div className="card p-6">
                <h3 className="font-semibold text-slate-700 mb-4">How it works</h3>
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Select or Upload', desc: 'Choose an existing resume or upload a new PDF.' },
                    { step: '2', title: 'AI Extraction', desc: 'We extract keywords, skills, and roles automatically.' },
                    { step: '3', title: 'Job Search', desc: 'We search our global job database for the best matches.' },
                    { step: '4', title: 'Smart Scoring', desc: 'Get a 0-100 score with missing skills analysis.' },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex gap-3">
                      <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{step}</div>
                      <div>
                        <p className="font-medium text-slate-700 text-sm">{title}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {jobs.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-700">Adzuna Jobs</h3>
                  <p className="text-xs text-slate-400">Showing {jobs.length} result{jobs.length === 1 ? '' : 's'}</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobs.map((job, index) => (
                    <div key={`${job.url ?? job.title ?? 'job'}-${index}`} className="card p-4 hover:shadow-md transition-all">
                      <h3 className="font-semibold text-slate-800 text-sm mb-1">{job.title || 'Untitled'}</h3>
                      <p className="text-xs text-slate-500 mb-2">{job.company || 'Unknown Company'}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><MapPin size={10} />{job.location || 'Unknown'}</span>
                        {job.source && <span className="uppercase text-[10px] tracking-wide text-slate-500">{job.source}</span>}
                      </div>
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noreferrer"
                          className="mt-3 text-xs text-primary-600 flex items-center gap-1 hover:text-primary-700">
                          Apply <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIVE SEARCH TAB */}
        {activeTab === 'live' && (
          <div>
            <div className="card p-4 mb-4">
              <div className="grid md:grid-cols-3 gap-3">
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  className="input-field md:col-span-1" placeholder="Job title (e.g. Full Stack Developer)" disabled={!isPremium} />
                <input value={location} onChange={e => setLocation(e.target.value)}
                  className="input-field" placeholder="Location" disabled={!isPremium} />
                <button onClick={handleFetchJobs} disabled={!isPremium || liveLoading} className="btn-primary px-3 flex items-center justify-center gap-2">
                  {liveLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Search
                </button>
              </div>
            </div>

            {jobs.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {jobs.map((job, i) => (
                  <div key={i} className="card p-4 hover:shadow-md transition-all">
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">{job.title || 'Untitled'}</h3>
                    <p className="text-xs text-slate-500 mb-2">{job.company || 'Unknown Company'}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={10} />{job.location || location}</span>
                      {job.source && <span className="uppercase text-[10px] tracking-wide text-slate-500">{job.source}</span>}
                    </div>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noreferrer"
                        className="mt-3 text-xs text-primary-600 flex items-center gap-1 hover:text-primary-700">
                        Apply <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Search size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Loading jobs from Adzuna...</p>
              </div>
            )}
          </div>
        )}

        {/* SAVED JOBS TAB */}
        {activeTab === 'saved' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Saved Adzuna Jobs</h2>
                <p className="text-sm text-slate-500">Jobs stored in the database and available after refresh.</p>
              </div>
              <button onClick={handleFetchSavedJobs} disabled={savedLoading} className="btn-primary px-3 flex items-center gap-2">
                {savedLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Refresh
              </button>
            </div>

            {savedJobs.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedJobs.map((job, index) => (
                  <div key={`${job.url ?? job.title ?? 'saved'}-${index}`} className="card p-4 hover:shadow-md transition-all">
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">{job.title || 'Untitled'}</h3>
                    <p className="text-xs text-slate-500 mb-2">{job.company || 'Unknown Company'}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={10} />{job.location || 'Unknown'}</span>
                      {job.source && <span className="uppercase text-[10px] tracking-wide text-slate-500">{job.source}</span>}
                    </div>
                    {job.description && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-3">{job.description}</p>
                    )}
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noreferrer"
                        className="mt-3 text-xs text-primary-600 flex items-center gap-1 hover:text-primary-700">
                        Apply <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Search size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No saved jobs yet. Use Live Job Search to fetch and store jobs first.</p>
              </div>
            )}
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div>
            {matches.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No matches yet. Analyze your resume to discover opportunities.</p>
                <p className="text-xs mt-2 text-slate-300">AI will extract your skills and find perfect job matches</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  ✓ Found {matches.length} matching job{matches.length === 1 ? '' : 's'} 
                  {matches[0]?.source && ` from ${matches[0].source}`}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((m: JobMatch) => (
                    <div key={m.matchId} className="card p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 text-sm truncate">{m.jobTitle}</h3>
                          <p className="text-xs text-slate-500 truncate">{m.company}</p>
                          <span className="text-xs text-slate-400 capitalize bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">{m.source?.toLowerCase() || 'adzuna'}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`text-lg font-bold ${m.matchScore >= 75 ? 'text-green-600' : m.matchScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                            {m.matchScore}
                          </div>
                          <button onClick={() => bookmark.mutate({ matchId: m.matchId, bookmarked: !m.isBookmarked })}
                            disabled={bookmark.isPending}
                            className={`p-1 rounded transition-colors ${m.isBookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}>
                            {m.isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="h-1.5 bg-slate-100 rounded-full mb-3">
                        <div className={`h-full rounded-full ${m.matchScore >= 75 ? 'bg-green-500' : m.matchScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${m.matchScore}%` }} />
                      </div>

                      <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <MapPin size={12} /> {m.location || 'Remote'}
                      </div>

                      {m.missingSkills && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-slate-500 mb-1">Missing skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {m.missingSkills.split(',').slice(0, 3).map((s: string, idx: number) => (
                              <span key={idx} className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">{s.trim()}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mb-2">{new Date(m.matchedAt).toLocaleDateString()}</p>
                      {m.jobUrl && (
                        <a href={m.jobUrl} target="_blank" rel="noreferrer"
                          className="inline-flex text-xs text-primary-600 items-center gap-1 hover:text-primary-700 font-medium">
                          View & Apply <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
