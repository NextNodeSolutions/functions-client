/**
 * Base adapter interface for image optimization
 * Allows different platforms (Astro, Next.js, CDN) to implement their own optimization logic
 */

import type { Logger } from '@nextnode/logger'
import { createLogger } from '@nextnode/logger'

import { ImageProcessingError, ImageValidationError } from '../errors.js'
import type {
	BatchOptimizationResult,
	ImageOptimizationOptions,
	ImageSource,
	LQIPConfig,
	OptimizedImage,
} from '../types.js'
import { SECURITY_LIMITS } from '../types.js'

/**
 * Base image adapter interface
 * All platform-specific adapters must implement this interface
 */
export interface ImageAdapter {
	/**
	 * Optimize a single image
	 */
	optimize(
		source: ImageSource,
		options?: ImageOptimizationOptions,
	): Promise<OptimizedImage>

	/**
	 * Optimize multiple images in batch
	 * Returns both successful and failed results
	 */
	optimizeBatch<T extends ImageSource>(
		sources: T[],
		options?: ImageOptimizationOptions,
	): Promise<BatchOptimizationResult<T>>

	/**
	 * Generate LQIP (Low Quality Image Placeholder)
	 */
	generateLQIP(
		source: ImageSource,
		config?: Partial<LQIPConfig>,
	): Promise<string>

	/**
	 * Check if adapter supports a specific format
	 */
	supportsFormat(format: string): boolean

	/**
	 * Get adapter name for debugging
	 */
	getName(): string
}

/**
 * Abstract base adapter with common functionality
 */
export abstract class BaseImageAdapter implements ImageAdapter {
	protected readonly logger: Logger

	constructor(protected readonly adapterName: string) {
		this.logger = createLogger({
			prefix: `image:${adapterName}`,
		})
	}

	abstract optimize(
		source: ImageSource,
		options?: ImageOptimizationOptions,
	): Promise<OptimizedImage>

	abstract generateLQIP(
		source: ImageSource,
		config?: Partial<LQIPConfig>,
	): Promise<string>

	abstract supportsFormat(format: string): boolean

	/**
	 * Default batch optimization implementation
	 * Uses Promise.allSettled for parallel processing with error handling
	 */
	async optimizeBatch<T extends ImageSource>(
		sources: T[],
		options?: ImageOptimizationOptions,
	): Promise<BatchOptimizationResult<T>> {
		const results = await Promise.allSettled(
			sources.map(source => this.optimize(source, options)),
		)

		const successful: Array<{ input: T; output: OptimizedImage }> = []
		const failed: Array<{ input: T; error: string }> = []

		results.forEach((result, index) => {
			const input = sources[index]
			if (!input) return

			if (result.status === 'fulfilled') {
				successful.push({ input, output: result.value })
			} else {
				failed.push({
					input,
					error: result.reason?.message || 'Unknown error',
				})
			}
		})

		return { successful, failed }
	}

	getName(): string {
		return this.adapterName
	}

	/**
	 * Helper to extract source string from ImageSource
	 */
	protected getSourceString(source: ImageSource): string {
		if (typeof source === 'string') {
			return source
		}

		if (Buffer.isBuffer(source)) {
			throw new ImageProcessingError(
				'Buffer sources must be handled by adapter implementation',
				{ sourceType: 'buffer' },
			)
		}

		return source.src
	}

	/**
	 * Helper to log adapter operations
	 */
	protected log(message: string, data?: Record<string, unknown>): void {
		this.logger.info(message, data)
	}

	/**
	 * Helper to handle errors consistently
	 */
	protected handleError(operation: string, error: unknown): Error {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return new Error(
			`[${this.adapterName}] ${operation} failed: ${message}`,
		)
	}

	/**
	 * Validate image dimensions against security limits
	 * Prevents DoS attacks through oversized image requests
	 */
	protected validateDimensions(width?: number, height?: number): void {
		if (width !== undefined && width > SECURITY_LIMITS.MAX_WIDTH) {
			throw new ImageValidationError(
				`Image width ${width}px exceeds maximum allowed: ${SECURITY_LIMITS.MAX_WIDTH}px`,
				{
					width,
					maxWidth: SECURITY_LIMITS.MAX_WIDTH,
					reason: 'width_exceeded',
				},
			)
		}

		if (height !== undefined && height > SECURITY_LIMITS.MAX_HEIGHT) {
			throw new ImageValidationError(
				`Image height ${height}px exceeds maximum allowed: ${SECURITY_LIMITS.MAX_HEIGHT}px`,
				{
					height,
					maxHeight: SECURITY_LIMITS.MAX_HEIGHT,
					reason: 'height_exceeded',
				},
			)
		}

		if (
			width !== undefined &&
			height !== undefined &&
			width * height > SECURITY_LIMITS.MAX_PIXELS
		) {
			throw new ImageValidationError(
				`Image dimensions ${width}x${height} (${width * height} pixels) exceed maximum allowed: ${SECURITY_LIMITS.MAX_PIXELS} pixels`,
				{
					width,
					height,
					pixels: width * height,
					maxPixels: SECURITY_LIMITS.MAX_PIXELS,
					reason: 'pixels_exceeded',
				},
			)
		}
	}
}
