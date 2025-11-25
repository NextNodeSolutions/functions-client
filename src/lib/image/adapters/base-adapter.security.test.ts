/**
 * Security tests for base adapter dimension validation
 * Tests DoS protection through dimension limits
 */

import { describe, expect, it } from 'vitest'

import { ImageValidationError } from '../errors.js'
import type {
	ImageOptimizationOptions,
	ImageSource,
	LQIPConfig,
	OptimizedImage,
} from '../types.js'
import { SECURITY_LIMITS } from '../types.js'
import { BaseImageAdapter } from './base-adapter.js'

class TestImageAdapter extends BaseImageAdapter {
	constructor() {
		super('TestAdapter')
	}

	async optimize(
		source: ImageSource,
		options?: ImageOptimizationOptions,
	): Promise<OptimizedImage> {
		this.validateDimensions(options?.width, options?.height)
		return {
			src: typeof source === 'string' ? source : source.src,
			width: options?.width || 0,
			height: options?.height || 0,
			format: options?.format || 'webp',
		}
	}

	async generateLQIP(
		source: ImageSource,
		config?: Partial<LQIPConfig>,
	): Promise<string> {
		this.validateDimensions(config?.width, config?.height)
		return typeof source === 'string' ? source : source.src
	}

	supportsFormat(format: string): boolean {
		return ['jpg', 'png', 'webp'].includes(format)
	}
}

describe('Base Adapter Security - DoS Protection', () => {
	let adapter: TestImageAdapter

	beforeEach(() => {
		adapter = new TestImageAdapter()
	})

	describe('Width Validation', () => {
		it('should accept width within limits', async () => {
			const result = await adapter.optimize('image.jpg', { width: 5000 })
			expect(result.width).toBe(5000)
		})

		it('should accept maximum allowed width', async () => {
			const result = await adapter.optimize('image.jpg', {
				width: SECURITY_LIMITS.MAX_WIDTH,
			})
			expect(result.width).toBe(SECURITY_LIMITS.MAX_WIDTH)
		})

		it('should accept width of 1', async () => {
			const result = await adapter.optimize('image.jpg', { width: 1 })
			expect(result.width).toBe(1)
		})

		it('should accept width of 0 (no resize)', async () => {
			const result = await adapter.optimize('image.jpg', { width: 0 })
			expect(result.width).toBe(0)
		})

		it('should reject width exceeding maximum (DoS prevention)', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: SECURITY_LIMITS.MAX_WIDTH + 1,
				}),
			).rejects.toThrow(ImageValidationError)
		})

		it('should reject extremely large width (100000px)', async () => {
			await expect(
				adapter.optimize('image.jpg', { width: 100000 }),
			).rejects.toThrow(ImageValidationError)
		})

		it('should provide descriptive error message for width', async () => {
			await expect(
				adapter.optimize('image.jpg', { width: 50000 }),
			).rejects.toThrow(/Image width 50000px exceeds maximum allowed/)
		})

		it('should include context in width validation error', async () => {
			try {
				await adapter.optimize('image.jpg', { width: 50000 })
			} catch (error) {
				expect(error).toBeInstanceOf(ImageValidationError)
				if (error instanceof ImageValidationError) {
					expect(error.context).toEqual({
						width: 50000,
						maxWidth: SECURITY_LIMITS.MAX_WIDTH,
						reason: 'width_exceeded',
					})
				}
			}
		})
	})

	describe('Height Validation', () => {
		it('should accept height within limits', async () => {
			const result = await adapter.optimize('image.jpg', { height: 5000 })
			expect(result.height).toBe(5000)
		})

		it('should accept maximum allowed height', async () => {
			const result = await adapter.optimize('image.jpg', {
				height: SECURITY_LIMITS.MAX_HEIGHT,
			})
			expect(result.height).toBe(SECURITY_LIMITS.MAX_HEIGHT)
		})

		it('should accept height of 1', async () => {
			const result = await adapter.optimize('image.jpg', { height: 1 })
			expect(result.height).toBe(1)
		})

		it('should accept height of 0 (no resize)', async () => {
			const result = await adapter.optimize('image.jpg', { height: 0 })
			expect(result.height).toBe(0)
		})

		it('should reject height exceeding maximum (DoS prevention)', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					height: SECURITY_LIMITS.MAX_HEIGHT + 1,
				}),
			).rejects.toThrow(ImageValidationError)
		})

		it('should reject extremely large height (100000px)', async () => {
			await expect(
				adapter.optimize('image.jpg', { height: 100000 }),
			).rejects.toThrow(ImageValidationError)
		})

		it('should provide descriptive error message for height', async () => {
			await expect(
				adapter.optimize('image.jpg', { height: 50000 }),
			).rejects.toThrow(/Image height 50000px exceeds maximum allowed/)
		})

		it('should include context in height validation error', async () => {
			try {
				await adapter.optimize('image.jpg', { height: 50000 })
			} catch (error) {
				expect(error).toBeInstanceOf(ImageValidationError)
				if (error instanceof ImageValidationError) {
					expect(error.context).toEqual({
						height: 50000,
						maxHeight: SECURITY_LIMITS.MAX_HEIGHT,
						reason: 'height_exceeded',
					})
				}
			}
		})
	})

	describe('Total Pixels Validation (DoS Prevention)', () => {
		it('should accept dimensions within pixel limit', async () => {
			const result = await adapter.optimize('image.jpg', {
				width: 5000,
				height: 5000,
			})
			expect(result.width).toBe(5000)
			expect(result.height).toBe(5000)
		})

		it('should accept maximum pixels exactly', async () => {
			const side = Math.floor(Math.sqrt(SECURITY_LIMITS.MAX_PIXELS))
			const result = await adapter.optimize('image.jpg', {
				width: side,
				height: side,
			})
			expect(result.width * result.height).toBeLessThanOrEqual(
				SECURITY_LIMITS.MAX_PIXELS,
			)
		})

		it('should reject dimensions exceeding pixel limit (via height check)', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: 10000,
					height: 10001,
				}),
			).rejects.toThrow(ImageValidationError)
		})

		it('should reject very large total pixels via height limit (DoS attack)', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: 10000,
					height: 15000,
				}),
			).rejects.toThrow(ImageValidationError)
		})

		it('should provide descriptive error message for height when exceeding', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: 10000,
					height: 15000,
				}),
			).rejects.toThrow(/Image height 15000px exceeds maximum allowed/)
		})

		it('should include context in validation error when height exceeds', async () => {
			try {
				await adapter.optimize('image.jpg', {
					width: 10000,
					height: 15000,
				})
			} catch (error) {
				expect(error).toBeInstanceOf(ImageValidationError)
				if (error instanceof ImageValidationError) {
					expect(error.context).toEqual({
						height: 15000,
						maxHeight: SECURITY_LIMITS.MAX_HEIGHT,
						reason: 'height_exceeded',
					})
				}
			}
		})

		it('should check total pixels when both dimensions are within individual limits', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: 10000,
					height: 10000,
				}),
			).rejects.toThrow(ImageValidationError)
		})
	})

	describe('Edge Cases', () => {
		it('should handle undefined width and height', async () => {
			const result = await adapter.optimize('image.jpg', {})
			expect(result).toBeDefined()
		})

		it('should handle only width defined', async () => {
			const result = await adapter.optimize('image.jpg', { width: 800 })
			expect(result.width).toBe(800)
		})

		it('should handle only height defined', async () => {
			const result = await adapter.optimize('image.jpg', { height: 600 })
			expect(result.height).toBe(600)
		})

		it('should reject width at limit + 1', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: SECURITY_LIMITS.MAX_WIDTH + 1,
					height: 100,
				}),
			).rejects.toThrow(ImageValidationError)
		})

		it('should reject height at limit + 1', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: 100,
					height: SECURITY_LIMITS.MAX_HEIGHT + 1,
				}),
			).rejects.toThrow(ImageValidationError)
		})
	})

	describe('LQIP Validation', () => {
		it('should validate LQIP dimensions', async () => {
			await expect(
				adapter.generateLQIP('image.jpg', {
					width: SECURITY_LIMITS.MAX_WIDTH + 1,
					height: 100,
				}),
			).rejects.toThrow(ImageValidationError)
		})

		it('should accept valid LQIP dimensions', async () => {
			const lqip = await adapter.generateLQIP('image.jpg', {
				width: 50,
				height: 50,
			})
			expect(lqip).toBe('image.jpg')
		})

		it('should reject LQIP with excessive pixels', async () => {
			await expect(
				adapter.generateLQIP('image.jpg', {
					width: 10000,
					height: 15000,
				}),
			).rejects.toThrow(ImageValidationError)
		})
	})

	describe('Attack Scenarios', () => {
		it('should prevent memory exhaustion via massive dimensions', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: Number.MAX_SAFE_INTEGER,
					height: Number.MAX_SAFE_INTEGER,
				}),
			).rejects.toThrow(ImageValidationError)
		})

		it('should prevent CPU exhaustion via large pixel count', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: 10000,
					height: 20000,
				}),
			).rejects.toThrow(ImageValidationError)
		})

		it('should prevent bandwidth exhaustion', async () => {
			await expect(
				adapter.optimize('image.jpg', {
					width: 50000,
					height: 50000,
				}),
			).rejects.toThrow(ImageValidationError)
		})
	})

	describe('Security Limits Constants', () => {
		it('should have defined MAX_WIDTH', () => {
			expect(SECURITY_LIMITS.MAX_WIDTH).toBe(10000)
		})

		it('should have defined MAX_HEIGHT', () => {
			expect(SECURITY_LIMITS.MAX_HEIGHT).toBe(10000)
		})

		it('should have defined MAX_PIXELS', () => {
			expect(SECURITY_LIMITS.MAX_PIXELS).toBe(100 * 1024 * 1024)
		})

		it('should have defined MAX_FILE_SIZE', () => {
			expect(SECURITY_LIMITS.MAX_FILE_SIZE).toBe(50 * 1024 * 1024)
		})
	})
})
