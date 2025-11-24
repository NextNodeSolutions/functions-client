/**
 * Image format detection and validation utilities
 */

import type {
	ImageFormat,
	ImageValidationConfig,
	ImageValidationResult,
} from '../types.js'

/**
 * MIME type to format mapping
 */
const MIME_TYPE_MAP: Record<string, ImageFormat> = {
	'image/svg+xml': 'svg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/avif': 'avif',
	'image/jpeg': 'jpeg',
	'image/jpg': 'jpg',
}

/**
 * File extension to format mapping
 */
const EXTENSION_MAP: Record<string, ImageFormat> = {
	'.svg': 'svg',
	'.png': 'png',
	'.webp': 'webp',
	'.avif': 'avif',
	'.jpeg': 'jpeg',
	'.jpg': 'jpg',
}

/**
 * Detect image format from file path or MIME type
 */
export function detectImageFormat(
	source: string,
	mimeType?: string,
): ImageFormat | null {
	// Try MIME type first
	if (mimeType && MIME_TYPE_MAP[mimeType]) {
		return MIME_TYPE_MAP[mimeType]
	}

	// Try file extension
	const extension = source
		.toLowerCase()
		.match(/\.(svg|png|webp|avif|jpe?g)$/)?.[0]

	if (extension && EXTENSION_MAP[extension]) {
		return EXTENSION_MAP[extension]
	}

	return null
}

/**
 * Check if format is a vector format (no raster processing needed)
 */
export function isVectorFormat(format: ImageFormat): boolean {
	return format === 'svg'
}

/**
 * Check if format supports transparency
 */
export function supportsTransparency(format: ImageFormat): boolean {
	return ['png', 'webp', 'avif', 'svg'].includes(format)
}

/**
 * Get recommended format based on image characteristics
 */
export function getRecommendedFormat(options: {
	hasTransparency?: boolean
	isPhoto?: boolean
	isIcon?: boolean
}): ImageFormat {
	const { hasTransparency, isPhoto, isIcon } = options

	// Icons should use SVG if possible, PNG otherwise
	if (isIcon) {
		return hasTransparency ? 'png' : 'webp'
	}

	// Photos benefit from AVIF/WebP
	if (isPhoto) {
		return 'avif' // Best compression for photos
	}

	// Transparency required
	if (hasTransparency) {
		return 'webp' // Good balance of size and compatibility
	}

	// Default to WebP for general use
	return 'webp'
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
	width: number,
	height: number,
	config: ImageValidationConfig,
): ImageValidationResult {
	const errors: string[] = []

	if (config.maxWidth && width > config.maxWidth) {
		errors.push(`Width ${width}px exceeds maximum ${config.maxWidth}px`)
	}

	if (config.maxHeight && height > config.maxHeight) {
		errors.push(`Height ${height}px exceeds maximum ${config.maxHeight}px`)
	}

	if (config.minWidth && width < config.minWidth) {
		errors.push(`Width ${width}px is below minimum ${config.minWidth}px`)
	}

	if (config.minHeight && height < config.minHeight) {
		errors.push(`Height ${height}px is below minimum ${config.minHeight}px`)
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Validate image file size
 */
export function validateImageSize(
	sizeInBytes: number,
	config: ImageValidationConfig,
): ImageValidationResult {
	const errors: string[] = []

	if (config.maxFileSize && sizeInBytes > config.maxFileSize) {
		const maxSizeMB = (config.maxFileSize / 1024 / 1024).toFixed(2)
		const actualSizeMB = (sizeInBytes / 1024 / 1024).toFixed(2)
		errors.push(
			`File size ${actualSizeMB}MB exceeds maximum ${maxSizeMB}MB`,
		)
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Validate image format
 */
export function validateImageFormat(
	format: ImageFormat,
	config: ImageValidationConfig,
): ImageValidationResult {
	const errors: string[] = []

	if (
		config.allowedFormats &&
		config.allowedFormats.length > 0 &&
		!config.allowedFormats.includes(format)
	) {
		errors.push(
			`Format "${format}" is not allowed. Allowed formats: ${config.allowedFormats.join(', ')}`,
		)
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Comprehensive image validation
 */
export function validateImage(
	format: ImageFormat,
	width: number,
	height: number,
	sizeInBytes: number,
	config: ImageValidationConfig,
): ImageValidationResult {
	const formatResult = validateImageFormat(format, config)
	const dimensionsResult = validateImageDimensions(width, height, config)
	const sizeResult = validateImageSize(sizeInBytes, config)

	const allErrors = [
		...formatResult.errors,
		...dimensionsResult.errors,
		...sizeResult.errors,
	]

	return {
		valid: allErrors.length === 0,
		errors: allErrors,
	}
}
