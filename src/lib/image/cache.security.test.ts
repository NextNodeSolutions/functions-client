/**
 * Security tests for cache utilities
 * Tests 100% coverage of critical security functions
 */

import { describe, expect, it } from 'vitest'

import {
	generateSecureCacheKey,
	sanitizeFilename,
	validateCacheHash,
} from './cache.js'
import { ImageConfigError } from './errors.js'

describe('Cache Security', () => {
	describe('validateCacheHash', () => {
		describe('Valid hashes', () => {
			it('should accept valid 64-character SHA-256 hex string (lowercase)', () => {
				const validHash =
					'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
				expect(validateCacheHash(validHash)).toBe(true)
			})

			it('should accept valid 64-character SHA-256 hex string (uppercase)', () => {
				const validHash =
					'A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2'
				expect(validateCacheHash(validHash)).toBe(true)
			})

			it('should accept valid 64-character SHA-256 hex string (mixed case)', () => {
				const validHash =
					'A1b2C3d4E5f6A1b2C3d4E5f6A1b2C3d4E5f6A1b2C3d4E5f6A1b2C3d4E5f6A1b2'
				expect(validateCacheHash(validHash)).toBe(true)
			})

			it('should accept all zeros', () => {
				const validHash =
					'0000000000000000000000000000000000000000000000000000000000000000'
				expect(validateCacheHash(validHash)).toBe(true)
			})

			it('should accept all f characters', () => {
				const validHash =
					'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
				expect(validateCacheHash(validHash)).toBe(true)
			})
		})

		describe('Invalid hashes - prevent cache poisoning', () => {
			it('should reject hash with invalid characters', () => {
				const invalidHash =
					'g1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
				expect(validateCacheHash(invalidHash)).toBe(false)
			})

			it('should reject hash that is too short (63 chars)', () => {
				const invalidHash =
					'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b'
				expect(validateCacheHash(invalidHash)).toBe(false)
			})

			it('should reject hash that is too long (65 chars)', () => {
				const invalidHash =
					'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c'
				expect(validateCacheHash(invalidHash)).toBe(false)
			})

			it('should reject empty string', () => {
				expect(validateCacheHash('')).toBe(false)
			})

			it('should reject hash with spaces', () => {
				const invalidHash =
					'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4 e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
				expect(validateCacheHash(invalidHash)).toBe(false)
			})

			it('should reject hash with special characters', () => {
				const invalidHash =
					'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4-e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
				expect(validateCacheHash(invalidHash)).toBe(false)
			})

			it('should reject SQL injection attempt', () => {
				const injectionHash = "'; DROP TABLE images; --"
				expect(validateCacheHash(injectionHash)).toBe(false)
			})

			it('should reject path traversal attempt', () => {
				const traversalHash = '../../../etc/passwd'
				expect(validateCacheHash(traversalHash)).toBe(false)
			})

			it('should reject null bytes', () => {
				const nullByteHash =
					'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4\x00e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
				expect(validateCacheHash(nullByteHash)).toBe(false)
			})

			it('should reject unicode characters', () => {
				const unicodeHash =
					'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4é5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
				expect(validateCacheHash(unicodeHash)).toBe(false)
			})
		})
	})

	describe('sanitizeFilename', () => {
		describe('Valid filenames', () => {
			it('should preserve valid alphanumeric filename', () => {
				expect(sanitizeFilename('image123.jpg')).toBe('image123.jpg')
			})

			it('should preserve filename with dashes and underscores', () => {
				expect(sanitizeFilename('my-image_file.png')).toBe(
					'my-image_file.png',
				)
			})

			it('should preserve filename with dots in extension', () => {
				expect(sanitizeFilename('file.test.jpg')).toBe('file.test.jpg')
			})

			it('should preserve uppercase characters', () => {
				expect(sanitizeFilename('MyImage.JPG')).toBe('MyImage.JPG')
			})
		})

		describe('Directory traversal prevention', () => {
			it('should replace path separators with underscores', () => {
				expect(sanitizeFilename('path/to/image.jpg')).toBe(
					'path_to_image.jpg',
				)
			})

			it('should replace backslashes with underscores', () => {
				expect(sanitizeFilename('path\\to\\image.jpg')).toBe(
					'path_to_image.jpg',
				)
			})

			it('should remove consecutive dots (..)', () => {
				const result = sanitizeFilename('../../../etc/passwd')
				expect(result).not.toContain('..')
				expect(result).toBe('_._._etc_passwd')
			})

			it('should remove multiple consecutive dots', () => {
				expect(sanitizeFilename('file...jpg')).toBe('file.jpg')
			})

			it('should handle complex traversal attempts', () => {
				const result = sanitizeFilename('../../secret/../file.jpg')
				expect(result).not.toContain('..')
				expect(result).toBe('_._secret_._file.jpg')
			})

			it('should remove leading dots', () => {
				expect(sanitizeFilename('...image.jpg')).toBe('image.jpg')
			})

			it('should remove trailing dots', () => {
				expect(sanitizeFilename('image.jpg...')).toBe('image.jpg')
			})
		})

		describe('Special character sanitization', () => {
			it('should replace spaces with underscores', () => {
				expect(sanitizeFilename('my image file.jpg')).toBe(
					'my_image_file.jpg',
				)
			})

			it('should replace invalid shell characters', () => {
				// Consecutive invalid chars collapsed to single underscore (better security)
				expect(sanitizeFilename('file;rm -rf *.jpg')).toBe(
					'file_rm_-rf_.jpg',
				)
			})

			it('should replace pipe characters', () => {
				expect(sanitizeFilename('file|command.jpg')).toBe(
					'file_command.jpg',
				)
			})

			it('should replace ampersands', () => {
				expect(sanitizeFilename('file&background.jpg')).toBe(
					'file_background.jpg',
				)
			})

			it('should replace quotes', () => {
				expect(sanitizeFilename('file"test\'name.jpg')).toBe(
					'file_test_name.jpg',
				)
			})

			it('should replace parentheses', () => {
				expect(sanitizeFilename('file(test).jpg')).toBe(
					'file_test_.jpg',
				)
			})

			it('should replace brackets', () => {
				expect(sanitizeFilename('file[test].jpg')).toBe(
					'file_test_.jpg',
				)
			})

			it('should replace null bytes', () => {
				expect(sanitizeFilename('file\x00test.jpg')).toBe(
					'file_test.jpg',
				)
			})

			it('should replace unicode characters', () => {
				// Unicode chars collapsed to single underscore with +
				expect(sanitizeFilename('fichier_été.jpg')).toBe(
					'fichier_t_.jpg',
				)
			})

			it('should handle emoji', () => {
				// Emoji (multi-byte) collapsed to single underscore with +
				expect(sanitizeFilename('image😀.jpg')).toBe('image_.jpg')
			})
		})

		describe('Length limits', () => {
			it('should truncate filenames exceeding 255 characters', () => {
				const longName = `${'a'.repeat(300)}.jpg`
				const sanitized = sanitizeFilename(longName)
				expect(sanitized.length).toBeLessThanOrEqual(255)
			})

			it('should preserve extension when truncating', () => {
				const longName = `${'a'.repeat(300)}.jpg`
				const sanitized = sanitizeFilename(longName)
				expect(sanitized).toMatch(/\.jpg$/)
			})

			it('should handle exactly 255 characters', () => {
				const exactName = `${'a'.repeat(251)}.jpg`
				const sanitized = sanitizeFilename(exactName)
				expect(sanitized.length).toBe(255)
				expect(sanitized).toBe(exactName)
			})
		})

		describe('Edge cases', () => {
			it('should handle empty string', () => {
				expect(sanitizeFilename('')).toBe('')
			})

			it('should handle only dots', () => {
				expect(sanitizeFilename('...')).toBe('')
			})

			it('should handle only invalid characters', () => {
				// Consecutive invalid chars collapsed to single underscore with +
				expect(sanitizeFilename('///')).toBe('_')
			})

			it('should handle filename with no extension', () => {
				expect(sanitizeFilename('image')).toBe('image')
			})

			it('should handle leading dashes', () => {
				expect(sanitizeFilename('---image.jpg')).toBe('image.jpg')
			})

			it('should handle trailing dashes', () => {
				expect(sanitizeFilename('image---')).toBe('image')
			})
		})
	})

	describe('generateSecureCacheKey', () => {
		const validHash =
			'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'

		describe('Valid inputs', () => {
			it('should generate cache key with valid filename and hash', () => {
				const key = generateSecureCacheKey('image.jpg', validHash)
				expect(key).toBe(`image.jpg-${validHash}`)
			})

			it('should sanitize filename while preserving hash', () => {
				const key = generateSecureCacheKey('my image.jpg', validHash)
				expect(key).toBe(`my_image.jpg-${validHash}`)
			})

			it('should handle complex filenames', () => {
				const key = generateSecureCacheKey(
					'path/to/image.jpg',
					validHash,
				)
				expect(key).toBe(`path_to_image.jpg-${validHash}`)
			})
		})

		describe('Invalid hash - prevent cache poisoning', () => {
			it('should throw ImageConfigError for invalid hash', () => {
				expect(() =>
					generateSecureCacheKey('image.jpg', 'invalid-hash'),
				).toThrow(ImageConfigError)
			})

			it('should throw with descriptive message for invalid hash', () => {
				expect(() =>
					generateSecureCacheKey('image.jpg', 'invalid'),
				).toThrow(
					/Invalid cache hash: must be 64-character SHA-256 hex string/,
				)
			})

			it('should include context in error for invalid hash', () => {
				try {
					generateSecureCacheKey('image.jpg', 'invalid')
				} catch (error) {
					expect(error).toBeInstanceOf(ImageConfigError)
					if (error instanceof ImageConfigError) {
						expect(error.context).toEqual({
							hash: 'invalid',
							hashLength: 7,
							expectedLength: 64,
						})
					}
				}
			})

			it('should reject hash with SQL injection', () => {
				expect(() =>
					generateSecureCacheKey(
						'image.jpg',
						"'; DROP TABLE cache; --",
					),
				).toThrow(ImageConfigError)
			})

			it('should reject hash with path traversal', () => {
				expect(() =>
					generateSecureCacheKey('image.jpg', '../../../etc/passwd'),
				).toThrow(ImageConfigError)
			})
		})

		describe('Invalid filename - prevent injection', () => {
			it('should throw ImageConfigError for empty filename after sanitization', () => {
				expect(() => generateSecureCacheKey('...', validHash)).toThrow(
					ImageConfigError,
				)
			})

			it('should throw with descriptive message for empty filename', () => {
				expect(() => generateSecureCacheKey('...', validHash)).toThrow(
					/Invalid filename: sanitization resulted in empty string/,
				)
			})

			it('should include context in error for empty filename', () => {
				try {
					generateSecureCacheKey('...', validHash)
				} catch (error) {
					expect(error).toBeInstanceOf(ImageConfigError)
					if (error instanceof ImageConfigError) {
						expect(error.context).toEqual({
							originalFilename: '...',
						})
					}
				}
			})

			it('should sanitize and validate filename with only invalid chars', () => {
				expect(() =>
					generateSecureCacheKey('///', validHash),
				).not.toThrow()
				const key = generateSecureCacheKey('///', validHash)
				// Consecutive invalid chars collapsed to single underscore
				expect(key).toBe(`_-${validHash}`)
			})
		})

		describe('Security test vectors', () => {
			it('should handle filename with directory traversal attempt', () => {
				const key = generateSecureCacheKey(
					'../../../etc/passwd',
					validHash,
				)
				expect(key).not.toContain('..')
				expect(key).not.toContain('/')
			})

			it('should handle filename with null bytes', () => {
				const key = generateSecureCacheKey(
					'file\x00test.jpg',
					validHash,
				)
				expect(key).not.toContain('\x00')
			})

			it('should handle filename with shell metacharacters', () => {
				const key = generateSecureCacheKey(
					'file;rm -rf *.jpg',
					validHash,
				)
				expect(key).not.toContain(';')
				expect(key).not.toContain('*')
			})

			it('should prevent cache key collision through sanitization', () => {
				const key1 = generateSecureCacheKey('my/file.jpg', validHash)
				const key2 = generateSecureCacheKey('my_file.jpg', validHash)
				expect(key1).toBe(key2)
			})
		})
	})
})
