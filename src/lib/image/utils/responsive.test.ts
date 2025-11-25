/**
 * Unit tests for responsive image utilities
 */

import { describe, expect, it } from 'vitest'

import type { OptimizedImage } from '../types.js'
import {
	buildPictureSources,
	COMMON_SIZES,
	calculateImageDimensions,
	calculateResponsiveWidths,
	DEFAULT_BREAKPOINTS,
	DEFAULT_DENSITIES,
	DEFAULT_RESPONSIVE_CONFIG,
	generateSizes,
	generateSrcSet,
	getResponsiveBreakpoints,
} from './responsive.js'

describe('Responsive Image Utilities', () => {
	describe('Constants', () => {
		it('should export DEFAULT_BREAKPOINTS', () => {
			expect(DEFAULT_BREAKPOINTS).toEqual([640, 1024, 1920, 2560])
		})

		it('should export DEFAULT_DENSITIES', () => {
			expect(DEFAULT_DENSITIES).toEqual([1, 2, 3])
		})

		it('should export DEFAULT_RESPONSIVE_CONFIG', () => {
			expect(DEFAULT_RESPONSIVE_CONFIG).toEqual({
				breakpoints: [640, 1024, 1920, 2560],
				densities: [1, 2, 3],
				maxWidth: 2560,
			})
		})

		it('should have COMMON_SIZES patterns', () => {
			expect(COMMON_SIZES.fullWidth).toBe('100vw')
			expect(COMMON_SIZES.halfDesktop).toBeTruthy()
			expect(COMMON_SIZES.twoColumns).toBeTruthy()
			expect(COMMON_SIZES.threeColumns).toBeTruthy()
			expect(COMMON_SIZES.hero).toBeTruthy()
			expect(COMMON_SIZES.content).toBeTruthy()
			expect(COMMON_SIZES.thumbnail).toBeTruthy()
		})
	})

	describe('generateSrcSet', () => {
		it('should generate srcset from single image', () => {
			const images: OptimizedImage[] = [
				{
					src: '/img-640.webp',
					width: 640,
					height: 480,
					format: 'webp',
				},
			]
			expect(generateSrcSet(images)).toBe('/img-640.webp 640w')
		})

		it('should generate srcset from multiple images', () => {
			const images: OptimizedImage[] = [
				{
					src: '/img-640.webp',
					width: 640,
					height: 480,
					format: 'webp',
				},
				{
					src: '/img-1024.webp',
					width: 1024,
					height: 768,
					format: 'webp',
				},
			]
			expect(generateSrcSet(images)).toBe(
				'/img-640.webp 640w, /img-1024.webp 1024w',
			)
		})

		it('should handle empty array', () => {
			expect(generateSrcSet([])).toBe('')
		})

		it('should preserve image order', () => {
			const images: OptimizedImage[] = [
				{
					src: '/img-1920.webp',
					width: 1920,
					height: 1080,
					format: 'webp',
				},
				{
					src: '/img-640.webp',
					width: 640,
					height: 480,
					format: 'webp',
				},
				{
					src: '/img-1024.webp',
					width: 1024,
					height: 768,
					format: 'webp',
				},
			]
			const srcset = generateSrcSet(images)
			expect(srcset).toBe(
				'/img-1920.webp 1920w, /img-640.webp 640w, /img-1024.webp 1024w',
			)
		})

		it('should handle images with different formats', () => {
			const images: OptimizedImage[] = [
				{ src: '/img.png', width: 800, height: 600, format: 'png' },
				{ src: '/img.avif', width: 800, height: 600, format: 'avif' },
			]
			expect(generateSrcSet(images)).toBe('/img.png 800w, /img.avif 800w')
		})

		it('should handle very large widths', () => {
			const images: OptimizedImage[] = [
				{
					src: '/img-5k.webp',
					width: 5120,
					height: 2880,
					format: 'webp',
				},
			]
			expect(generateSrcSet(images)).toBe('/img-5k.webp 5120w')
		})
	})

	describe('generateSizes', () => {
		it('should generate sizes with single breakpoint', () => {
			const sizes = [{ breakpoint: 640, size: '100vw' }]
			expect(generateSizes(sizes, '50vw')).toBe(
				'(max-width: 640px) 100vw, 50vw',
			)
		})

		it('should generate sizes with multiple breakpoints', () => {
			const sizes = [
				{ breakpoint: 640, size: '100vw' },
				{ breakpoint: 1024, size: '50vw' },
			]
			expect(generateSizes(sizes, '33vw')).toBe(
				'(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
			)
		})

		it('should use default size when array is empty', () => {
			expect(generateSizes([], '100vw')).toBe('100vw')
		})

		it('should use default size as fallback', () => {
			const sizes = [{ breakpoint: 640, size: '100vw' }]
			const result = generateSizes(sizes, '768px')
			expect(result).toContain('768px')
			expect(result.endsWith('768px')).toBe(true)
		})

		it('should preserve size order', () => {
			const sizes = [
				{ breakpoint: 1920, size: '50vw' },
				{ breakpoint: 640, size: '100vw' },
			]
			const result = generateSizes(sizes)
			expect(result).toBe(
				'(max-width: 1920px) 50vw, (max-width: 640px) 100vw, 100vw',
			)
		})

		it('should handle pixel-based sizes', () => {
			const sizes = [{ breakpoint: 768, size: '768px' }]
			expect(generateSizes(sizes, '1024px')).toBe(
				'(max-width: 768px) 768px, 1024px',
			)
		})
	})

	describe('calculateResponsiveWidths', () => {
		it('should calculate widths for standard breakpoints and densities', () => {
			const widths = calculateResponsiveWidths([640, 1024], [1, 2])
			expect(widths).toEqual([640, 1024, 1280, 2048])
		})

		it('should remove duplicates', () => {
			const widths = calculateResponsiveWidths([640, 640], [1, 1])
			expect(widths).toEqual([640])
		})

		it('should sort widths ascending', () => {
			const widths = calculateResponsiveWidths([1024, 640], [2, 1])
			expect(widths).toEqual([640, 1024, 1280, 2048])
		})

		it('should respect maxWidth constraint', () => {
			const widths = calculateResponsiveWidths(
				[640, 1024, 1920],
				[1, 2, 3],
				2000,
			)
			expect(widths.every(w => w <= 2000)).toBe(true)
			expect(widths).not.toContain(2048)
			expect(widths).not.toContain(3072)
			expect(widths).not.toContain(5760)
		})

		it('should handle single breakpoint', () => {
			const widths = calculateResponsiveWidths([640], [1, 2])
			expect(widths).toEqual([640, 1280])
		})

		it('should handle single density', () => {
			const widths = calculateResponsiveWidths([640, 1024], [1])
			expect(widths).toEqual([640, 1024])
		})

		it('should handle empty breakpoints', () => {
			const widths = calculateResponsiveWidths([], [1, 2])
			expect(widths).toEqual([])
		})

		it('should handle empty densities', () => {
			const widths = calculateResponsiveWidths([640, 1024], [])
			expect(widths).toEqual([])
		})

		it('should calculate widths for 3x density displays', () => {
			const widths = calculateResponsiveWidths([640], [1, 2, 3])
			expect(widths).toEqual([640, 1280, 1920])
		})

		it('should handle maxWidth exactly at calculated width', () => {
			const widths = calculateResponsiveWidths([640], [1, 2], 1280)
			expect(widths).toEqual([640, 1280])
		})

		it('should exclude widths exceeding maxWidth by 1px', () => {
			const widths = calculateResponsiveWidths([640], [1, 2], 1279)
			expect(widths).toEqual([640])
		})
	})

	describe('calculateImageDimensions', () => {
		describe('No target dimensions', () => {
			it('should return original dimensions', () => {
				const result = calculateImageDimensions(1920, 1080)
				expect(result).toEqual({ width: 1920, height: 1080 })
			})
		})

		describe('Target width only', () => {
			it('should calculate height maintaining aspect ratio', () => {
				const result = calculateImageDimensions(1920, 1080, 960)
				expect(result).toEqual({ width: 960, height: 540 })
			})

			it('should round height to nearest integer', () => {
				const result = calculateImageDimensions(1920, 1080, 961)
				expect(result.height).toBe(541)
			})

			it('should handle landscape images', () => {
				const result = calculateImageDimensions(1600, 900, 800)
				expect(result).toEqual({ width: 800, height: 450 })
			})

			it('should handle portrait images', () => {
				const result = calculateImageDimensions(900, 1600, 450)
				expect(result).toEqual({ width: 450, height: 800 })
			})

			it('should handle square images', () => {
				const result = calculateImageDimensions(1000, 1000, 500)
				expect(result).toEqual({ width: 500, height: 500 })
			})
		})

		describe('Target height only', () => {
			it('should calculate width maintaining aspect ratio', () => {
				const result = calculateImageDimensions(
					1920,
					1080,
					undefined,
					540,
				)
				expect(result).toEqual({ width: 960, height: 540 })
			})

			it('should round width to nearest integer', () => {
				const result = calculateImageDimensions(
					1920,
					1080,
					undefined,
					541,
				)
				expect(result.width).toBe(962)
			})

			it('should handle landscape images', () => {
				const result = calculateImageDimensions(
					1600,
					900,
					undefined,
					450,
				)
				expect(result).toEqual({ width: 800, height: 450 })
			})

			it('should handle portrait images', () => {
				const result = calculateImageDimensions(
					900,
					1600,
					undefined,
					800,
				)
				expect(result).toEqual({ width: 450, height: 800 })
			})
		})

		describe('Both target dimensions', () => {
			it('should use both dimensions directly', () => {
				const result = calculateImageDimensions(1920, 1080, 800, 600)
				expect(result).toEqual({ width: 800, height: 600 })
			})

			it('should allow non-proportional dimensions', () => {
				const result = calculateImageDimensions(1920, 1080, 1000, 1000)
				expect(result).toEqual({ width: 1000, height: 1000 })
			})

			it('should not maintain aspect ratio when both specified', () => {
				const result = calculateImageDimensions(1600, 900, 800, 800)
				expect(result).toEqual({ width: 800, height: 800 })
			})
		})

		describe('Edge cases', () => {
			it('should handle very small dimensions', () => {
				const result = calculateImageDimensions(1920, 1080, 10)
				expect(result.width).toBe(10)
				expect(result.height).toBeGreaterThan(0)
			})

			it('should handle very large dimensions', () => {
				const result = calculateImageDimensions(100, 100, 10000)
				expect(result).toEqual({ width: 10000, height: 10000 })
			})

			it('should handle aspect ratio of 1', () => {
				const result = calculateImageDimensions(1000, 1000, 500)
				expect(result).toEqual({ width: 500, height: 500 })
			})

			it('should handle wide aspect ratios', () => {
				const result = calculateImageDimensions(2560, 1080, 1280)
				expect(result.height).toBe(540)
			})

			it('should handle tall aspect ratios', () => {
				const result = calculateImageDimensions(
					1080,
					2560,
					undefined,
					1280,
				)
				expect(result.width).toBe(540)
			})
		})
	})

	describe('getResponsiveBreakpoints', () => {
		it('should return default breakpoints when no custom provided', () => {
			expect(getResponsiveBreakpoints()).toEqual(DEFAULT_BREAKPOINTS)
		})

		it('should return custom breakpoints when provided', () => {
			const custom = [375, 768, 1440]
			expect(getResponsiveBreakpoints(custom)).toEqual([375, 768, 1440])
		})

		it('should sort custom breakpoints', () => {
			const custom = [1440, 375, 768]
			expect(getResponsiveBreakpoints(custom)).toEqual([375, 768, 1440])
		})

		it('should return default when empty array provided', () => {
			expect(getResponsiveBreakpoints([])).toEqual(DEFAULT_BREAKPOINTS)
		})

		it('should handle single custom breakpoint', () => {
			expect(getResponsiveBreakpoints([768])).toEqual([768])
		})

		it('should not mutate input array', () => {
			const custom = [1440, 375, 768]
			getResponsiveBreakpoints(custom)
			expect(custom).toEqual([1440, 375, 768])
		})

		it('should handle undefined explicitly', () => {
			expect(getResponsiveBreakpoints(undefined)).toEqual(
				DEFAULT_BREAKPOINTS,
			)
		})

		it('should handle duplicate breakpoints', () => {
			const custom = [768, 768, 1024]
			expect(getResponsiveBreakpoints(custom)).toEqual([768, 768, 1024])
		})
	})

	describe('buildPictureSources', () => {
		it('should build picture sources from single breakpoint', () => {
			const sources = [
				{
					breakpoint: 640,
					images: [
						{
							src: '/img-640.webp',
							width: 640,
							height: 480,
							format: 'webp' as const,
						},
					],
				},
			]
			const result = buildPictureSources(sources)
			expect(result).toEqual([
				{
					media: '(max-width: 640px)',
					srcSet: '/img-640.webp 640w',
					type: 'image/webp',
				},
			])
		})

		it('should build picture sources from multiple breakpoints', () => {
			const sources = [
				{
					breakpoint: 640,
					images: [
						{
							src: '/img-640.webp',
							width: 640,
							height: 480,
							format: 'webp' as const,
						},
					],
				},
				{
					breakpoint: 1024,
					images: [
						{
							src: '/img-1024.webp',
							width: 1024,
							height: 768,
							format: 'webp' as const,
						},
					],
				},
			]
			const result = buildPictureSources(sources)
			expect(result).toHaveLength(2)
			expect(result[0]?.media).toBe('(max-width: 640px)')
			expect(result[1]?.media).toBe('(max-width: 1024px)')
		})

		it('should generate srcSet from multiple images per breakpoint', () => {
			const sources = [
				{
					breakpoint: 640,
					images: [
						{
							src: '/img-640.webp',
							width: 640,
							height: 480,
							format: 'webp' as const,
						},
						{
							src: '/img-1280.webp',
							width: 1280,
							height: 960,
							format: 'webp' as const,
						},
					],
				},
			]
			const result = buildPictureSources(sources)
			expect(result[0]?.srcSet).toBe(
				'/img-640.webp 640w, /img-1280.webp 1280w',
			)
		})

		it('should set type from first image format', () => {
			const sources = [
				{
					breakpoint: 640,
					images: [
						{
							src: '/img.avif',
							width: 640,
							height: 480,
							format: 'avif' as const,
						},
					],
				},
			]
			const result = buildPictureSources(sources)
			expect(result[0]?.type).toBe('image/avif')
		})

		it('should handle empty images array', () => {
			const sources = [
				{
					breakpoint: 640,
					images: [],
				},
			]
			const result = buildPictureSources(sources)
			expect(result[0]?.srcSet).toBe('')
			expect(result[0]?.type).toBeUndefined()
		})

		it('should handle empty sources array', () => {
			const result = buildPictureSources([])
			expect(result).toEqual([])
		})

		it('should handle different formats for different breakpoints', () => {
			const sources = [
				{
					breakpoint: 640,
					images: [
						{
							src: '/img.webp',
							width: 640,
							height: 480,
							format: 'webp' as const,
						},
					],
				},
				{
					breakpoint: 1024,
					images: [
						{
							src: '/img.avif',
							width: 1024,
							height: 768,
							format: 'avif' as const,
						},
					],
				},
			]
			const result = buildPictureSources(sources)
			expect(result[0]?.type).toBe('image/webp')
			expect(result[1]?.type).toBe('image/avif')
		})
	})

	describe('COMMON_SIZES patterns', () => {
		it('should have fullWidth pattern', () => {
			expect(COMMON_SIZES.fullWidth).toBe('100vw')
		})

		it('should have halfDesktop pattern with breakpoint', () => {
			expect(COMMON_SIZES.halfDesktop).toContain('768px')
			expect(COMMON_SIZES.halfDesktop).toContain('100vw')
			expect(COMMON_SIZES.halfDesktop).toContain('50vw')
		})

		it('should have threeColumns pattern with multiple breakpoints', () => {
			expect(COMMON_SIZES.threeColumns).toContain('640px')
			expect(COMMON_SIZES.threeColumns).toContain('1024px')
			expect(COMMON_SIZES.threeColumns).toContain('33.33vw')
		})

		it('should have hero pattern with max constraint', () => {
			expect(COMMON_SIZES.hero).toContain('1920px')
		})

		it('should have content pattern', () => {
			expect(COMMON_SIZES.content).toContain('768px')
		})

		it('should have thumbnail pattern with pixel sizes', () => {
			expect(COMMON_SIZES.thumbnail).toContain('150px')
			expect(COMMON_SIZES.thumbnail).toContain('300px')
		})
	})
})
