/**
 * STANDARD RESUME PREVIEW DIMENSIONS
 * Based on A4 paper size (210mm × 297mm)
 * Aspect ratio: 210:297 = 0.7070 (approximately)
 * 
 * All resume previews across the application MUST use these dimensions
 * to ensure consistent rendering and scaling.
 */

// A4 dimensions in pixels (at 96 DPI standard)
// 210mm = 794px, 297mm = 1123px
export const RESUME_DIMENSIONS = {
  // Base dimensions for A4 paper
  WIDTH_MM: 210,
  HEIGHT_MM: 297,
  WIDTH_PX: 794,
  HEIGHT_PX: 1123,
  
  // Aspect ratio
  ASPECT_RATIO: 794 / 1123, // 0.7070
  
  // Container preview sizes for different contexts
  PREVIEW_SIZES: {
    // Dashboard card preview area
    DASHBOARD: {
      width: 280,
      height: 396, // maintains A4 ratio
    },
    // Template gallery preview area
    GALLERY: {
      width: 250,
      height: 354, // maintains A4 ratio
    },
    // Live preview in builder
    LIVE_PREVIEW: {
      width: 600,
      height: 848, // maintains A4 ratio
    },
    // Full modal preview
    MODAL: {
      width: 700,
      height: 990, // maintains A4 ratio
    },
    // Thumbnail for export
    THUMBNAIL: {
      width: 400,
      height: 565, // maintains A4 ratio
    },
  },
}

/**
 * Calculate scale to fit resume into container while maintaining aspect ratio
 * @param containerWidth - Width of the container in pixels
 * @param containerHeight - Height of the container in pixels
 * @returns Scale factor (0.0 to 1.0+)
 */
export function calculatePreviewScale(containerWidth: number, containerHeight: number): number {
  const scaleX = containerWidth / RESUME_DIMENSIONS.WIDTH_PX
  const scaleY = containerHeight / RESUME_DIMENSIONS.HEIGHT_PX
  return Math.min(scaleX, scaleY)
}

/**
 * Get aspect ratio padded dimensions for container
 * This ensures the preview area always maintains proper proportions
 */
export function getPreviewContainerStyles(containerWidth: number) {
  const height = (containerWidth / RESUME_DIMENSIONS.ASPECT_RATIO)
  return {
    width: containerWidth,
    height: height,
    aspectRatio: `${RESUME_DIMENSIONS.ASPECT_RATIO}`,
  }
}
