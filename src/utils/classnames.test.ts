import { describe, it, expect } from 'vitest'

import { cn } from './classnames.js'

describe('cn', () => {
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
		expect(cn(['class1', 'class2'], { class3: true, class4: false })).toBe(
			'class1 class2 class3',
		)
	})
})
