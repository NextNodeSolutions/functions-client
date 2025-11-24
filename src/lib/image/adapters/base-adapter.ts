/**
 * Base adapter interface for image optimization
 * Allows different platforms (Astro, Next.js, CDN) to implement their own optimization logic
 */

import type {
	BatchOptimizationResult,
	ImageOptimizationOptions,
	ImageSource,
	LQIPConfig,
	OptimizedImage,
} from '../types.js'

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
	constructor(protected readonly adapterName: string) {}

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
			throw new Error(
				'Buffer sources must be handled by adapter implementation',
			)
		}

		return source.src
	}

	/**
	 * Helper to log adapter operations
	 */
	protected log(message: string, data?: Record<string, unknown>): void {
		// Basic logging - can be extended with proper logger
		console.log(`[${this.adapterName}] ${message}`, data || '')
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
}
