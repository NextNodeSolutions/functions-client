/**
 * Unit tests for image format utilities
 */

import { describe, expect, it } from 'vitest'

import type { ImageValidationConfig } from '../types.js'
import {
	detectImageFormat,
	getRecommendedFormat,
	isVectorFormat,
	supportsTransparency,
	validateImage,
	validateImageDimensions,
	validateImageFormat,
	validateImageSize,
} from './format.js'

describe('Format Utilities', () => {
	describe('detectImageFormat', () => {
		describe('MIME type detection', () => {
			it('should detect SVG from MIME type', () => {
				expect(detectImageFormat('file.unknown', 'image/svg+xml')).toBe(
					'svg',
				)
			})

			it('should detect PNG from MIME type', () => {
				expect(detectImageFormat('file.unknown', 'image/png')).toBe(
					'png',
				)
			})

			it('should detect WebP from MIME type', () => {
				expect(detectImageFormat('file.unknown', 'image/webp')).toBe(
					'webp',
				)
			})

			it('should detect AVIF from MIME type', () => {
				expect(detectImageFormat('file.unknown', 'image/avif')).toBe(
					'avif',
				)
			})

			it('should detect JPEG from MIME type', () => {
				expect(detectImageFormat('file.unknown', 'image/jpeg')).toBe(
					'jpeg',
				)
			})

			it('should detect JPG from MIME type', () => {
				expect(detectImageFormat('file.unknown', 'image/jpg')).toBe(
					'jpg',
				)
			})

			it('should prioritize MIME type over extension', () => {
				expect(detectImageFormat('file.jpg', 'image/png')).toBe('png')
			})
		})

		describe('Extension detection', () => {
			it('should detect SVG from extension', () => {
				expect(detectImageFormat('image.svg')).toBe('svg')
			})

			it('should detect PNG from extension', () => {
				expect(detectImageFormat('image.png')).toBe('png')
			})

			it('should detect WebP from extension', () => {
				expect(detectImageFormat('image.webp')).toBe('webp')
			})

			it('should detect AVIF from extension', () => {
				expect(detectImageFormat('image.avif')).toBe('avif')
			})

			it('should detect JPEG from extension', () => {
				expect(detectImageFormat('image.jpeg')).toBe('jpeg')
			})

			it('should detect JPG from extension', () => {
				expect(detectImageFormat('image.jpg')).toBe('jpg')
			})

			it('should be case-insensitive', () => {
				expect(detectImageFormat('IMAGE.PNG')).toBe('png')
				expect(detectImageFormat('Image.JpG')).toBe('jpg')
			})

			it('should handle paths with directories', () => {
				expect(detectImageFormat('/path/to/image.png')).toBe('png')
			})

			it('should handle URLs', () => {
				expect(
					detectImageFormat('https://example.com/image.webp'),
				).toBe('webp')
			})
		})

		describe('Edge cases', () => {
			it('should return null for unknown extension', () => {
				expect(detectImageFormat('file.txt')).toBeNull()
			})

			it('should return null for unknown MIME type', () => {
				expect(
					detectImageFormat('file.unknown', 'text/plain'),
				).toBeNull()
			})

			it('should return null for file without extension', () => {
				expect(detectImageFormat('image')).toBeNull()
			})

			it('should return null for empty string', () => {
				expect(detectImageFormat('')).toBeNull()
			})

			it('should handle multiple dots in filename', () => {
				expect(detectImageFormat('my.image.file.png')).toBe('png')
			})
		})
	})

	describe('isVectorFormat', () => {
		it('should return true for SVG', () => {
			expect(isVectorFormat('svg')).toBe(true)
		})

		it('should return false for PNG', () => {
			expect(isVectorFormat('png')).toBe(false)
		})

		it('should return false for WebP', () => {
			expect(isVectorFormat('webp')).toBe(false)
		})

		it('should return false for AVIF', () => {
			expect(isVectorFormat('avif')).toBe(false)
		})

		it('should return false for JPEG', () => {
			expect(isVectorFormat('jpeg')).toBe(false)
		})

		it('should return false for JPG', () => {
			expect(isVectorFormat('jpg')).toBe(false)
		})
	})

	describe('supportsTransparency', () => {
		it('should return true for PNG', () => {
			expect(supportsTransparency('png')).toBe(true)
		})

		it('should return true for WebP', () => {
			expect(supportsTransparency('webp')).toBe(true)
		})

		it('should return true for AVIF', () => {
			expect(supportsTransparency('avif')).toBe(true)
		})

		it('should return true for SVG', () => {
			expect(supportsTransparency('svg')).toBe(true)
		})

		it('should return false for JPEG', () => {
			expect(supportsTransparency('jpeg')).toBe(false)
		})

		it('should return false for JPG', () => {
			expect(supportsTransparency('jpg')).toBe(false)
		})
	})

	describe('getRecommendedFormat', () => {
		it('should recommend PNG for icons with transparency', () => {
			expect(
				getRecommendedFormat({ isIcon: true, hasTransparency: true }),
			).toBe('png')
		})

		it('should recommend WebP for icons without transparency', () => {
			expect(
				getRecommendedFormat({ isIcon: true, hasTransparency: false }),
			).toBe('webp')
		})

		it('should recommend AVIF for photos', () => {
			expect(getRecommendedFormat({ isPhoto: true })).toBe('avif')
		})

		it('should prioritize photo optimization over transparency', () => {
			expect(
				getRecommendedFormat({ isPhoto: true, hasTransparency: true }),
			).toBe('avif')
		})

		it('should recommend WebP for images with transparency', () => {
			expect(getRecommendedFormat({ hasTransparency: true })).toBe('webp')
		})

		it('should default to WebP for general use', () => {
			expect(getRecommendedFormat({})).toBe('webp')
		})

		it('should handle all options undefined', () => {
			expect(
				getRecommendedFormat({
					hasTransparency: undefined,
					isPhoto: undefined,
					isIcon: undefined,
				}),
			).toBe('webp')
		})
	})

	describe('validateImageDimensions', () => {
		const baseConfig: ImageValidationConfig = {
			maxWidth: 5000,
			maxHeight: 5000,
			minWidth: 100,
			minHeight: 100,
		}

		it('should validate dimensions within limits', () => {
			const result = validateImageDimensions(800, 600, baseConfig)
			expect(result.valid).toBe(true)
			expect(result.errors).toEqual([])
		})

		it('should reject width exceeding maximum', () => {
			const result = validateImageDimensions(6000, 600, baseConfig)
			expect(result.valid).toBe(false)
			expect(result.errors).toContain(
				'Width 6000px exceeds maximum 5000px',
			)
		})

		it('should reject height exceeding maximum', () => {
			const result = validateImageDimensions(800, 6000, baseConfig)
			expect(result.valid).toBe(false)
			expect(result.errors).toContain(
				'Height 6000px exceeds maximum 5000px',
			)
		})

		it('should reject width below minimum', () => {
			const result = validateImageDimensions(50, 600, baseConfig)
			expect(result.valid).toBe(false)
			expect(result.errors).toContain('Width 50px is below minimum 100px')
		})

		it('should reject height below minimum', () => {
			const result = validateImageDimensions(800, 50, baseConfig)
			expect(result.valid).toBe(false)
			expect(result.errors).toContain(
				'Height 50px is below minimum 100px',
			)
		})

		it('should collect multiple errors', () => {
			const result = validateImageDimensions(50, 6000, baseConfig)
			expect(result.valid).toBe(false)
			expect(result.errors.length).toBe(2)
		})

		it('should handle config without constraints', () => {
			const result = validateImageDimensions(800, 600, {})
			expect(result.valid).toBe(true)
			expect(result.errors).toEqual([])
		})

		it('should validate at exact maximum', () => {
			const result = validateImageDimensions(5000, 5000, baseConfig)
			expect(result.valid).toBe(true)
		})

		it('should validate at exact minimum', () => {
			const result = validateImageDimensions(100, 100, baseConfig)
			expect(result.valid).toBe(true)
		})
	})

	describe('validateImageSize', () => {
		const config: ImageValidationConfig = {
			maxFileSize: 10 * 1024 * 1024, // 10MB
		}

		it('should validate size within limit', () => {
			const result = validateImageSize(5 * 1024 * 1024, config)
			expect(result.valid).toBe(true)
			expect(result.errors).toEqual([])
		})

		it('should reject size exceeding maximum', () => {
			const result = validateImageSize(15 * 1024 * 1024, config)
			expect(result.valid).toBe(false)
			expect(result.errors[0]).toContain(
				'15.00MB exceeds maximum 10.00MB',
			)
		})

		it('should format sizes correctly', () => {
			const result = validateImageSize(5.5 * 1024 * 1024, config)
			expect(result.valid).toBe(true)
		})

		it('should handle config without size limit', () => {
			const result = validateImageSize(100 * 1024 * 1024, {})
			expect(result.valid).toBe(true)
		})

		it('should validate at exact maximum', () => {
			const result = validateImageSize(10 * 1024 * 1024, config)
			expect(result.valid).toBe(true)
		})

		it('should handle zero size', () => {
			const result = validateImageSize(0, config)
			expect(result.valid).toBe(true)
		})

		it('should handle small sizes', () => {
			const result = validateImageSize(1024, config)
			expect(result.valid).toBe(true)
		})
	})

	describe('validateImageFormat', () => {
		const config: ImageValidationConfig = {
			allowedFormats: ['png', 'webp', 'avif'],
		}

		it('should validate allowed format', () => {
			const result = validateImageFormat('png', config)
			expect(result.valid).toBe(true)
			expect(result.errors).toEqual([])
		})

		it('should reject disallowed format', () => {
			const result = validateImageFormat('jpeg', config)
			expect(result.valid).toBe(false)
			expect(result.errors[0]).toContain('Format "jpeg" is not allowed')
			expect(result.errors[0]).toContain('png, webp, avif')
		})

		it('should allow all formats when config is empty', () => {
			const result = validateImageFormat('jpeg', {})
			expect(result.valid).toBe(true)
		})

		it('should allow all formats when allowedFormats is empty array', () => {
			const result = validateImageFormat('jpeg', { allowedFormats: [] })
			expect(result.valid).toBe(true)
		})

		it('should validate multiple allowed formats', () => {
			expect(validateImageFormat('png', config).valid).toBe(true)
			expect(validateImageFormat('webp', config).valid).toBe(true)
			expect(validateImageFormat('avif', config).valid).toBe(true)
		})
	})

	describe('validateImage', () => {
		const config: ImageValidationConfig = {
			allowedFormats: ['png', 'webp'],
			maxWidth: 5000,
			maxHeight: 5000,
			minWidth: 100,
			minHeight: 100,
			maxFileSize: 10 * 1024 * 1024,
		}

		it('should validate fully compliant image', () => {
			const result = validateImage(
				'png',
				800,
				600,
				2 * 1024 * 1024,
				config,
			)
			expect(result.valid).toBe(true)
			expect(result.errors).toEqual([])
		})

		it('should collect format errors', () => {
			const result = validateImage(
				'jpeg',
				800,
				600,
				2 * 1024 * 1024,
				config,
			)
			expect(result.valid).toBe(false)
			expect(result.errors.some(e => e.includes('not allowed'))).toBe(
				true,
			)
		})

		it('should collect dimension errors', () => {
			const result = validateImage(
				'png',
				6000,
				600,
				2 * 1024 * 1024,
				config,
			)
			expect(result.valid).toBe(false)
			expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(
				true,
			)
		})

		it('should collect size errors', () => {
			const result = validateImage(
				'png',
				800,
				600,
				15 * 1024 * 1024,
				config,
			)
			expect(result.valid).toBe(false)
			expect(result.errors.some(e => e.includes('15.00MB'))).toBe(true)
		})

		it('should collect multiple errors from different validators', () => {
			const result = validateImage(
				'jpeg',
				6000,
				6000,
				15 * 1024 * 1024,
				config,
			)
			expect(result.valid).toBe(false)
			expect(result.errors.length).toBeGreaterThan(1)
		})

		it('should validate with minimal config', () => {
			const result = validateImage('png', 800, 600, 2 * 1024 * 1024, {})
			expect(result.valid).toBe(true)
		})

		it('should handle edge case values', () => {
			const result = validateImage(
				'png',
				5000,
				5000,
				10 * 1024 * 1024,
				config,
			)
			expect(result.valid).toBe(true)
		})
	})
})
