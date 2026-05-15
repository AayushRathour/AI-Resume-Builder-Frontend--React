import { useEffect, useMemo, useRef, useState } from 'react'
import useResumeStore from '../../store/useResumeStore'
import { renderTemplate } from '../../utils/templateEngine'
import { DEFAULT_TEMPLATE_HTML, DEFAULT_EMPTY_TEMPLATE_HTML } from '../../templates/defaultTemplate'
import ResumePreviewFrame from './ResumePreviewFrame'
import { RESUME_DIMENSIONS } from '../../constants/previewDimensions'
import { Target } from 'lucide-react'

/**
 * Live preview renderer for resume builder.
 * Re-renders template output whenever structured builder state changes.
 */
interface LivePreviewProps {
  templateHtml?: string
  templateCss?: string
  templateName?: string
  useEmptyTemplate?: boolean
}

export default function LivePreview({ templateHtml, templateCss, templateName, useEmptyTemplate }: LivePreviewProps) {
  const data = useResumeStore((s) => s.data)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 600, height: 848 })

  // Use provided template or fall back to default
  const html = templateHtml || (useEmptyTemplate ? DEFAULT_EMPTY_TEMPLATE_HTML : DEFAULT_TEMPLATE_HTML)
  const css = templateCss || ''

  const renderedHtml = useMemo(() => renderTemplate(html, data), [html, data])

  // Update container size on resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({
          width: rect.width,
          height: rect.height,
        })
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div className="card overflow-hidden sticky top-24" ref={containerRef}>
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Target size={16} className="text-primary-500" /> Live Preview
        </span>
        <span className="text-xs text-slate-400">{templateName || 'Default Template'}</span>
      </div>
      <div className="bg-slate-300 p-4 overflow-y-auto flex justify-center" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <ResumePreviewFrame
          html={renderedHtml}
          css={css}
          containerWidth={RESUME_DIMENSIONS.PREVIEW_SIZES.LIVE_PREVIEW.width}
          containerHeight={RESUME_DIMENSIONS.PREVIEW_SIZES.LIVE_PREVIEW.height}
          title={templateName || 'Live Preview'}
          responsive={true}
        />
      </div>
    </div>
  )
}
