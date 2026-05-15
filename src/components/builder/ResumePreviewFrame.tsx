import { useEffect, useRef, useState } from 'react'
import { RESUME_DIMENSIONS, calculatePreviewScale } from '../../constants/previewDimensions'

interface ResumePreviewFrameProps {
  /**
   * The HTML to render inside the preview (should be the compiled resume HTML)
   */
  html: string
  /**
   * Additional CSS to apply to the preview
   */
  css?: string
  /**
   * Width of the container element in pixels
   */
  containerWidth: number
  /**
   * Height of the container element in pixels
   */
  containerHeight: number
  /**
   * Optional title for the iframe
   */
  title?: string
  /**
   * Optional className for the wrapper div
   */
  wrapperClassName?: string
  /**
   * Optional className for the preview div
   */
  previewClassName?: string
  /**
   * If true, enables ResizeObserver to dynamically adjust scale on container resize
   */
  responsive?: boolean
}

/**
 * Universal Resume Preview Frame Component
 *
 * This component ensures consistent rendering of resume previews across all pages:
 * - Dashboard resume cards
 * - Template gallery previews
 * - Live preview in builder
 * - Preview modals
 *
 * Key features:
 * - Maintains A4 aspect ratio (210:297)
 * - Automatic scale calculation based on container size
 * - Prevents overflow and distortion
 * - Consistent rendering across all templates
 * - Responsive to container resizing
 */
export default function ResumePreviewFrame({
  html,
  css = '',
  containerWidth,
  containerHeight,
  title = 'Resume Preview',
  wrapperClassName = '',
  previewClassName = '',
  responsive = false,
}: ResumePreviewFrameProps) {
  const [scale, setScale] = useState(calculatePreviewScale(containerWidth, containerHeight))
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Recalculate scale when container dimensions change
  useEffect(() => {
    setScale(calculatePreviewScale(containerWidth, containerHeight))
  }, [containerWidth, containerHeight])

  // Optional: Use ResizeObserver for responsive updates
  useEffect(() => {
    if (!responsive || !wrapperRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setScale(calculatePreviewScale(width, height))
      }
    })

    resizeObserver.observe(wrapperRef.current)
    return () => resizeObserver.disconnect()
  }, [responsive])

  // Compile the full HTML document with proper scaling
  const compiledHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: #fff;
          }

          /* Container for scaling */
          #preview-container {
            width: ${RESUME_DIMENSIONS.WIDTH_PX}px;
            min-height: ${RESUME_DIMENSIONS.HEIGHT_PX}px;
            margin: 0;
            padding: 0;
            transform-origin: top left;
            transform: scale(${scale});
          }

          /* User-provided CSS */
          ${css}
        </style>
      </head>
      <body>
        <div id="preview-container">
          ${html}
        </div>
      </body>
    </html>
  `

  // Calculate the actual display dimensions based on scale
  const displayWidth = RESUME_DIMENSIONS.WIDTH_PX * scale
  const displayHeight = RESUME_DIMENSIONS.HEIGHT_PX * scale

  return (
    <div
      ref={wrapperRef}
      className={`resume-preview-wrapper ${wrapperClassName}`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '4px',
      }}
    >
      <div
        className={`resume-preview-inner ${previewClassName}`}
        style={{
          width: displayWidth,
          height: displayHeight,
          overflow: 'hidden',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '4px',
        }}
      >
        <iframe
          title={title}
          className="resume-preview-iframe"
          style={{
            width: displayWidth,
            height: displayHeight,
            border: 'none',
            display: 'block',
            backgroundColor: '#fff',
          }}
          srcDoc={compiledHtml}
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  )
}
