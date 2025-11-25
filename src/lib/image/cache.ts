/**
 * Cache strategy configuration for optimized images
 * Based on best practices for CDN and browser caching
 */

import { ImageConfigError } from './errors.js'
import type { CacheStrategyConfig } from './types.js'

/**
 * Default cache strategy for optimized images
 * - 1 year cache duration (31536000 seconds)
 * - Immutable flag for content-addressed assets
 */
export const DEFAULT_CACHE_STRATEGY: CacheStrategyConfig = {
	maxAge: 31536000, // 1 year
	immutable: true,
}

/**
 * Cache durations in seconds
 */
export const CACHE_DURATIONS = {
	/** 1 year - for immutable content-addressed assets */
	ONE_YEAR: 31536000,
	/** 1 month - for semi-static content */
	ONE_MONTH: 2592000,
	/** 1 week - for frequently updated content */
	ONE_WEEK: 604800,
	/** 1 day - for dynamic content */
	ONE_DAY: 86400,
	/** 1 hour - for very dynamic content */
	ONE_HOUR: 3600,
} as const

/**
 * Generate Cache-Control header value
 */
export function getCacheControlHeader(config: CacheStrategyConfig): string {
	const parts = [`max-age=${config.maxAge}`]

	if (config.immutable) {
		parts.push('immutable')
	}

	return parts.join(', ')
}

/**
 * CDN-specific headers for popular CDN providers
 */
export const CDN_HEADERS = {
	/** Cloudflare cache headers */
	cloudflare: {
		'CF-Cache-Status': 'HIT',
		'CDN-Cache-Control': 'max-age=31536000, immutable',
	},

	/** Fastly cache headers */
	fastly: {
		'Surrogate-Control': 'max-age=31536000, immutable',
		'Fastly-IO-Info': 'img-processed',
	},

	/** AWS CloudFront headers */
	cloudfront: {
		'CloudFront-Is-Desktop-Viewer': 'true',
		'CloudFront-Viewer-Country': '*',
	},

	/** Generic CDN headers */
	generic: {
		'X-Cache': 'HIT',
		Age: '0',
	},
} as const

/**
 * Get complete cache headers for a CDN provider
 */
export function getCDNHeaders(
	provider: keyof typeof CDN_HEADERS,
	cacheStrategy: CacheStrategyConfig = DEFAULT_CACHE_STRATEGY,
): Record<string, string> {
	return {
		'Cache-Control': getCacheControlHeader(cacheStrategy),
		...CDN_HEADERS[provider],
	}
}

/**
 * Content-addressed naming pattern
 * Ensures unique URLs for different versions
 */
export function generateContentAddressedName(
	originalName: string,
	hash: string,
): string {
	const extension = originalName.match(/\.[^.]+$/)?.[0] || ''
	const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
	return `${nameWithoutExt}-${hash}${extension}`
}

/**
 * Check if asset is content-addressed
 * Content-addressed assets have a hash in the filename
 */
export function isContentAddressed(filename: string): boolean {
	// Check for hash pattern: filename-[hash].ext
	return /[-_][a-f0-9]{8,}\./.test(filename)
}

/**
 * Determine appropriate cache strategy based on asset type
 */
export function getCacheStrategyForAsset(
	filename: string,
	isOptimized: boolean,
): CacheStrategyConfig {
	// Content-addressed or optimized images: long cache
	if (isContentAddressed(filename) || isOptimized) {
		return {
			maxAge: CACHE_DURATIONS.ONE_YEAR,
			immutable: true,
		}
	}

	// Regular images: shorter cache
	return {
		maxAge: CACHE_DURATIONS.ONE_MONTH,
		immutable: false,
	}
}

/**
 * Validate cache hash format
 * Ensures hash is a valid SHA-256 hex string (64 characters)
 * Prevents cache poisoning attacks through invalid hashes
 */
export function validateCacheHash(hash: string): boolean {
	return /^[a-f0-9]{64}$/i.test(hash)
}

/**
 * Sanitize filename to prevent directory traversal and injection
 * Removes dangerous characters while preserving valid filename structure
 */
export function sanitizeFilename(filename: string): string {
	return (
		filename
			// Replace invalid characters with underscore
			.replace(/[^a-zA-Z0-9.-]/g, '_')
			// Remove consecutive dots (directory traversal attempt)
			.replace(/\.\.+/g, '.')
			// Limit filename length (filesystem limits)
			.substring(0, 255)
			// Remove leading/trailing dots or dashes
			.replace(/^[.-]+|[.-]+$/g, '')
	)
}

/**
 * Generate secure cache key from filename and hash
 * Validates inputs to prevent cache poisoning
 */
export function generateSecureCacheKey(filename: string, hash: string): string {
	if (!validateCacheHash(hash)) {
		throw new ImageConfigError(
			'Invalid cache hash: must be 64-character SHA-256 hex string',
			{ hash, hashLength: hash.length, expectedLength: 64 },
		)
	}

	const safeFilename = sanitizeFilename(filename)
	if (!safeFilename) {
		throw new ImageConfigError(
			'Invalid filename: sanitization resulted in empty string',
			{ originalFilename: filename },
		)
	}

	return `${safeFilename}-${hash}`
}
