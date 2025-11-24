/**
 * LQIP (Low Quality Image Placeholder) generation utilities
 * Implements 2025 best practices for blur placeholders
 */

import type { LQIPConfig } from '../types.js'

/**
 * Default LQIP configuration
 * - 20x20px dimensions (5-10 KB)
 * - Quality 10 (heavily compressed)
 * - Blur 10 (CSS blur filter)
 * - WebP format (better compression)
 */
export const DEFAULT_LQIP_CONFIG: LQIPConfig = {
	enabled: true,
	width: 20,
	height: 20,
	quality: 10,
	blur: 10,
	format: 'webp',
}

/**
 * Calculate LQIP dimensions maintaining aspect ratio
 */
export function calculateLQIPDimensions(
	originalWidth: number,
	originalHeight: number,
	maxDimension = 20,
): { width: number; height: number } {
	const aspectRatio = originalWidth / originalHeight

	if (originalWidth > originalHeight) {
		return {
			width: maxDimension,
			height: Math.round(maxDimension / aspectRatio),
		}
	}

	return {
		width: Math.round(maxDimension * aspectRatio),
		height: maxDimension,
	}
}

/**
 * Encode buffer to Base64 data URI
 */
export function encodeToDataURI(
	buffer: Buffer,
	format: 'webp' | 'jpeg',
): string {
	const base64 = buffer.toString('base64')
	const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg'
	return `data:${mimeType};base64,${base64}`
}

/**
 * Generate CSS blur filter value
 */
export function getBlurFilterCSS(blurAmount: number): string {
	return `blur(${blurAmount}px)`
}

/**
 * Generate inline styles for LQIP
 * Includes blur filter and smooth transition
 */
export function getLQIPStyles(config: LQIPConfig): Record<string, string> {
	return {
		filter: getBlurFilterCSS(config.blur),
		transition: 'filter 0.3s ease-in-out',
		willChange: 'filter',
	}
}

/**
 * Generate CSS-only LQIP integer encoding (2025 technique)
 * Packs color data into a single integer for minimal payload
 *
 * This is an advanced technique that encodes dominant colors
 * into an integer that can be decoded purely with CSS
 *
 * @experimental
 */
export function encodeLQIPInteger(colors: {
	r: number
	g: number
	b: number
}): number {
	// Pack RGB into 24-bit integer
	// Format: 0xRRGGBB
	return (colors.r << 16) | (colors.g << 8) | colors.b
}

/**
 * Decode LQIP integer back to RGB
 *
 * @experimental
 */
export function decodeLQIPInteger(encoded: number): {
	r: number
	g: number
	b: number
} {
	return {
		r: (encoded >> 16) & 0xff,
		g: (encoded >> 8) & 0xff,
		b: encoded & 0xff,
	}
}

/**
 * Calculate dominant color from image data (simplified)
 * In production, this should use a proper color extraction algorithm
 *
 * @param imageData RGB pixel data
 * @returns Dominant color as RGB object
 */
export function calculateDominantColor(imageData: Uint8ClampedArray): {
	r: number
	g: number
	b: number
} {
	let r = 0
	let g = 0
	let b = 0
	const pixelCount = imageData.length / 4

	// Calculate average color (simple dominant color approximation)
	for (let i = 0; i < imageData.length; i += 4) {
		r += imageData[i]
		g += imageData[i + 1]
		b += imageData[i + 2]
	}

	return {
		r: Math.round(r / pixelCount),
		g: Math.round(g / pixelCount),
		b: Math.round(b / pixelCount),
	}
}

/**
 * Merge custom LQIP config with defaults
 */
export function mergeLQIPConfig(custom?: Partial<LQIPConfig>): LQIPConfig {
	return {
		...DEFAULT_LQIP_CONFIG,
		...custom,
	}
}

/**
 * Generate LQIP placeholder HTML with inline styles
 */
export function generateLQIPHTML(
	dataURI: string,
	alt: string,
	config: LQIPConfig,
): string {
	const styles = getLQIPStyles(config)
	const styleString = Object.entries(styles)
		.map(([key, value]) => `${key}: ${value}`)
		.join('; ')

	return `<img src="${dataURI}" alt="${alt}" style="${styleString}" class="lqip-placeholder" />`
}

/**
 * CSS classes for LQIP implementation
 * Use these with your CSS framework
 */
export const LQIP_CSS_CLASSES = {
	/** Placeholder image (blurred) */
	placeholder: 'lqip-placeholder',
	/** Container that holds both placeholder and full image */
	container: 'lqip-container',
	/** Full quality image (initially hidden) */
	fullImage: 'lqip-full',
	/** State class when full image is loaded */
	loaded: 'lqip-loaded',
} as const

/**
 * Generate complete LQIP CSS
 * Includes smooth transition from blur to sharp
 */
export function generateLQIPCSS(): string {
	return `
.${LQIP_CSS_CLASSES.container} {
  position: relative;
  overflow: hidden;
}

.${LQIP_CSS_CLASSES.placeholder} {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(10px);
  transition: opacity 0.3s ease-in-out;
}

.${LQIP_CSS_CLASSES.fullImage} {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.${LQIP_CSS_CLASSES.container}.${LQIP_CSS_CLASSES.loaded} .${LQIP_CSS_CLASSES.placeholder} {
  opacity: 0;
}

.${LQIP_CSS_CLASSES.container}.${LQIP_CSS_CLASSES.loaded} .${LQIP_CSS_CLASSES.fullImage} {
  opacity: 1;
}
`.trim()
}
