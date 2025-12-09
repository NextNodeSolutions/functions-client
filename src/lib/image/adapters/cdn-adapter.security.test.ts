/**
 * Security tests for CDN adapter URL sanitization
 * Tests 100% coverage of critical security functions
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { ImageSecurityError } from '../errors.js'
import { CDNImageAdapter } from './cdn-adapter.js'

describe('CDN Adapter Security', () => {
	let adapter: CDNImageAdapter

	beforeEach(() => {
		adapter = new CDNImageAdapter({
			provider: 'cloudflare',
			baseUrl: 'https://cdn.example.com',
		})
	})

	describe('Path Traversal Prevention', () => {
		it('should reject source with ../ (Unix path traversal)', async () => {
			await expect(
				adapter.optimize('../../../etc/passwd', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should reject source with multiple ../ sequences', async () => {
			await expect(
				adapter.optimize('images/../../../secret/file.jpg', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should reject source with ..\\ (Windows path traversal)', async () => {
			await expect(
				adapter.optimize('..\\..\\..\\windows\\system32\\config.jpg', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should reject mixed path separators', async () => {
			await expect(
				adapter.optimize('../secret\\..\\file.jpg', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should include reason in error context', async () => {
			try {
				await adapter.optimize('../../../etc/passwd', {
					width: 800,
					height: 600,
				})
			} catch (error) {
				expect(error).toBeInstanceOf(ImageSecurityError)
				if (error instanceof ImageSecurityError) {
					expect(error.context?.reason).toBe('directory_traversal')
					expect(error.context?.source).toBe('../../../etc/passwd')
				}
			}
		})

		it('should provide descriptive error message', async () => {
			await expect(
				adapter.optimize('../secret.jpg', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(/Path traversal detected in image source/)
		})
	})

	describe('Absolute Path Prevention', () => {
		it('should reject source starting with /', async () => {
			await expect(
				adapter.optimize('/etc/passwd', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should reject source with //', async () => {
			await expect(
				adapter.optimize('//evil.com/malware.jpg', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should include reason in error context for absolute paths', async () => {
			try {
				await adapter.optimize('/etc/passwd', {
					width: 800,
					height: 600,
				})
			} catch (error) {
				expect(error).toBeInstanceOf(ImageSecurityError)
				if (error instanceof ImageSecurityError) {
					expect(error.context?.reason).toBe('absolute_path')
					expect(error.context?.source).toBe('/etc/passwd')
				}
			}
		})

		it('should provide descriptive error message for absolute paths', async () => {
			await expect(
				adapter.optimize('/absolute/path.jpg', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(/Absolute paths not allowed, use relative paths/)
		})
	})

	describe('File Extension Validation', () => {
		it('should reject source without valid image extension', async () => {
			await expect(
				adapter.optimize('malicious.exe', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should reject source with .txt extension', async () => {
			await expect(
				adapter.optimize('file.txt', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should reject source with .php extension', async () => {
			await expect(
				adapter.optimize('shell.php', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should reject source with .js extension', async () => {
			await expect(
				adapter.optimize('malware.js', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should reject source with no extension', async () => {
			await expect(
				adapter.optimize('image', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should include reason in error context for invalid extensions', async () => {
			try {
				await adapter.optimize('malicious.exe', {
					width: 800,
					height: 600,
				})
			} catch (error) {
				expect(error).toBeInstanceOf(ImageSecurityError)
				if (error instanceof ImageSecurityError) {
					expect(error.context?.reason).toBe('invalid_extension')
					expect(error.context?.source).toBe('malicious.exe')
				}
			}
		})

		it('should provide descriptive error message for invalid extensions', async () => {
			await expect(
				adapter.optimize('file.pdf', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(
				/Invalid image source: must have valid image extension/,
			)
		})
	})

	describe('Valid Image Extensions', () => {
		it('should accept .jpg extension', async () => {
			const result = await adapter.optimize('image.jpg', {
				width: 800,
				height: 600,
			})
			expect(result.src).toBeDefined()
		})

		it('should accept .jpeg extension', async () => {
			const result = await adapter.optimize('image.jpeg', {
				width: 800,
				height: 600,
			})
			expect(result.src).toBeDefined()
		})

		it('should accept .png extension', async () => {
			const result = await adapter.optimize('image.png', {
				width: 800,
				height: 600,
			})
			expect(result.src).toBeDefined()
		})

		it('should accept .webp extension', async () => {
			const result = await adapter.optimize('image.webp', {
				width: 800,
				height: 600,
			})
			expect(result.src).toBeDefined()
		})

		it('should accept .avif extension', async () => {
			const result = await adapter.optimize('image.avif', {
				width: 800,
				height: 600,
			})
			expect(result.src).toBeDefined()
		})

		it('should accept .gif extension', async () => {
			const result = await adapter.optimize('image.gif', {
				width: 800,
				height: 600,
			})
			expect(result.src).toBeDefined()
		})

		it('should accept .svg extension', async () => {
			const result = await adapter.optimize('icon.svg', {
				width: 800,
				height: 600,
			})
			expect(result.src).toBeDefined()
		})

		it('should be case-insensitive for extensions', async () => {
			const result = await adapter.optimize('image.JPG', {
				width: 800,
				height: 600,
			})
			expect(result.src).toBeDefined()
		})

		it('should accept uppercase extensions', async () => {
			const result = await adapter.optimize('image.PNG', {
				width: 800,
				height: 600,
			})
			expect(result.src).toBeDefined()
		})
	})

	describe('URI Encoding', () => {
		it('should encode special characters in source', async () => {
			const result = await adapter.optimize('my image.jpg', {
				width: 800,
				height: 600,
			})
			expect(result.src).toContain('my%20image.jpg')
		})

		it('should encode ampersands', async () => {
			const result = await adapter.optimize('image&test.jpg', {
				width: 800,
				height: 600,
			})
			expect(result.src).toContain('%26')
		})

		it('should encode quotes', async () => {
			const result = await adapter.optimize('image"test.jpg', {
				width: 800,
				height: 600,
			})
			expect(result.src).toContain('%22')
		})

		it('should encode less-than and greater-than', async () => {
			const result = await adapter.optimize('image<test>.jpg', {
				width: 800,
				height: 600,
			})
			expect(result.src).toContain('%3C')
			expect(result.src).toContain('%3E')
		})
	})

	describe('LQIP Generation Security', () => {
		it('should apply same security checks for LQIP', async () => {
			await expect(
				adapter.generateLQIP('../../../etc/passwd'),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should reject absolute paths in LQIP', async () => {
			await expect(adapter.generateLQIP('/etc/passwd')).rejects.toThrow(
				ImageSecurityError,
			)
		})

		it('should reject invalid extensions in LQIP', async () => {
			await expect(adapter.generateLQIP('malware.exe')).rejects.toThrow(
				ImageSecurityError,
			)
		})

		it('should generate valid LQIP URL for safe input', async () => {
			const lqip = await adapter.generateLQIP('image.jpg')
			expect(lqip).toBeDefined()
			expect(lqip).toContain('image.jpg')
		})
	})

	describe('Different CDN Providers', () => {
		it('should apply security checks for Cloudflare', async () => {
			const cf = new CDNImageAdapter({
				provider: 'cloudflare',
				baseUrl: 'https://cdn.example.com',
			})
			await expect(
				cf.optimize('../secret.jpg', { width: 800 }),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should apply security checks for Imgix', async () => {
			const imgix = new CDNImageAdapter({
				provider: 'imgix',
				baseUrl: 'https://example.imgix.net',
			})
			await expect(
				imgix.optimize('../secret.jpg', { width: 800 }),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should apply security checks for Cloudinary', async () => {
			const cloudinary = new CDNImageAdapter({
				provider: 'cloudinary',
				baseUrl: 'https://res.cloudinary.com',
			})
			await expect(
				cloudinary.optimize('../secret.jpg', { width: 800 }),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should apply security checks for Generic CDN', async () => {
			const generic = new CDNImageAdapter({
				provider: 'generic',
				baseUrl: 'https://cdn.custom.com',
			})
			await expect(
				generic.optimize('../secret.jpg', { width: 800 }),
			).rejects.toThrow(ImageSecurityError)
		})
	})

	describe('Attack Vectors', () => {
		it('should prevent null byte injection', async () => {
			await expect(
				adapter.optimize('image.jpg\x00.exe', {
					width: 800,
					height: 600,
				}),
			).rejects.toThrow(ImageSecurityError)
		})

		it('should encode protocol-like strings safely', async () => {
			const result = await adapter.optimize('javascript:alert(1).jpg', {
				width: 800,
				height: 600,
			})
			expect(result.src).toContain('javascript%3Aalert(1).jpg')
			expect(result.src).not.toContain('javascript:')
		})

		it('should encode data URI-like strings safely', async () => {
			const result = await adapter.optimize(
				'data:text/html,<script>alert(1)</script>.jpg',
				{
					width: 800,
					height: 600,
				},
			)
			expect(result.src).toContain('%3A')
			expect(result.src).toContain('%2C')
			expect(result.src).not.toContain('data:text/html')
		})

		it('should handle double extension filenames', async () => {
			const result = await adapter.optimize('image.php.jpg', {
				width: 800,
				height: 600,
			})
			expect(result.src).toContain('image.php.jpg')
		})
	})
})
