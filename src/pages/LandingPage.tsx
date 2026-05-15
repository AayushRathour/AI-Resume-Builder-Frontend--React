import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileText, Zap, Target, Download, Users, Star, ArrowRight, CheckCircle2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const features = [
  { icon: Zap, title: 'AI-Powered Writing', desc: 'Generate professional summaries, bullet points, and cover letters instantly with GPT-4o and Claude AI.', color: 'bg-purple-100 text-purple-600' },
  { icon: Target, title: 'ATS Score Checker', desc: 'Compare your resume against job descriptions and get a compatibility score (0-100) with missing keyword suggestions.', color: 'bg-blue-100 text-blue-600' },
  { icon: Download, title: 'Export Anywhere', desc: 'Download your resume as PDF, DOCX, or JSON. Premium users get unlimited exports with custom styling.', color: 'bg-green-100 text-green-600' },
  { icon: Users, title: 'Job Matching', desc: 'Connect with live jobs from LinkedIn and Naukri. Get personalized match scores and tailoring recommendations.', color: 'bg-amber-100 text-amber-600' },
]

const plans = [
  { name: 'Free', price: '₹0', features: ['3 resumes', '5 AI calls/month', '5 ATS checks/month', 'PDF export', 'Free templates', 'Public gallery'], cta: 'Get Started Free', href: '/register', highlight: false },
  { name: 'Premium', price: '₹599/mo', features: ['Unlimited resumes', 'Unlimited AI calls', 'Cover letter AI', 'Tailor resume to jobs', 'DOCX + JSON export', 'Premium templates', 'Job matching (LinkedIn + Naukri)', 'AI request history', 'Language translation'], cta: 'Start Premium', href: '/pricing', highlight: true },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const startBuildingHref = isAuthenticated ? '/dashboard' : '/login'

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('token')) {
      navigate(`/oauth/callback${location.search}`, { replace: true })
      return
    }
    // Do NOT auto-redirect to /dashboard — let users see the landing page
  }, [location.search, navigate])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 text-white py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
            <Star size={14} className="text-amber-400" /> Powered by GPT-4o & Claude AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
            Build Smarter Resumes.<br />
            <span className="text-primary-300">Land More Interviews.</span>
          </h1>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto mb-10">
            AI-powered resume builder with ATS scoring, job matching, and instant export. Create a standout resume in minutes, not hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={startBuildingHref} className="bg-white text-primary-700 font-bold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all flex items-center gap-2">
              Start Building Free <ArrowRight size={18} />
            </Link>
            <Link to="/gallery" className="border border-white/30 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all">
              View Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-4">Everything you need to get hired</h2>
        <p className="text-slate-500 text-center mb-12">Professional tools powered by the latest AI models</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-6 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
              <p className="text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-12">How ResumeAI works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose a Template', desc: 'Pick from professionally designed templates — free or premium. Filter by category.' },
              { step: '2', title: 'Fill with AI Assistance', desc: 'Let AI generate your summary, bullet points, and skills. Edit to match your voice.' },
              { step: '3', title: 'Export & Apply', desc: 'Check your ATS score, tailor for specific jobs, and download in PDF, DOCX, or JSON.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{step}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Simple, transparent pricing</h2>
        <div className="grid sm:grid-cols-2 gap-8">
          {plans.map(plan => (
            <div key={plan.name} className={`card p-8 relative ${plan.highlight ? 'border-primary-500 border-2 shadow-lg shadow-primary-100' : ''}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-800 mb-1">{plan.name}</h3>
              <div className="text-3xl font-bold text-primary-600 mb-6">{plan.price}</div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <Link to={plan.href}
                className={plan.highlight ? 'btn-primary w-full text-center block' : 'btn-secondary w-full text-center block'}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center">
            <FileText size={12} className="text-white" />
          </div>
          <span className="text-white font-bold">ResumeAI</span>
        </div>
        <p>© 2026 ResumeAI. Build Smarter. Apply Faster. Land the Job.</p>
      </footer>
    </div>
  )
}
