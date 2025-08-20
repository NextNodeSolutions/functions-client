import { describe, it, expect } from 'vitest'

import * as FunctionsClient from './index.js'
import { cn } from './index.js'

describe('@nextnode/functions-client', () => {
	describe('exports', () => {
		it('should export cn function', () => {
			expect(typeof cn).toBe('function')
			expect(cn).toBeDefined()
		})

		it('should export cn from the main module', () => {
			expect(FunctionsClient.cn).toBeDefined()
			expect(typeof FunctionsClient.cn).toBe('function')
		})

		it('should have the same cn function in named and default exports', () => {
			expect(FunctionsClient.cn).toBe(cn)
		})
	})

	describe('module structure', () => {
		it('should only export expected functions', () => {
			const exports = Object.keys(FunctionsClient)
			expect(exports).toEqual(['cn'])
		})

		it('should not export any unexpected properties', () => {
			const exports = Object.keys(FunctionsClient)
			const expectedExports = ['cn']

			const unexpectedExports = exports.filter(
				exportName => !expectedExports.includes(exportName),
			)

			expect(unexpectedExports).toHaveLength(0)
		})
	})

	describe('integration tests', () => {
		it('should work with imported cn function', () => {
			const result = cn('test-class', 'another-class')
			expect(result).toBe('test-class another-class')
		})

		it('should work with module cn function', () => {
			const result = FunctionsClient.cn('test-class', 'another-class')
			expect(result).toBe('test-class another-class')
		})

		it('should handle real-world className merging scenarios', () => {
			const baseButton = 'px-4 py-2 font-medium rounded transition-colors'
			const primaryVariant = 'bg-blue-600 text-white hover:bg-blue-700'
			const userClasses = 'mb-4 lg:mb-6'

			const result = cn(baseButton, primaryVariant, userClasses)

			expect(result).toContain('px-4')
			expect(result).toContain('py-2')
			expect(result).toContain('bg-blue-600')
			expect(result).toContain('mb-4')
			expect(result).toContain('lg:mb-6')
		})

		it('should be compatible with different import styles', () => {
			// Test that both import styles work identically
			const classes = [
				'class1',
				'class2',
				{ class3: true, class4: false },
			]

			const result1 = cn(...classes)
			const result2 = FunctionsClient.cn(...classes)

			expect(result1).toBe(result2)
			expect(result1).toBe('class1 class2 class3')
		})
	})

	describe('TypeScript compatibility', () => {
		it('should accept string inputs', () => {
			const result = cn('string-class')
			expect(typeof result).toBe('string')
		})

		it('should accept array inputs', () => {
			const result = cn(['array-class1', 'array-class2'])
			expect(typeof result).toBe('string')
		})

		it('should accept object inputs', () => {
			const result = cn({ 'object-class': true })
			expect(typeof result).toBe('string')
		})

		it('should accept mixed inputs', () => {
			const isConditional = false
			const result = cn(
				'string-class',
				['array-class'],
				{ 'object-class': true },
				null,
				undefined,
				isConditional && 'conditional-class',
			)
			expect(typeof result).toBe('string')
		})
	})

	describe('library compatibility', () => {
		it('should work in different JavaScript environments', () => {
			// Test that the function works without throwing errors
			expect(() => {
				cn('test')
			}).not.toThrow()
		})

		it('should return consistent results', () => {
			const inputs = ['class1', 'class2', { class3: true }]

			// Multiple calls should return the same result
			const result1 = cn(...inputs)
			const result2 = cn(...inputs)
			const result3 = cn(...inputs)

			expect(result1).toBe(result2)
			expect(result2).toBe(result3)
		})

		it('should be immutable', () => {
			const originalArray = ['class1', 'class2']
			const originalObject = { class3: true, class4: false }

			cn(originalArray, originalObject)

			// Original inputs should not be modified
			expect(originalArray).toEqual(['class1', 'class2'])
			expect(originalObject).toEqual({ class3: true, class4: false })
		})
	})
})
