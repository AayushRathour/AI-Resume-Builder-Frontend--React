import { calculatePreviewScale, getPreviewContainerStyles, RESUME_DIMENSIONS } from '../previewDimensions'

describe('previewDimensions', () => {
  test('calculatePreviewScale uses min axis', () => {
    const scale = calculatePreviewScale(RESUME_DIMENSIONS.WIDTH_PX / 2, RESUME_DIMENSIONS.HEIGHT_PX)
    expect(scale).toBeCloseTo(0.5, 5)
  })

  test('getPreviewContainerStyles returns aspect ratio', () => {
    const styles = getPreviewContainerStyles(300)
    expect(styles.width).toBe(300)
    expect(styles.height).toBeCloseTo(300 / RESUME_DIMENSIONS.ASPECT_RATIO, 5)
    expect(styles.aspectRatio).toBe(String(RESUME_DIMENSIONS.ASPECT_RATIO))
  })
})
