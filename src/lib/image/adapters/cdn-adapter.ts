/**
 * CDN image optimization adapter
 * Generates optimized URLs for popular CDN providers
 * Supports Cloudflare Images, Imgix, and generic CDN patterns
 */

import type {
	ImageFormat,
	ImageOptimizationOptions,
	ImageSource,
	LQIPConfig,
	OptimizedImage,
} from '../types.js'
import {
	detectImageFormat,
	getQualityForFormat,
	mergeLQIPConfig,
} from '../utils/index.js'
import { BaseImageAdapter } from './base-adapter.js'

/**
 * Supported CDN providers
 */
export type CDNProvider = 'cloudflare' | 'imgix' | 'cloudinary' | 'generic'

/**
 * CDN adapter configuration
 */
export interface CDNAdapterConfig {
	/** CDN provider */
	provider: CDNProvider

	/** Base URL for the CDN */
	baseUrl: string

	/** CDN account/zone identifier (for Cloudflare, Imgix, etc.) */
	accountId?: string

	/** API key for authenticated operations */
	apiKey?: string

	/** Default quality profile */
	defaultProfile?: 'lossless' | 'balanced' | 'aggressive'
}

/**
 * CDN image adapter
 * Generates transformation URLs for on-the-fly image optimization
 */
export class CDNImageAdapter extends BaseImageAdapter {
	private readonly provider: CDNProvider
	private readonly baseUrl: string
	private readonly accountId?: string
	private readonly defaultProfile: 'lossless' | 'balanced' | 'aggressive'

	constructor(config: CDNAdapterConfig) {
		super(`CDNImageAdapter(${config.provider})`)
		this.provider = config.provider
		this.baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
		this.accountId = config.accountId
		this.defaultProfile = config.defaultProfile || 'balanced'
	}

	async optimize(
		source: ImageSource,
		options: ImageOptimizationOptions = {},
	): Promise<OptimizedImage> {
		const sourceString = this.getSourceString(source)

		// Detect format
		const detectedFormat = detectImageFormat(sourceString)
		const format = options.format || detectedFormat || 'webp'

		// Get quality
		const profile = options.profile || this.defaultProfile
		const quality = getQualityForFormat(format, profile, options.quality)

		// Build CDN URL based on provider
		const url = this.buildCDNUrl(sourceString, {
			format,
			quality,
			...(options.width && { width: options.width }),
			...(options.height && { height: options.height }),
		})

		// Return optimized image (dimensions are estimates)
		return {
			src: url,
			width: options.width || 0,
			height: options.height || 0,
			format,
		}
	}

	async generateLQIP(
		source: ImageSource,
		config: Partial<LQIPConfig> = {},
	): Promise<string> {
		const sourceString = this.getSourceString(source)
		const lqipConfig = mergeLQIPConfig(config)

		// Build LQIP URL
		const url = this.buildCDNUrl(sourceString, {
			format: lqipConfig.format,
			quality: lqipConfig.quality,
			width: lqipConfig.width,
			height: lqipConfig.height,
		})

		return url
	}

	supportsFormat(format: string): boolean {
		// Most CDNs support all major formats
		return ['png', 'webp', 'avif', 'jpeg', 'jpg'].includes(
			format.toLowerCase(),
		)
	}

	/**
	 * Build CDN transformation URL
	 */
	private buildCDNUrl(
		source: string,
		params: {
			format: ImageFormat
			quality: number
			width?: number
			height?: number
		},
	): string {
		switch (this.provider) {
			case 'cloudflare':
				return this.buildCloudflareUrl(source, params)
			case 'imgix':
				return this.buildImgixUrl(source, params)
			case 'cloudinary':
				return this.buildCloudinaryUrl(source, params)
			case 'generic':
			default:
				return this.buildGenericUrl(source, params)
		}
	}

	/**
	 * Cloudflare Images URL builder
	 * Format: https://imagedelivery.net/{account_id}/{image_id}/{variant}
	 * Or: /cdn-cgi/image/format=webp,quality=90,width=800/image.jpg
	 */
	private buildCloudflareUrl(
		source: string,
		params: {
			format: ImageFormat
			quality: number
			width?: number
			height?: number
		},
	): string {
		const transformations: string[] = [
			`format=${params.format}`,
			`quality=${params.quality}`,
		]

		if (params.width) {
			transformations.push(`width=${params.width}`)
		}

		if (params.height) {
			transformations.push(`height=${params.height}`)
		}

		return `${this.baseUrl}/cdn-cgi/image/${transformations.join(',')}/${source}`
	}

	/**
	 * Imgix URL builder
	 * Format: https://domain.imgix.net/image.jpg?w=800&fm=webp&q=90
	 */
	private buildImgixUrl(
		source: string,
		params: {
			format: ImageFormat
			quality: number
			width?: number
			height?: number
		},
	): string {
		const searchParams = new URLSearchParams()
		searchParams.set('fm', params.format)
		searchParams.set('q', params.quality.toString())
		searchParams.set('auto', 'compress,format')

		if (params.width) {
			searchParams.set('w', params.width.toString())
		}

		if (params.height) {
			searchParams.set('h', params.height.toString())
		}

		return `${this.baseUrl}/${source}?${searchParams.toString()}`
	}

	/**
	 * Cloudinary URL builder
	 * Format: https://res.cloudinary.com/{cloud_name}/image/upload/f_webp,q_90,w_800/image.jpg
	 */
	private buildCloudinaryUrl(
		source: string,
		params: {
			format: ImageFormat
			quality: number
			width?: number
			height?: number
		},
	): string {
		const transformations: string[] = [
			`f_${params.format}`,
			`q_${params.quality}`,
		]

		if (params.width) {
			transformations.push(`w_${params.width}`)
		}

		if (params.height) {
			transformations.push(`h_${params.height}`)
		}

		return `${this.baseUrl}/image/upload/${transformations.join(',')}/${source}`
	}

	/**
	 * Generic CDN URL builder
	 * Uses query parameters (compatible with most CDNs)
	 */
	private buildGenericUrl(
		source: string,
		params: {
			format: ImageFormat
			quality: number
			width?: number
			height?: number
		},
	): string {
		const searchParams = new URLSearchParams()
		searchParams.set('format', params.format)
		searchParams.set('quality', params.quality.toString())

		if (params.width) {
			searchParams.set('width', params.width.toString())
		}

		if (params.height) {
			searchParams.set('height', params.height.toString())
		}

		return `${this.baseUrl}/${source}?${searchParams.toString()}`
	}

	/**
	 * Factory method for Cloudflare Images
	 */
	static createCloudflare(
		baseUrl: string,
		accountId?: string,
	): CDNImageAdapter {
		return new CDNImageAdapter({
			provider: 'cloudflare',
			baseUrl,
			accountId,
		})
	}

	/**
	 * Factory method for Imgix
	 */
	static createImgix(baseUrl: string): CDNImageAdapter {
		return new CDNImageAdapter({
			provider: 'imgix',
			baseUrl,
		})
	}

	/**
	 * Factory method for Cloudinary
	 */
	static createCloudinary(
		baseUrl: string,
		cloudName: string,
	): CDNImageAdapter {
		return new CDNImageAdapter({
			provider: 'cloudinary',
			baseUrl: `${baseUrl}/${cloudName}`,
		})
	}
}
