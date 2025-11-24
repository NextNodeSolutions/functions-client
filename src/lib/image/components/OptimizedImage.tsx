/**
 * Optimized Image React component
 * High-level component combining all optimization features
 */

import type React from 'react'

import type { OptimizedImage as OptimizedImageType } from '../types.js'
import { COMMON_SIZES } from '../utils/index.js'
import { useLazyImage } from './useLazyImage.js'
import { useOptimizedImage } from './useOptimizedImage.js'

/**
 * OptimizedImage component props
 */
export interface OptimizedImageProps {
	/** Optimized image or array of responsive images */
	image: OptimizedImageType | OptimizedImageType[]

	/** Alt text (required for accessibility) */
	alt: string

	/** Responsive sizes (use COMMON_SIZES presets) */
	sizes?: string

	/** Loading strategy */
	loading?: 'lazy' | 'eager'

	/** Fetch priority */
	fetchPriority?: 'high' | 'low' | 'auto'

	/** LQIP placeholder for blur effect */
	lqip?: string

	/** CSS class name */
	className?: string

	/** Inline styles */
	style?: React.CSSProperties

	/** Click handler */
	onClick?: () => void

	/** Key handler for accessibility */
	onKeyDown?: React.KeyboardEventHandler<HTMLImageElement>

	/** Additional img attributes */
	imgProps?: React.ImgHTMLAttributes<HTMLImageElement>
}

/**
 * Optimized Image component with responsive srcset and lazy loading
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   image={optimizedImages}
 *   alt="Product photo"
 *   sizes={COMMON_SIZES.twoColumns}
 *   loading="lazy"
 *   lqip="/product-lqip.jpg"
 * />
 * ```
 */
export function OptimizedImage({
	image,
	alt,
	sizes = COMMON_SIZES.fullWidth,
	loading = 'lazy',
	fetchPriority,
	lqip,
	className,
	style,
	onClick,
	onKeyDown,
	imgProps,
}: OptimizedImageProps): React.ReactElement {
	// Use optimized image hook for srcset generation
	const optimized = useOptimizedImage(image, {
		sizes,
		loading,
		fetchPriority,
		lqip,
	})

	// Use lazy loading if enabled and placeholder provided
	const lazy = useLazyImage(optimized.src, {
		placeholder: lqip,
		rootMargin: '50px',
	})

	// Combine styles
	const combinedStyle: React.CSSProperties = {
		...style,
		...(loading === 'lazy' && lqip ? lazy.style : {}),
	}

	return (
		<img
			ref={loading === 'lazy' && lqip ? lazy.ref : undefined}
			src={loading === 'lazy' && lqip ? lazy.src : optimized.src}
			srcSet={optimized.srcSet}
			sizes={optimized.sizes}
			alt={alt}
			width={optimized.width}
			height={optimized.height}
			loading={loading}
			// @ts-expect-error - fetchpriority is valid but not in types yet
			fetchpriority={fetchPriority}
			className={className}
			style={combinedStyle}
			onClick={onClick}
			onKeyDown={onKeyDown}
			{...imgProps}
		/>
	)
}

/**
 * Picture component for art direction
 * Different images/crops for different screen sizes
 *
 * @example
 * ```tsx
 * <OptimizedPicture
 *   sources={[
 *     { media: '(max-width: 640px)', images: mobileImages },
 *     { media: '(max-width: 1024px)', images: tabletImages }
 *   ]}
 *   fallback={desktopImage}
 *   alt="Responsive hero image"
 * />
 * ```
 */
export interface OptimizedPictureProps {
	/** Responsive image variants */
	sources: Array<{
		media: string
		images: OptimizedImageType[]
	}>

	/** Fallback image */
	fallback: OptimizedImageType

	/** Alt text (required for accessibility) */
	alt: string

	/** CSS class name */
	className?: string

	/** Inline styles */
	style?: React.CSSProperties
}

export function OptimizedPicture({
	sources,
	fallback,
	alt,
	className,
	style,
}: OptimizedPictureProps): React.ReactElement {
	return (
		<picture className={className} style={style}>
			{sources.map(source => (
				<source
					key={source.media}
					media={source.media}
					srcSet={source.images
						.map(img => `${img.src} ${img.width}w`)
						.join(', ')}
					type={
						source.images[0]
							? `image/${source.images[0].format}`
							: undefined
					}
				/>
			))}
			<img
				src={fallback.src}
				alt={alt}
				width={fallback.width}
				height={fallback.height}
			/>
		</picture>
	)
}

/**
 * Background Image component for hero sections
 * Uses CSS background-image with lazy loading
 *
 * @example
 * ```tsx
 * <OptimizedBackgroundImage
 *   image={heroImage}
 *   lqip="/hero-lqip.jpg"
 *   className="hero-section"
 * >
 *   <h1>Hero Content</h1>
 * </OptimizedBackgroundImage>
 * ```
 */
export interface OptimizedBackgroundImageProps {
	/** Optimized image */
	image: OptimizedImageType

	/** LQIP placeholder */
	lqip?: string

	/** Children content */
	children: React.ReactNode

	/** CSS class name */
	className?: string

	/** Inline styles */
	style?: React.CSSProperties
}

export function OptimizedBackgroundImage({
	image,
	lqip,
	children,
	className,
	style,
}: OptimizedBackgroundImageProps): React.ReactElement {
	const lazy = useLazyImage(image.src, {
		placeholder: lqip,
		rootMargin: '100px',
	})

	const combinedStyle: React.CSSProperties = {
		backgroundImage: `url(${lazy.src})`,
		backgroundSize: 'cover',
		backgroundPosition: 'center',
		...style,
		...(lqip ? lazy.style : {}),
	}

	return (
		<div
			ref={lqip ? lazy.ref : undefined}
			className={className}
			style={combinedStyle}
		>
			{children}
		</div>
	)
}

// Export all components
export default OptimizedImage
