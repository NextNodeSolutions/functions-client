/**
 * Security tests for LQIP HTML generation
 * Tests XSS prevention using DOM API
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from 'vitest'

import type { LQIPConfig } from '../types.js'
import { generateLQIPElement, getLQIPStyles } from './lqip.js'

describe('LQIP Security - XSS Prevention', () => {
	let defaultConfig: LQIPConfig

	beforeEach(() => {
		defaultConfig = {
			enabled: true,
			width: 20,
			height: 20,
			quality: 20,
			format: 'webp',
			blur: 10,
		}
	})

	describe('generateLQIPElement - DOM API XSS Prevention', () => {
		describe('XSS Attack Vectors in dataURI', () => {
			it('should prevent XSS through script injection in dataURI', () => {
				const xssDataURI =
					'data:text/html,<script>alert("XSS")</script>'
				const element = generateLQIPElement(
					xssDataURI,
					'Test',
					defaultConfig,
				)

				expect(element.src).toBe(xssDataURI)
				expect(element.outerHTML).not.toContain('<script>')
			})

			it('should prevent javascript: protocol injection', () => {
				const xssDataURI = 'javascript:alert("XSS")'
				const element = generateLQIPElement(
					xssDataURI,
					'Test',
					defaultConfig,
				)

				expect(element.src).toBe(xssDataURI)
				expect(element.outerHTML).not.toContain('javascript:alert')
			})

			it('should prevent data URI with embedded HTML', () => {
				const xssDataURI =
					'data:text/html,<img src=x onerror=alert("XSS")>'
				const element = generateLQIPElement(
					xssDataURI,
					'Test',
					defaultConfig,
				)

				expect(element.src).toBe(xssDataURI)
				expect(element.outerHTML).not.toContain('onerror')
			})

			it('should handle dataURI with encoded script tags', () => {
				const xssDataURI =
					'data:text/html,%3Cscript%3Ealert(1)%3C/script%3E'
				const element = generateLQIPElement(
					xssDataURI,
					'Test',
					defaultConfig,
				)

				expect(element.src).toBe(xssDataURI)
			})
		})

		describe('XSS Attack Vectors in alt text', () => {
			it('should prevent XSS through alt text with script tags', () => {
				const xssAlt = '<script>alert("XSS")</script>'
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					xssAlt,
					defaultConfig,
				)

				expect(element.alt).toBe(xssAlt)
				expect(element.outerHTML).toContain(
					'alt="&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"',
				)
			})

			it('should prevent XSS through alt text with event handlers', () => {
				const xssAlt = '" onerror="alert(\'XSS\')'
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					xssAlt,
					defaultConfig,
				)

				expect(element.alt).toBe(xssAlt)
				expect(element.outerHTML).not.toContain('onerror=')
			})

			it('should prevent XSS through alt text with HTML entities', () => {
				const xssAlt = '"><img src=x onerror=alert(1)>'
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					xssAlt,
					defaultConfig,
				)

				expect(element.alt).toBe(xssAlt)
				expect(element.outerHTML).toContain('&gt;')
			})

			it('should handle alt text with quotes properly', () => {
				const xssAlt = 'Test"alert(1)"'
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					xssAlt,
					defaultConfig,
				)

				expect(element.alt).toBe(xssAlt)
				expect(element.outerHTML).toContain('&quot;')
			})
		})

		describe('DOM API Usage Validation', () => {
			it('should use createElement instead of string concatenation', () => {
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'Test',
					defaultConfig,
				)

				expect(element).toBeInstanceOf(HTMLImageElement)
				expect(element.tagName).toBe('IMG')
			})

			it('should use property assignment which browser auto-sanitizes', () => {
				const xssDataURI = '<script>alert(1)</script>'
				const xssAlt = '<script>alert(2)</script>'
				const element = generateLQIPElement(
					xssDataURI,
					xssAlt,
					defaultConfig,
				)

				expect(element.alt).toBe(xssAlt)
				expect(element.tagName).toBe('IMG')
			})

			it('should use setProperty for styles', () => {
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'Test',
					defaultConfig,
				)

				expect(element.style.filter).toBe('blur(10px)')
				expect(element.style.transition).toBe('filter 0.3s ease-in-out')
			})
		})

		describe('Style Injection Prevention', () => {
			it('should prevent CSS injection through blur value', () => {
				const xssConfig: LQIPConfig = {
					...defaultConfig,
					blur: 10,
				}
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'Test',
					xssConfig,
				)

				expect(element.style.filter).toBe('blur(10px)')
			})

			it('should handle blur as number safely', () => {
				const configWithBlur: LQIPConfig = {
					...defaultConfig,
					blur: 999,
				}
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'Test',
					configWithBlur,
				)

				expect(element.style.filter).toBe('blur(999px)')
			})

			it('should prevent style injection through className', () => {
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'Test',
					defaultConfig,
				)

				expect(element.className).toBe('lqip-placeholder')
				expect(element.outerHTML).not.toContain('<style>')
			})
		})

		describe('Attribute Injection Prevention', () => {
			it('should only set safe attributes', () => {
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'Test',
					defaultConfig,
				)

				expect(element.src).toBeDefined()
				expect(element.alt).toBeDefined()
				expect(element.className).toBe('lqip-placeholder')
				expect(element.loading).toBe('lazy')
			})

			it('should not include onclick or other event handlers', () => {
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'Test',
					defaultConfig,
				)

				expect(element.outerHTML).not.toContain('onclick')
				expect(element.outerHTML).not.toContain('onerror')
				expect(element.outerHTML).not.toContain('onload')
			})

			it('should handle special characters safely in alt attribute', () => {
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'<>"&',
					defaultConfig,
				)

				expect(element.alt).toBe('<>"&')
				expect(element.src).toBe('data:image/png;base64,test')
				expect(element.tagName).toBe('IMG')
			})
		})

		describe('Complex Attack Scenarios', () => {
			it('should handle polyglot XSS safely (browser normalizes dangerous chars)', () => {
				const polyglotXSS =
					'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//'
				const element = generateLQIPElement(
					polyglotXSS,
					'Test',
					defaultConfig,
				)

				expect(element.tagName).toBe('IMG')
				expect(element.src).toContain('%60')
				expect(element.src).toContain('%22')
			})

			it('should prevent DOM clobbering', () => {
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'Test',
					{
						...defaultConfig,
						blur: 10,
					},
				)

				expect(element.id).toBe('')
				expect(element.name).toBe('')
			})

			it('should prevent prototype pollution through config', () => {
				const maliciousConfig = {
					...defaultConfig,
					__proto__: { polluted: true },
				} as unknown as LQIPConfig

				const element = generateLQIPElement(
					'data:image/png;base64,test',
					'Test',
					maliciousConfig,
				)

				expect(element).toBeDefined()
				expect(element.outerHTML).not.toContain('polluted')
			})
		})

		describe('Safe Content Handling', () => {
			it('should handle normal dataURI safely', () => {
				const validDataURI =
					'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
				const element = generateLQIPElement(
					validDataURI,
					'Test Image',
					defaultConfig,
				)

				expect(element.src).toBe(validDataURI)
				expect(element.alt).toBe('Test Image')
			})

			it('should handle special characters in alt text safely', () => {
				const safeAlt =
					'Image with "quotes" and \'apostrophes\' & ampersands'
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					safeAlt,
					defaultConfig,
				)

				expect(element.alt).toBe(safeAlt)
			})

			it('should handle Unicode in alt text safely', () => {
				const unicodeAlt = 'Image émoji 🎨 中文'
				const element = generateLQIPElement(
					'data:image/png;base64,test',
					unicodeAlt,
					defaultConfig,
				)

				expect(element.alt).toBe(unicodeAlt)
			})
		})
	})

	describe('getLQIPStyles - Safe Style Generation', () => {
		it('should generate safe filter style with blur', () => {
			const styles = getLQIPStyles({ ...defaultConfig, blur: 15 })
			expect(styles.filter).toBe('blur(15px)')
		})

		it('should generate safe filter style without blur', () => {
			const styles = getLQIPStyles({ ...defaultConfig, blur: 0 })
			expect(styles.filter).toBe('blur(0px)')
		})

		it('should not allow style injection through blur value', () => {
			const styles = getLQIPStyles({ ...defaultConfig, blur: 10 })
			expect(styles.filter).toBe('blur(10px)')
			expect(styles.filter).not.toContain(';')
			expect(styles.filter).not.toContain('{')
		})

		it('should return consistent transition property', () => {
			const styles = getLQIPStyles(defaultConfig)
			expect(styles.transition).toBe('filter 0.3s ease-in-out')
		})

		it('should return willChange: filter', () => {
			const styles = getLQIPStyles(defaultConfig)
			expect(styles.willChange).toBe('filter')
		})

		it('should only return safe CSS properties', () => {
			const styles = getLQIPStyles(defaultConfig)
			const allowedProps = ['filter', 'transition', 'willChange']
			const actualProps = Object.keys(styles)

			for (const prop of actualProps) {
				expect(allowedProps).toContain(prop)
			}
		})
	})

	describe('Integration - Full XSS Prevention', () => {
		it('should treat all XSS vectors as literal strings (DOM API safety)', () => {
			const xssDataURI = 'javascript:alert(1)'
			const xssAlt = '<script>alert(2)</script>'
			const xssConfig: LQIPConfig = {
				...defaultConfig,
				blur: 10,
			}

			const element = generateLQIPElement(xssDataURI, xssAlt, xssConfig)

			expect(element.src).toBe(xssDataURI)
			expect(element.alt).toBe(xssAlt)
			expect(element.tagName).toBe('IMG')
			expect(element.className).toBe('lqip-placeholder')
		})

		it('should produce valid HTML element', () => {
			const element = generateLQIPElement(
				'data:image/png;base64,test',
				'Test',
				defaultConfig,
			)

			expect(element.tagName).toBe('IMG')
			expect(element.src).toBeTruthy()
			expect(element.alt).toBeTruthy()
			expect(element.className).toBe('lqip-placeholder')
		})
	})
})
