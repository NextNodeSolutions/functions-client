/**
 * React hook for optimized images with responsive srcset and sizes
 */

import { useMemo } from 'react'

import type { ImageFormat, OptimizedImage } from '../types.js'
import {
	DEFAULT_BREAKPOINTS,
	DEFAULT_DENSITIES,
	generateSizes,
	generateSrcSet,
} from '../utils/index.js'

// Re-export COMMON_SIZES for convenience
export { COMMON_SIZES } from '../utils/index.js'

/**
 * Hook options for optimized images
 */
export interface UseOptimizedImageOptions {
	/** Responsive breakpoints */
	breakpoints?: number[]
	/** Pixel densities */
	densities?: number[]
	/** Sizes attribute pattern (use COMMON_SIZES presets) */
	sizes?: string
	/** Loading strategy */
	loading?: 'lazy' | 'eager'
	/** Fetch priority */
	fetchPriority?: 'high' | 'low' | 'auto'
	/** LQIP data URI */
	lqip?: string
}

/**
 * Result from useOptimizedImage hook
 */
export interface UseOptimizedImageResult {
	/** Primary image source */
	src: string
	/** Responsive srcset (if multiple images provided) */
	srcSet?: string
	/** Sizes attribute */
	sizes?: string
	/** Loading strategy */
	loading: 'lazy' | 'eager'
	/** Fetch priority */
	fetchPriority?: 'high' | 'low' | 'auto'
	/** LQIP placeholder */
	lqip?: string
	/** Image dimensions */
	width: number
	height: number
	/** Image format */
	format: ImageFormat
}

/**
 * Hook for optimized image with responsive srcset
 *
 * @example
 * ```tsx
 * const image = useOptimizedImage({
 *   src: '/image.jpg',
 *   width: 800,
 *   height: 600
 * }, {
 *   sizes: COMMON_SIZES.halfDesktop,
 *   loading: 'lazy'
 * })
 *
 * <img {...image} alt="Description" />
 * ```
 */
export function useOptimizedImage(
	image: OptimizedImage | OptimizedImage[],
	options: UseOptimizedImageOptions = {},
): UseOptimizedImageResult {
	const images = Array.isArray(image) ? image : [image]
	const primaryImage = images[0]

	if (!primaryImage) {
		throw new Error('At least one image is required')
	}

	const {
		breakpoints = DEFAULT_BREAKPOINTS,
		densities = DEFAULT_DENSITIES,
		loading = 'lazy',
		fetchPriority,
		lqip,
	} = options

	// Generate srcset for responsive images
	const srcSet = useMemo(() => {
		if (images.length === 1) {
			// Single image - generate density-based srcset if needed
			if (densities.length > 1) {
				return images
					.map((img, idx) => `${img.src} ${densities[idx]}x`)
					.join(', ')
			}
			return undefined
		}

		// Multiple images - width-based srcset
		return generateSrcSet(images)
	}, [images, densities])

	// Generate sizes attribute
	const sizesAttr = useMemo(() => {
		if (!srcSet) return undefined

		// If custom sizes provided, use it
		if (options.sizes) {
			return options.sizes
		}

		// Generate default sizes based on breakpoints
		const sizeEntries = breakpoints.map((bp, idx) => ({
			breakpoint: bp,
			size: idx === 0 ? '100vw' : `${Math.floor(100 / (idx + 1))}vw`,
		}))

		return generateSizes(sizeEntries)
	}, [srcSet, breakpoints, options.sizes])

	return {
		src: primaryImage.src,
		srcSet,
		sizes: sizesAttr,
		loading,
		...(fetchPriority && { fetchPriority }),
		...(lqip && { lqip }),
		width: primaryImage.width,
		height: primaryImage.height,
		format: primaryImage.format,
	}
}

/**
 * Hook for multiple responsive image variants
 * Useful for art direction with picture element
 *
 * @example
 * ```tsx
 * const variants = useResponsiveImageVariants([
 *   { media: '(max-width: 640px)', images: mobileImages },
 *   { media: '(max-width: 1024px)', images: tabletImages }
 * ])
 *
 * <picture>
 *   {variants.map((variant, i) => (
 *     <source key={i} {...variant} />
 *   ))}
 *   <img src={defaultImage.src} alt="Description" />
 * </picture>
 * ```
 */
export interface ResponsiveImageVariant {
	media: string
	images: OptimizedImage[]
}

export interface PictureSource {
	media: string
	srcSet: string
	type?: string
}

export function useResponsiveImageVariants(
	variants: ResponsiveImageVariant[],
): PictureSource[] {
	return useMemo(
		() =>
			variants.map(({ media, images }) => ({
				media,
				srcSet: generateSrcSet(images),
				type: images[0] ? `image/${images[0].format}` : undefined,
			})),
		[variants],
	)
}
