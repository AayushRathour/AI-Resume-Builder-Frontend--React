import { useState } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { UploadCloud, CheckCircle, AlertCircle, FileText, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import { EP_AI } from '../config/endpoints'
import toast from 'react-hot-toast'
import AtsScoreBar from '../components/AtsScoreBar'

export default function AtsCheckerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

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
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const text = response.data.result || response.data
      
      // Try to parse structured response from AI text
      const scoreMatch = text.match(/score.*?(\d+)/i) || text.match(/(\d+)\/100/) || text.match(/(\d+)/)
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0
      
      setResult({
        score: Math.min(100, Math.max(0, score)),
        rawResponse: text
      })
      
      toast.success('Resume analyzed successfully!')
    } catch (error: any) {
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
                
                <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                  <h3 className="font-semibold text-primary-800 flex items-center gap-2 mb-2">
                    <AlertCircle size={16} /> AI Suggestions
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
