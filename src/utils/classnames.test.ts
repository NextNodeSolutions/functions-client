import { describe, it, expect } from 'vitest'

import { cn } from './classnames.js'

describe('cn', () => {
	describe('basic functionality', () => {
		it('should merge class names correctly', () => {
			expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3')
		})

		it('should handle conditional classes', () => {
			const isVisible = true
			const isHidden = false
			expect(
				cn('base', isVisible && 'conditional', isHidden && 'hidden'),
			).toBe('base conditional')
		})

		it('should handle empty inputs', () => {
			expect(cn()).toBe('')
		})

		it('should handle arrays and objects', () => {
			expect(
				cn(['class1', 'class2'], { class3: true, class4: false }),
			).toBe('class1 class2 class3')
		})
	})

	describe('tailwind conflict resolution', () => {
		it('should resolve margin conflicts', () => {
			expect(cn('m-2 m-4')).toBe('m-4')
			expect(cn('mx-2 mx-4 my-1')).toBe('mx-4 my-1')
			expect(cn('ml-2 mr-2 mx-4')).toBe('mx-4')
		})

		it('should resolve padding conflicts', () => {
			expect(cn('p-2 p-4')).toBe('p-4')
			expect(cn('px-2 px-4 py-1')).toBe('px-4 py-1')
			expect(cn('pl-2 pr-2 px-4')).toBe('px-4')
		})

		it('should resolve background color conflicts', () => {
			expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500')
			expect(cn('bg-red-500/50 bg-blue-500/75')).toBe('bg-blue-500/75')
		})

		it('should resolve text size conflicts', () => {
			expect(cn('text-sm text-lg text-xl')).toBe('text-xl')
		})

		it('should resolve display conflicts', () => {
			expect(cn('block inline flex')).toBe('flex')
			expect(cn('hidden block')).toBe('block')
		})

		it('should resolve position conflicts', () => {
			expect(cn('static relative absolute fixed')).toBe('fixed')
		})

		it('should resolve border radius conflicts', () => {
			expect(cn('rounded rounded-lg rounded-full')).toBe('rounded-full')
			expect(cn('rounded-t rounded-tl-lg')).toBe(
				'rounded-t rounded-tl-lg',
			)
		})
	})

	describe('complex input combinations', () => {
		it('should handle mixed arrays, objects, and strings', () => {
			expect(
				cn(
					'base-class',
					['array-class1', 'array-class2'],
					{ 'object-class': true, 'false-class': false },
					'string-class',
				),
			).toBe(
				'base-class array-class1 array-class2 object-class string-class',
			)
		})

		it('should handle nested arrays', () => {
			expect(cn(['outer1', ['nested1', 'nested2'], 'outer2'])).toBe(
				'outer1 nested1 nested2 outer2',
			)
		})

		it('should handle complex conditional logic', () => {
			const variant = 'primary'
			const size = 'lg'
			const disabled = false
			const loading = true

			expect(
				cn(
					'btn',
					variant === 'primary' && 'btn-primary',
					variant === 'secondary' && 'btn-secondary',
					size === 'sm' && 'btn-sm',
					size === 'lg' && 'btn-lg',
					disabled && 'btn-disabled',
					loading && 'btn-loading',
				),
			).toBe('btn btn-primary btn-lg btn-loading')
		})
	})

	describe('edge cases', () => {
		it('should handle null and undefined values', () => {
			expect(cn('class1', null, 'class2', undefined, 'class3')).toBe(
				'class1 class2 class3',
			)
		})

		it('should handle empty strings', () => {
			expect(cn('class1', '', 'class2', '   ', 'class3')).toBe(
				'class1 class2 class3',
			)
		})

		it('should handle boolean values', () => {
			expect(cn('class1', true, false, 'class2')).toBe('class1 class2')
		})

		it('should handle numbers', () => {
			expect(cn('class1', 0, 1, 'class2')).toBe('class1 1 class2')
		})

		it('should handle very long class lists', () => {
			const manyClasses = Array.from(
				{ length: 100 },
				(_, i) => `class${i}`,
			)
			const result = cn(...manyClasses)
			expect(result).toBe(manyClasses.join(' '))
		})

		it('should handle duplicate classes', () => {
			// Note: cn function doesn't deduplicate arbitrary classes, only Tailwind conflicts
			expect(cn('class1 class2 class1 class3 class2')).toBe(
				'class1 class2 class1 class3 class2',
			)
		})
	})

	describe('real-world usage patterns', () => {
		it('should handle button component variants', () => {
			const buttonClass = cn(
				'inline-flex items-center justify-center rounded-md font-medium transition-colors',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
				'disabled:opacity-50 disabled:pointer-events-none',
				'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
				'h-10 px-4',
			)

			expect(buttonClass).toContain('inline-flex')
			expect(buttonClass).toContain('bg-blue-600')
			expect(buttonClass).toContain('h-10')
		})

		it('should handle card component with conditional states', () => {
			const isHovered = true
			const isSelected = false
			const variant = 'elevated'

			const cardClass = cn(
				'bg-white rounded-lg border transition-all duration-200',
				variant === 'default' && 'shadow-sm',
				variant === 'elevated' && 'shadow-lg',
				variant === 'outlined' && 'border-gray-300',
				isHovered && 'shadow-xl transform scale-105',
				isSelected && 'ring-2 ring-blue-500',
			)

			// shadow-lg is overridden by shadow-xl due to Tailwind conflict resolution
			expect(cardClass).toContain('shadow-xl')
			expect(cardClass).not.toContain('shadow-lg')
			expect(cardClass).not.toContain('ring-2')
		})

		it('should handle responsive classes', () => {
			const responsiveClass = cn(
				'text-sm sm:text-base md:text-lg lg:text-xl',
				'p-2 sm:p-4 md:p-6 lg:p-8',
				'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
			)

			expect(responsiveClass).toContain('text-sm')
			expect(responsiveClass).toContain('sm:text-base')
			expect(responsiveClass).toContain('lg:grid-cols-3')
		})

		it('should handle state-based input styling', () => {
			const hasError = true
			const isFocused = false

			const inputClass = cn(
				'w-full px-3 py-2 border rounded-md transition-colors',
				'focus:outline-none focus:ring-2 focus:ring-offset-2',
				hasError
					? 'border-red-500 focus:border-red-500 focus:ring-red-500'
					: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
				isFocused && 'ring-2',
			)

			expect(inputClass).toContain('border-red-500')
			expect(inputClass).toContain('focus:ring-red-500')
			// focus:ring-2 is included from the base styles, ring-2 is not added due to isFocused being false
			expect(inputClass).toContain('focus:ring-2')
		})
	})

	describe('performance', () => {
		it('should handle large number of class inputs efficiently', () => {
			const start = performance.now()
			const classes = Array.from({ length: 1000 }, (_, i) => `class-${i}`)
			const result = cn(...classes)
			const end = performance.now()

			expect(result).toBeDefined()
			expect(end - start).toBeLessThan(10) // Should complete in less than 10ms
		})

		it('should handle repeated calls efficiently', () => {
			const commonClasses = 'px-4 py-2 bg-blue-500 text-white rounded'
			const start = performance.now()

			for (let i = 0; i < 1000; i++) {
				cn(commonClasses, `dynamic-${i}`)
			}

			const end = performance.now()
			expect(end - start).toBeLessThan(50) // Should complete 1000 calls in less than 50ms
		})
	})
})
