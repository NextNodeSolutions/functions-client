/**
 * Astro image optimization adapter
 * Wraps Astro's built-in getImage() API for build-time optimization
 */

import type {
	ImageFormat,
	ImageOptimizationOptions,
	ImageSource,
	LQIPConfig,
	OptimizedImage,
} from '../types.js'
import {
	detectImageFormat,
	getQualityForFormat,
	isVectorFormat,
	mergeLQIPConfig,
} from '../utils/index.js'
import { BaseImageAdapter } from './base-adapter.js'

/**
 * Astro getImage options (subset of Astro's actual types)
 * This avoids hard dependency on astro:assets
 */
interface AstroImageOptions {
	src: string | ImageMetadata
	width?: number
	height?: number
	format?: ImageFormat
	quality?: number
}

interface ImageMetadata {
	src: string
	width: number
	height: number
	format: ImageFormat
	fsPath?: string // Optional property from Astro 5
}

interface AstroImageResult {
	src: string
	attributes: {
		width: number
		height: number
	}
}

/**
 * Type for Astro's getImage function
 */
type AstroGetImageFunction = (
	options: AstroImageOptions,
) => Promise<AstroImageResult>

/**
 * Astro adapter configuration
 */
export interface AstroAdapterConfig {
	/**
	 * Astro's getImage function
	 * Must be provided by the consumer as we can't import astro:assets directly
	 */
	getImage: AstroGetImageFunction

	/**
	 * Default quality profile
	 */
	defaultProfile?: 'lossless' | 'balanced' | 'aggressive'
}

/**
 * Astro image adapter implementation
 * Provides build-time image optimization using Astro's Sharp-based pipeline
 */
export class AstroImageAdapter extends BaseImageAdapter {
	private readonly getImage: AstroGetImageFunction
	private readonly defaultProfile: 'lossless' | 'balanced' | 'aggressive'

	constructor(config: AstroAdapterConfig) {
		super('AstroImageAdapter')
		this.getImage = config.getImage
		this.defaultProfile = config.defaultProfile || 'balanced'
	}

	async optimize(
		source: ImageSource | ImageMetadata,
		options: ImageOptimizationOptions = {},
	): Promise<OptimizedImage> {
		try {
			// Validate dimensions against security limits
			this.validateDimensions(options.width, options.height)

			// Handle ImageMetadata objects directly (return as-is)
			// ImageMetadata objects are already processed by Astro during import
			// and should not be passed through getImage() again
			if (this.isImageMetadata(source)) {
				// Return ImageMetadata as-is - it's already optimized by Astro
				return {
					src: source.src,
					width: source.width,
					height: source.height,
					format: source.format,
				}
			}

			// Handle string sources (URLs, file paths)
			const sourceString = this.getSourceString(source)
			const detectedFormat = detectImageFormat(sourceString)
			const format = options.format || detectedFormat || 'webp'

			// SVG pass-through (no processing needed)
			if (isVectorFormat(format)) {
				return this.handleSVG(sourceString)
			}

			// Get quality
			const profile = options.profile || this.defaultProfile
			const quality = getQualityForFormat(
				format,
				profile,
				options.quality,
			)

			// Build Astro options for string sources
			const astroOptions: AstroImageOptions = {
				src: sourceString,
				format,
				quality,
			}

			// Add dimensions if specified
			if (options.width) {
				astroOptions.width = options.width
			}
			if (options.height) {
				astroOptions.height = options.height
			}

			// Call Astro's getImage only for string sources
			const result = await this.getImage(astroOptions)

			return {
				src: result.src,
				width: result.attributes.width,
				height: result.attributes.height,
				format,
			}
		} catch (error) {
			throw this.handleError('optimize', error)
		}
	}

	async generateLQIP(
		source: ImageSource | ImageMetadata,
		config: Partial<LQIPConfig> = {},
	): Promise<string> {
		try {
			const lqipConfig = mergeLQIPConfig(config)

			if (this.isImageMetadata(source)) {
				// For ImageMetadata, return the src as-is
				// LQIP generation not supported for ImageMetadata in this adapter
				return source.src
			}

			// Generate tiny version using Astro for string sources
			const sourceString = this.getSourceString(source)
			const result = await this.getImage({
				src: sourceString,
				width: lqipConfig.width,
				height: lqipConfig.height,
				format: lqipConfig.format,
				quality: lqipConfig.quality,
			})

			// In Astro, we return the optimized URL
			// The actual base64 encoding would need to be done separately
			// This is a limitation of Astro's build-time optimization
			return result.src
		} catch (error) {
			throw this.handleError('generateLQIP', error)
		}
	}

	supportsFormat(format: string): boolean {
		// Astro supports all major web formats via Sharp
		return ['svg', 'png', 'webp', 'avif', 'jpeg', 'jpg'].includes(
			format.toLowerCase(),
		)
	}

	/**
	 * Type guard to check if source is ImageMetadata
	 */
	private isImageMetadata(
		source: ImageSource | ImageMetadata,
	): source is ImageMetadata {
		return (
			typeof source === 'object' &&
			source !== null &&
			'src' in source &&
			'width' in source &&
			'height' in source &&
			typeof source.width === 'number'
		)
	}

	/**
	 * Handle SVG images (pass-through, no optimization)
	 */
	private async handleSVG(src: string): Promise<OptimizedImage> {
		// SVGs don't need optimization, return as-is
		// Dimensions would need to be extracted from SVG file in production
		return {
			src,
			width: 0, // Unknown without parsing SVG
			height: 0, // Unknown without parsing SVG
			format: 'svg',
		}
	}
}

/**
 * Convenience function to optimize images with Astro
 * Matches the API from nextnode-front's image-optimizer.ts
 */
export async function optimizeImages<
	T extends Record<string, ImageSource | ImageMetadata>,
>(
	images: T,
	getImage: AstroGetImageFunction,
): Promise<{ [K in keyof T]: OptimizedImage }> {
	const adapter = new AstroImageAdapter({ getImage })

	const entries = Object.entries(images) as Array<
		[keyof T, ImageSource | ImageMetadata]
	>
	const results = await Promise.allSettled(
		entries.map(async ([key, source]) => ({
			key,
			result: await adapter.optimize(source),
		})),
	)

	const optimized = {} as { [K in keyof T]: OptimizedImage }
	const errors: string[] = []

	for (const result of results) {
		if (result.status === 'fulfilled') {
			optimized[result.value.key] = result.value.result
		} else {
			errors.push(result.reason?.message || 'Unknown error')
		}
	}

	if (errors.length > 0) {
		throw new Error(`Failed to optimize images: ${errors.join(', ')}`)
	}

	return optimized
}
