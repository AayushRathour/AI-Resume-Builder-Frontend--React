import { useState } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { UploadCloud, CheckCircle, AlertCircle, FileText, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import { EP_AI } from '../config/endpoints'
import toast from 'react-hot-toast'
import AtsScoreBar from '../components/AtsScoreBar'
import { useAuth } from '../context/AuthContext'
import { queryClient } from '../lib/queryClient'

/**
 * ATS checker page for upload-based resume scoring.
 * Sends resume files to AI backend and renders score, keywords, and recommendations.
 */
export default function AtsCheckerPage() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  /** Handles file upload and normalizes both structured and fallback ATS responses. */
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)
    try {
      const response = await api.post('/ai/ats-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: user?.userId ? { userId: user.userId } : undefined,
      })
      
      // Backend returns StatusResponse: { status, data, message }
      const payload = response.data ?? {}
      const inner = payload.data ?? payload

      // ATSResponse has { score, recommendations, missingKeywords }
      // Fallback map has { result: "..." }
      if (inner.score !== undefined) {
        // Structured ATSResponse from AI
        setResult({
          score: Math.min(100, Math.max(0, Number(inner.score ?? 0))),
          rawResponse: inner.recommendations ?? inner.result ?? '',
          missingKeywords: inner.missingKeywords ?? []
        })
      } else {
        // Fallback string-based response
        const text = inner.result || JSON.stringify(inner)
        const scoreMatch = text.match(/score.*?(\d+)/i) || text.match(/(\d+)\/100/) || text.match(/(\d+)/)
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0

        setResult({
          score: Math.min(100, Math.max(0, score)),
          rawResponse: text,
          missingKeywords: []
        })
      }
      
      if (user?.userId) {
        queryClient.invalidateQueries({ queryKey: ['quota', user.userId] })
      }

      toast.success('Resume analyzed successfully!')
    } catch (error: any) {
      console.error('[ATS] Upload failed:', error?.response?.data || error.message)
      toast.error(error?.response?.data?.message || 'Failed to analyze resume. Make sure it is a valid PDF, DOCX, or TXT file.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <MainLayout>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">ATS Resume Checker</h1>
        <p className="text-slate-600 mb-8">Upload your existing resume to get an instant ATS compatibility score and suggestions.</p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Upload Resume</h2>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <UploadCloud className="text-primary-500" size={32} />
              </div>
              <h3 className="font-medium text-slate-800 mb-1">
                {file ? file.name : 'Click or drag file to upload'}
              </h3>
              <p className="text-sm text-slate-500">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOCX, or TXT (Max 5MB)'}
              </p>
            </div>

            <button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {isUploading ? 'Analyzing...' : 'Analyze Resume'}
              {!isUploading && <ChevronRight size={18} />}
            </button>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Analysis Result</h2>
            
            {!result ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 border border-slate-100 rounded-xl bg-slate-50">
                <FileText size={48} className="mb-4 text-slate-300" />
                <p>Upload a resume to see your ATS score</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-slate-800">{result.score}</span>
                    <span className="text-slate-500 pb-1">/ 100 ATS Score</span>
                  </div>
                  <AtsScoreBar score={result.score} />
                </div>
                
                {result.missingKeywords && result.missingKeywords.length > 0 && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                      <AlertCircle size={16} /> Missing Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white border border-amber-200 text-amber-700 text-xs rounded-md shadow-sm">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                  <h3 className="font-semibold text-primary-800 flex items-center gap-2 mb-2">
                    <CheckCircle size={16} /> AI Suggestions
                  </h3>
                  <div className="text-sm text-primary-900 whitespace-pre-wrap leading-relaxed">
                    {result.rawResponse}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </MainLayout>
  )
}
