/**
 * Unit tests for image quality utilities
 */

import { describe, expect, it } from 'vitest'

import {
	AGGRESSIVE_QUALITY,
	DEFAULT_QUALITY,
	getCompressionOptions,
	getQualityForFormat,
	getQualityProfile,
	LOSSLESS_QUALITY,
	shouldUseMozjpeg,
	shouldUsePngquant,
} from './quality.js'

describe('Quality Utilities', () => {
	describe('Quality Profile Constants', () => {
		it('should have DEFAULT_QUALITY with correct values', () => {
			expect(DEFAULT_QUALITY).toEqual({
				png: 100,
				webp: 90,
				avif: 85,
				jpeg: 80,
				jpg: 80,
			})
		})

		it('should have LOSSLESS_QUALITY with maximum quality', () => {
			expect(LOSSLESS_QUALITY).toEqual({
				png: 100,
				webp: 100,
				avif: 100,
				jpeg: 95,
				jpg: 95,
			})
		})

		it('should have AGGRESSIVE_QUALITY with reduced quality', () => {
			expect(AGGRESSIVE_QUALITY).toEqual({
				png: 85,
				webp: 75,
				avif: 70,
				jpeg: 65,
				jpg: 65,
			})
		})

		it('should have lower AGGRESSIVE values than DEFAULT', () => {
			expect(AGGRESSIVE_QUALITY.webp).toBeLessThan(DEFAULT_QUALITY.webp)
			expect(AGGRESSIVE_QUALITY.avif).toBeLessThan(DEFAULT_QUALITY.avif)
			expect(AGGRESSIVE_QUALITY.jpeg).toBeLessThan(DEFAULT_QUALITY.jpeg)
		})

		it('should have higher LOSSLESS values than DEFAULT', () => {
			expect(LOSSLESS_QUALITY.webp).toBeGreaterThan(DEFAULT_QUALITY.webp)
			expect(LOSSLESS_QUALITY.avif).toBeGreaterThan(DEFAULT_QUALITY.avif)
		})
	})

	describe('getQualityProfile', () => {
		it('should return LOSSLESS_QUALITY for lossless profile', () => {
			expect(getQualityProfile('lossless')).toEqual(LOSSLESS_QUALITY)
		})

		it('should return AGGRESSIVE_QUALITY for aggressive profile', () => {
			expect(getQualityProfile('aggressive')).toEqual(AGGRESSIVE_QUALITY)
		})

		it('should return DEFAULT_QUALITY for balanced profile', () => {
			expect(getQualityProfile('balanced')).toEqual(DEFAULT_QUALITY)
		})

		it('should return DEFAULT_QUALITY as fallback', () => {
			expect(getQualityProfile('unknown' as any)).toEqual(DEFAULT_QUALITY)
		})
	})

	describe('getQualityForFormat', () => {
		describe('Custom quality override', () => {
			it('should use custom quality when provided', () => {
				expect(getQualityForFormat('webp', 'balanced', 75)).toBe(75)
			})

			it('should clamp custom quality to 0-100 range (above)', () => {
				expect(getQualityForFormat('webp', 'balanced', 150)).toBe(100)
			})

			it('should clamp custom quality to 0-100 range (below)', () => {
				expect(getQualityForFormat('webp', 'balanced', -50)).toBe(0)
			})

			it('should handle custom quality of 0', () => {
				expect(getQualityForFormat('webp', 'balanced', 0)).toBe(0)
			})

			it('should handle custom quality of 100', () => {
				expect(getQualityForFormat('webp', 'balanced', 100)).toBe(100)
			})
		})

		describe('Profile-based quality', () => {
			it('should return PNG quality for balanced profile', () => {
				expect(getQualityForFormat('png', 'balanced')).toBe(
					DEFAULT_QUALITY.png,
				)
			})

			it('should return WebP quality for balanced profile', () => {
				expect(getQualityForFormat('webp', 'balanced')).toBe(
					DEFAULT_QUALITY.webp,
				)
			})

			it('should return AVIF quality for balanced profile', () => {
				expect(getQualityForFormat('avif', 'balanced')).toBe(
					DEFAULT_QUALITY.avif,
				)
			})

			it('should return JPEG quality for balanced profile', () => {
				expect(getQualityForFormat('jpeg', 'balanced')).toBe(
					DEFAULT_QUALITY.jpeg,
				)
			})

			it('should return JPG quality for balanced profile', () => {
				expect(getQualityForFormat('jpg', 'balanced')).toBe(
					DEFAULT_QUALITY.jpg,
				)
			})
		})

		describe('Lossless profile', () => {
			it('should return lossless PNG quality', () => {
				expect(getQualityForFormat('png', 'lossless')).toBe(
					LOSSLESS_QUALITY.png,
				)
			})

			it('should return lossless WebP quality', () => {
				expect(getQualityForFormat('webp', 'lossless')).toBe(
					LOSSLESS_QUALITY.webp,
				)
			})

			it('should return lossless AVIF quality', () => {
				expect(getQualityForFormat('avif', 'lossless')).toBe(
					LOSSLESS_QUALITY.avif,
				)
			})
		})

		describe('Aggressive profile', () => {
			it('should return aggressive PNG quality', () => {
				expect(getQualityForFormat('png', 'aggressive')).toBe(
					AGGRESSIVE_QUALITY.png,
				)
			})

			it('should return aggressive WebP quality', () => {
				expect(getQualityForFormat('webp', 'aggressive')).toBe(
					AGGRESSIVE_QUALITY.webp,
				)
			})

			it('should return aggressive AVIF quality', () => {
				expect(getQualityForFormat('avif', 'aggressive')).toBe(
					AGGRESSIVE_QUALITY.avif,
				)
			})
		})

		describe('SVG special case', () => {
			it('should always return 100 for SVG', () => {
				expect(getQualityForFormat('svg', 'balanced')).toBe(100)
				expect(getQualityForFormat('svg', 'lossless')).toBe(100)
				expect(getQualityForFormat('svg', 'aggressive')).toBe(100)
			})

			it('should ignore custom quality for SVG', () => {
				expect(getQualityForFormat('svg', 'balanced', 50)).toBe(50)
			})
		})

		describe('Default profile', () => {
			it('should use balanced profile by default', () => {
				expect(getQualityForFormat('webp')).toBe(DEFAULT_QUALITY.webp)
			})
		})

		describe('Fallback for unknown formats', () => {
			it('should fallback to WebP quality for unknown format', () => {
				expect(getQualityForFormat('unknown' as any, 'balanced')).toBe(
					DEFAULT_QUALITY.webp,
				)
			})
		})
	})

	describe('shouldUseMozjpeg', () => {
		it('should return true for JPEG format', () => {
			expect(shouldUseMozjpeg('jpeg')).toBe(true)
		})

		it('should return true for JPG format', () => {
			expect(shouldUseMozjpeg('jpg')).toBe(true)
		})

		it('should return false for PNG format', () => {
			expect(shouldUseMozjpeg('png')).toBe(false)
		})

		it('should return false for WebP format', () => {
			expect(shouldUseMozjpeg('webp')).toBe(false)
		})

		it('should return false for AVIF format', () => {
			expect(shouldUseMozjpeg('avif')).toBe(false)
		})

		it('should return false for SVG format', () => {
			expect(shouldUseMozjpeg('svg')).toBe(false)
		})
	})

	describe('shouldUsePngquant', () => {
		it('should return true for PNG format', () => {
			expect(shouldUsePngquant('png')).toBe(true)
		})

		it('should return false for JPEG format', () => {
			expect(shouldUsePngquant('jpeg')).toBe(false)
		})

		it('should return false for JPG format', () => {
			expect(shouldUsePngquant('jpg')).toBe(false)
		})

		it('should return false for WebP format', () => {
			expect(shouldUsePngquant('webp')).toBe(false)
		})

		it('should return false for AVIF format', () => {
			expect(shouldUsePngquant('avif')).toBe(false)
		})

		it('should return false for SVG format', () => {
			expect(shouldUsePngquant('svg')).toBe(false)
		})
	})

	describe('getCompressionOptions', () => {
		describe('JPEG/JPG compression', () => {
			it('should return JPEG compression options', () => {
				const options = getCompressionOptions('jpeg', 80)
				expect(options).toEqual({
					quality: 80,
					mozjpeg: true,
					progressive: true,
				})
			})

			it('should return JPG compression options', () => {
				const options = getCompressionOptions('jpg', 75)
				expect(options).toEqual({
					quality: 75,
					mozjpeg: true,
					progressive: true,
				})
			})

			it('should enable mozjpeg optimization', () => {
				const options = getCompressionOptions('jpeg', 90)
				expect(options.mozjpeg).toBe(true)
			})

			it('should enable progressive encoding', () => {
				const options = getCompressionOptions('jpeg', 90)
				expect(options.progressive).toBe(true)
			})
		})

		describe('WebP compression', () => {
			it('should return WebP compression options', () => {
				const options = getCompressionOptions('webp', 85)
				expect(options).toEqual({
					quality: 85,
					effort: 4,
				})
			})

			it('should use effort level 4', () => {
				const options = getCompressionOptions('webp', 90)
				expect(options.effort).toBe(4)
			})
		})

		describe('AVIF compression', () => {
			it('should return AVIF compression options', () => {
				const options = getCompressionOptions('avif', 80)
				expect(options).toEqual({
					quality: 80,
					effort: 4,
				})
			})

			it('should use effort level 4', () => {
				const options = getCompressionOptions('avif', 85)
				expect(options.effort).toBe(4)
			})
		})

		describe('PNG compression', () => {
			it('should return PNG compression options', () => {
				const options = getCompressionOptions('png', 95)
				expect(options).toEqual({
					quality: 95,
					compressionLevel: 9,
					adaptiveFiltering: true,
				})
			})

			it('should use maximum compression level', () => {
				const options = getCompressionOptions('png', 100)
				expect(options.compressionLevel).toBe(9)
			})

			it('should enable adaptive filtering', () => {
				const options = getCompressionOptions('png', 100)
				expect(options.adaptiveFiltering).toBe(true)
			})
		})

		describe('SVG and unknown formats', () => {
			it('should return basic quality option for SVG', () => {
				const options = getCompressionOptions('svg', 100)
				expect(options).toEqual({ quality: 100 })
			})

			it('should return basic quality option for unknown format', () => {
				const options = getCompressionOptions('unknown' as any, 85)
				expect(options).toEqual({ quality: 85 })
			})
		})

		describe('Quality value propagation', () => {
			it('should preserve quality value for all formats', () => {
				expect(getCompressionOptions('jpeg', 75).quality).toBe(75)
				expect(getCompressionOptions('webp', 85).quality).toBe(85)
				expect(getCompressionOptions('avif', 90).quality).toBe(90)
				expect(getCompressionOptions('png', 95).quality).toBe(95)
			})

			it('should handle edge quality values', () => {
				expect(getCompressionOptions('webp', 0).quality).toBe(0)
				expect(getCompressionOptions('webp', 100).quality).toBe(100)
			})
		})
	})
})
