import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { exportApi } from '../api/exportApi'
import type { ExportJob } from '../types'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { Download, Trash2, Clock, CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react'

const statusIcon = {
  COMPLETED: <CheckCircle2 size={14} className="text-green-500" />,
  FAILED: <XCircle size={14} className="text-red-500" />,
  PROCESSING: <Loader2 size={14} className="animate-spin text-amber-500" />,
  QUEUED: <Clock size={14} className="text-slate-400" />,
}

export default function ExportHistoryPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: exports = [], isLoading } = useQuery({
    queryKey: ['exports', user?.userId],
    queryFn: () => exportApi.getByUser(user!.userId),
    enabled: !!user,
    refetchInterval: 10_000,
  })

  const deleteExport = useMutation({
    mutationFn: (jobId: string) => exportApi.delete(jobId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exports'] }); toast.success('Export deleted') },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText size={22} className="text-primary-500" /> Export History
          </h1>
          <p className="text-slate-500 text-sm mt-1">{exports.length} exports · refreshes automatically</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />)}</div>
        ) : exports.length === 0 ? (
          <div className="card p-16 text-center text-slate-400">
            <Download size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No exports yet</p>
            <p className="text-sm mt-1">Export your resumes from the builder to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exports.map((job: ExportJob) => (
              <div key={job.jobId} className="card p-4 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs
                      ${job.format === 'PDF' ? 'bg-red-100 text-red-600' : job.format === 'DOCX' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      {job.format}
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 text-sm">Resume #{job.resumeId}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {statusIcon[job.status]}
                        <span className="text-xs text-slate-400 capitalize">{job.status.toLowerCase()}</span>
                        {job.fileSizeKb && <span className="text-xs text-slate-400">· {job.fileSizeKb} KB</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs text-slate-400">
                      <p>{new Date(job.requestedAt).toLocaleDateString()}</p>
                      {job.expiresAt && <p className="text-amber-500">Expires {new Date(job.expiresAt).toLocaleDateString()}</p>}
                    </div>

                    {job.status === 'COMPLETED' && job.fileUrl && (
                      <a href={job.fileUrl} target="_blank" rel="noreferrer"
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Download size={12} /> Download
                      </a>
                    )}

                    <button onClick={() => { if(confirm('Delete this export?')) deleteExport.mutate(job.jobId) }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
