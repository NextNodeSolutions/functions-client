/**
 * Simple hello function
 */

export function hello(name?: string): string {
	return `Hello, ${name || 'World'}!`
}
