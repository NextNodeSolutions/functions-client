/**
 * Cache strategy configuration for optimized images
 * Based on best practices for CDN and browser caching
 */

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
