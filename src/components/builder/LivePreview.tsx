import { useMemo } from 'react'
import useResumeStore from '../../store/useResumeStore'
import { renderTemplate } from '../../utils/templateEngine'
import { DEFAULT_TEMPLATE_HTML, DEFAULT_EMPTY_TEMPLATE_HTML } from '../../templates/defaultTemplate'
import { Target } from 'lucide-react'

interface LivePreviewProps {
  templateHtml?: string
  templateCss?: string
  templateName?: string
  useEmptyTemplate?: boolean
}

export default function LivePreview({ templateHtml, templateCss, templateName, useEmptyTemplate }: LivePreviewProps) {
  const data = useResumeStore((s) => s.data)

  // Use provided template or fall back to default
  const html = templateHtml || (useEmptyTemplate ? DEFAULT_EMPTY_TEMPLATE_HTML : DEFAULT_TEMPLATE_HTML)
  const css = templateCss || ''

  const renderedHtml = useMemo(() => renderTemplate(html, data), [html, data])

  const compiledHtml = useMemo(() => `
    <style>
      * { box-sizing: border-box; }
      ${css}
    </style>
    ${renderedHtml}
  `, [renderedHtml, css])

  return (
    <div className="card overflow-hidden sticky top-24">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Target size={16} className="text-primary-500" /> Live Preview
        </span>
        <span className="text-xs text-slate-400">{templateName || 'Default Template'}</span>
      </div>
      <div className="bg-slate-300 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div
          className="bg-white shadow-xl mx-auto overflow-hidden"
          style={{ width: '210mm', minHeight: '297mm', padding: '0' }}
        >
          <div
            className="w-full"
            style={{ minHeight: '297mm' }}
            dangerouslySetInnerHTML={{ __html: compiledHtml }}
          />
        </div>
      </div>
    </div>
  )
}
