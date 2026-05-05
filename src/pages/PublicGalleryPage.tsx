import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { resumeApi } from '../api/resumeApi'
import type { Resume } from '../types'
import MainLayout from '../components/layout/MainLayout'
import AtsScoreBar from '../components/AtsScoreBar'
import { Globe, Eye } from 'lucide-react'

export default function PublicGalleryPage() {
  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['public-resumes'],
    queryFn: resumeApi.getPublic,
  })

  return (
    <MainLayout>
        <div className="text-center mb-10">
          <Globe size={40} className="text-primary-500 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Public Resume Gallery</h1>
          <p className="text-slate-500">Browse resumes shared by the community</p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-200 rounded-xl animate-pulse" />)}
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="mb-4">No public resumes yet.</p>
            <Link to="/register" className="btn-primary">Create & Share Yours</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((r: Resume) => (
              <div key={r.resumeId} className="card hover:shadow-md transition-all p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{r.title}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{r.targetJobTitle || 'General'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Eye size={12} /> {r.viewCount}
                  </div>
                </div>
                <AtsScoreBar score={r.atsScore} />
                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  <span className={`capitalize font-medium ${r.status === 'COMPLETE' ? 'text-green-600' : 'text-amber-500'}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
    </MainLayout>
  )
}
