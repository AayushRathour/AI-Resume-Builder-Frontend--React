import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "../../api/adminApi"
import AdminLayout from "../../components/AdminLayout"
import AdminPagination from "../../components/admin/AdminPagination"
import toast from "react-hot-toast"
import type { ResumeTemplate } from "../../types"
import { Plus, Edit3, Eye, AlertCircle, CheckCircle2, ShieldCheck, Wand, Loader2 } from "lucide-react"
import { validateTemplate } from "../../utils/validation"
import { normalizeTemplate } from "../../utils/templateNormalizer"
import { renderTemplate } from "../../utils/templateEngine"

type TemplateCategory = ResumeTemplate["category"]

const CATS: TemplateCategory[] = ["PROFESSIONAL", "CREATIVE", "MODERN", "MINIMALIST", "ATS_OPTIMISED"]
const ITEMS_PER_PAGE = 10

export default function AdminTemplates() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ResumeTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [form, setForm] = useState<{ name: string; description: string; category: TemplateCategory; isPremium: boolean; htmlLayout: string; cssStyles: string }>({
    name: "",
    description: "",
    category: "PROFESSIONAL",
    isPremium: false,
    htmlLayout: "",
    cssStyles: "",
  })

  const { data: templates = [], isLoading } = useQuery({ queryKey: ["templates-all"], queryFn: adminApi.getTemplates })

  const totalPages = Math.ceil(templates.length / ITEMS_PER_PAGE)
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return templates.slice(start, start + ITEMS_PER_PAGE)
  }, [templates, currentPage])

  // ── Template validation ──────────────────────────────────────────────

  const templateValidation = useMemo(() => {
    if (!form.htmlLayout.trim()) return null
    return validateTemplate(form.htmlLayout)
  }, [form.htmlLayout])

  const stripScripts = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '')

  const canSave = form.name.trim() && templateValidation?.valid !== false

  // ── Mutations ────────────────────────────────────────────────────────

  const create = useMutation({
    mutationFn: () => {
      if (templateValidation && !templateValidation.valid) {
        throw new Error("Template has validation errors")
      }
      const cleaned = { ...form, htmlLayout: stripScripts(form.htmlLayout) }
      return adminApi.createTemplate(cleaned)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates-all"] }); toast.success("Template created"); setShowForm(false); setForm({ name: "", description: "", category: "PROFESSIONAL", isPremium: false, htmlLayout: "", cssStyles: "" }) },
    onError: (e: any) => toast.error(e.message || "Failed to create template"),
  })

  const update = useMutation({
    mutationFn: () => {
      if (templateValidation && !templateValidation.valid) {
        throw new Error("Template has validation errors")
      }
      const cleaned = { ...form, htmlLayout: stripScripts(form.htmlLayout) }
      return adminApi.updateTemplate(editing!.templateId, cleaned)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates-all"] }); toast.success("Template updated"); setEditing(null); setShowForm(false) },
    onError: (e: any) => toast.error(e.message || "Failed to update template"),
  })

  const remove = useMutation({
    mutationFn: (templateId: number) => adminApi.deleteTemplate(templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates-all"] })
      toast.success("Template deleted")
      setEditing(null)
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete template"),
  })

  const handleEdit = (t: ResumeTemplate) => {
    setEditing(t)
    setForm({ name: t.name, description: t.description || "", category: t.category, isPremium: t.isPremium, htmlLayout: t.htmlLayout || (t as any).htmlContent || "", cssStyles: t.cssStyles || (t as any).cssContent || "" })
    setShowForm(true)
    setShowPreview(false)
  }

  const previewHtml = useMemo(() => {
    if (!form.htmlLayout.trim()) return ""
    return renderTemplate(form.htmlLayout, {
      personal: {
        name: "Aayush Rathour",
        email: "aayushrathour34@gmail.com",
        phone: "7853892342",
        location: "Bhopal, MP",
        linkedin: "https://linkedin.com/in/aayush",
        github: "https://github.com/aayush",
        website: "https://aayush.dev",
        title: "Software Engineer",
      },
      summary: "Results-driven software engineer with experience building scalable web applications.",
      skills: ["Java", "React", "Spring Boot", "Node.js"],
      experience: [
        {
          id: "sample-exp-1",
          company: "TechKalaA",
          position: "Full Stack Developer",
          startDate: "Jan 2023",
          endDate: "Present",
          current: true,
          description: "Built resume workflow features and template tooling.",
        },
      ],
      education: [
        {
          id: "sample-edu-1",
          institution: "TIT Technocrats",
          degree: "B.Tech",
          field: "Computer Science",
          startDate: "2019",
          endDate: "2023",
          description: "Focused on full stack development.",
        },
      ],
      projects: [
        {
          id: "sample-proj-1",
          name: "ResumeAI",
          description: "AI-assisted resume builder with live template rendering.",
          technologies: "React, Spring Boot",
          link: "https://example.com",
        },
      ],
    } as any)
  }, [form.htmlLayout])

  const [isNormalizing, setIsNormalizing] = useState(false)
  
  const handleNormalizeAll = async () => {
    if (!window.confirm("This will process all templates and replace hardcoded names with placeholders. Proceed?")) return
    setIsNormalizing(true)
    let updated = 0
    try {
      for (const t of templates) {
        if (!t.htmlLayout) continue
        const withoutScripts = stripScripts(t.htmlLayout)
        const normalized = normalizeTemplate(withoutScripts)
        if (normalized !== t.htmlLayout) {
          await adminApi.updateTemplate(t.templateId, { ...t, htmlLayout: normalized })
          updated++
        }
      }
      if (updated > 0) {
        toast.success(`Successfully normalized ${updated} templates`)
        qc.invalidateQueries({ queryKey: ["templates-all"] })
      } else {
        toast.success("All templates are already normalized!")
      }
    } catch (e: any) {
      toast.error("Error during normalization: " + e.message)
    } finally {
      setIsNormalizing(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <AdminLayout title={`Templates (${templates.length})`}>
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={handleNormalizeAll} disabled={isNormalizing || isLoading} className="btn-secondary flex items-center gap-2 text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
          {isNormalizing ? <Loader2 size={14} className="animate-spin text-slate-400" /> : <Wand size={14} className="text-violet-500" />}
          Normalize DB Templates
        </button>
        <button onClick={() => { setEditing(null); setForm({ name: "", description: "", category: "PROFESSIONAL", isPremium: false, htmlLayout: "", cssStyles: "" }); setShowForm(!showForm); setShowPreview(false) }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> New Template
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 mb-5 animate-slide-up">
          <h3 className="font-semibold text-slate-700 mb-4">{editing ? "Edit Template" : "Create Template"}</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-field text-sm" placeholder="Template name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as TemplateCategory}))} className="input-field text-sm">
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="input-field text-sm" placeholder="Brief description" />
          </div>

          {/* HTML Layout */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              HTML Template <span className="text-slate-400">(Use placeholders: {"{{name}}, {{email}}, {{skills}}, {{experience}}, {{education}}, {{projects}}, {{summary}}, etc."})</span>
            </label>
            <textarea
              value={form.htmlLayout}
              onChange={e => setForm(f => ({...f, htmlLayout: e.target.value}))}
              className={`input-field text-xs font-mono w-full ${
                templateValidation && !templateValidation.valid
                  ? 'border-red-300 focus:border-red-400'
                  : templateValidation?.valid
                    ? 'border-green-300 focus:border-green-400'
                    : ''
              }`}
              rows={12}
              placeholder={'<div style="font-family:sans-serif;padding:40px;">\n  <h1>{{name}}</h1>\n  <p>{{title}} | {{email}} | {{phone}}</p>\n  <h2>Summary</h2>\n  <p>{{summary}}</p>\n  <h2>Skills</h2>\n  {{skills}}\n  <h2>Experience</h2>\n  {{experience}}\n  <h2>Education</h2>\n  {{education}}\n  <h2>Projects</h2>\n  {{projects}}\n</div>'}
            />
            <p className="text-xs text-slate-400 mt-1">
              💡 Embed CSS directly in the HTML using inline styles or {'<style>'} tags. No hardcoded names — use placeholders only.
            </p>
          </div>

          {/* ── Validation results panel ──────────────────────────────── */}
          {templateValidation && (
            <div className={`mb-4 rounded-lg border p-3 ${templateValidation.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {templateValidation.valid ? (
                  <><ShieldCheck size={16} className="text-green-600" /><span className="text-sm font-semibold text-green-700">Template Valid</span></>
                ) : (
                  <><AlertCircle size={16} className="text-red-600" /><span className="text-sm font-semibold text-red-700">Validation Errors</span></>
                )}
              </div>

              {/* Errors */}
              {templateValidation.errors.length > 0 && (
                <ul className="space-y-0.5 mb-2">
                  {templateValidation.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                      <AlertCircle size={11} className="mt-0.5 shrink-0" /> {e}
                    </li>
                  ))}
                </ul>
              )}

              {/* Warnings */}
              {templateValidation.warnings.length > 0 && (
                <ul className="space-y-0.5 mb-2">
                  {templateValidation.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-600 flex items-start gap-1">
                      <AlertCircle size={11} className="mt-0.5 shrink-0" /> {w}
                    </li>
                  ))}
                </ul>
              )}

              {/* Placeholders found */}
              <div className="flex flex-wrap gap-1 mt-2">
                {['{{name}}','{{title}}','{{email}}','{{phone}}','{{location}}','{{summary}}','{{skills}}','{{experience}}','{{education}}','{{projects}}'].map(ph => (
                  <span key={ph} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    templateValidation.foundPlaceholders.includes(ph)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {templateValidation.foundPlaceholders.includes(ph) ? <CheckCircle2 size={9} className="inline mr-0.5" /> : null}
                    {ph}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview toggle */}
          {form.htmlLayout && (
            <div className="mb-3">
              <button
                onClick={() => setShowPreview(p => !p)}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1.5"
              >
                <Eye size={14} /> {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              {showPreview && (
                <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <iframe
                    title="Template Preview"
                    className="w-full border-none"
                    style={{ minHeight: '300px' }}
                    srcDoc={`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;} ${form.cssStyles || ''}</style></head><body>${previewHtml}</body></html>`}
                  />
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
            <input type="checkbox" checked={form.isPremium} onChange={e => setForm(f => ({...f, isPremium: e.target.checked}))} className="w-4 h-4 accent-amber-500" />
            <span className="text-slate-600">Premium template</span>
          </label>
          <div className="flex gap-2 justify-end">
            {editing && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete template "${editing.name}"?`)) {
                    remove.mutate(editing.templateId)
                  }
                }}
                className="btn-secondary text-sm text-red-600 hover:text-red-700"
                disabled={remove.isPending}
              >
                Delete Template
              </button>
            )}
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            <button
              onClick={() => editing ? update.mutate() : create.mutate()}
              disabled={!canSave || create.isPending || update.isPending}
              className="btn-primary text-sm"
            >
              {create.isPending || update.isPending ? "Saving..." : editing ? "Update Template" : "Create Template"}
            </button>
          </div>
        </div>
      )}

      {/* Results info */}
      <div className="mb-2 text-xs text-slate-500">
        Showing {paginatedTemplates.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, templates.length)} of {templates.length} results
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                {["Name", "Category", "Type", "Placeholders", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : paginatedTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No templates found
                  </td>
                </tr>
              ) : (
                paginatedTemplates.map((t: ResumeTemplate) => {
                  const val = t.htmlLayout ? validateTemplate(t.htmlLayout) : null
                  return (
                    <tr key={t.templateId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{t.name}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{t.category}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.isPremium ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {t.isPremium ? "Premium" : "Free"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {val ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              {val.valid ? (
                                <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                              ) : (
                                <AlertCircle size={13} className="text-red-500 shrink-0" />
                              )}
                              <span className={`text-xs font-semibold ${val.valid ? 'text-green-600' : 'text-red-600'}`}>
                                {val.foundPlaceholders.length}/10
                              </span>
                            </div>
                            {val.hasHardcodedNames && (
                              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Hardcoded</span>
                            )}
                            {val.valid && !val.hasHardcodedNames && (
                              <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">Valid</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold ${t.isActive ? "text-green-600" : "text-slate-400"}`}>
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(t)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors shrink-0">
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Delete template "${t.name}"?`)) {
                                remove.mutate(t.templateId)
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                            disabled={remove.isPending}
                            data-testid={`delete-template-${t.templateId}`}
                          >
                            <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && templates.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={templates.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>
    </AdminLayout>
  )
}
