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
 * URL builder configuration for different CDN providers
 */
interface URLBuilderConfig {
	formatKey: string
	qualityKey: string
	widthKey: string
	heightKey: string
	useQueryParams: boolean
	pathTemplate?: string
	separator?: string
	additionalParams?: Record<string, string>
}

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
		// Validate dimensions against security limits
		this.validateDimensions(options.width, options.height)

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
	 * Sanitize and validate image source URL to prevent injection attacks
	 * Prevents: path traversal, protocol injection, malicious URLs
	 */
	private sanitizeSource(source: string): string {
		// Block path traversal attempts
		if (source.includes('../') || source.includes('..\\')) {
			throw new Error('Path traversal detected in image source')
		}

		// Block absolute paths (should be relative to CDN base)
		if (source.startsWith('/')) {
			throw new Error('Absolute paths not allowed, use relative paths')
		}

		// Validate it looks like an image path (basic extension check)
		const validExtensions = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i
		if (!validExtensions.test(source)) {
			throw new Error(
				'Invalid image source: must have valid image extension',
			)
		}

		// Encode URI components to prevent injection
		return encodeURIComponent(source)
	}

	/**
	 * Get URL builder configuration for current provider
	 */
	private getURLBuilderConfig(): URLBuilderConfig {
		switch (this.provider) {
			case 'cloudflare':
				return {
					formatKey: 'format=',
					qualityKey: 'quality=',
					widthKey: 'width=',
					heightKey: 'height=',
					useQueryParams: false,
					pathTemplate: '/cdn-cgi/image/{params}/{source}',
					separator: ',',
				}
			case 'imgix':
				return {
					formatKey: 'fm',
					qualityKey: 'q',
					widthKey: 'w',
					heightKey: 'h',
					useQueryParams: true,
					additionalParams: { auto: 'compress,format' },
				}
			case 'cloudinary':
				return {
					formatKey: 'f_',
					qualityKey: 'q_',
					widthKey: 'w_',
					heightKey: 'h_',
					useQueryParams: false,
					pathTemplate: '/image/upload/{params}/{source}',
					separator: ',',
				}
			default:
				return {
					formatKey: 'format',
					qualityKey: 'quality',
					widthKey: 'width',
					heightKey: 'height',
					useQueryParams: true,
				}
		}
	}

	/**
	 * Build CDN transformation URL using unified logic
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
		const safeSource = this.sanitizeSource(source)
		const config = this.getURLBuilderConfig()

		if (config.useQueryParams) {
			return this.buildQueryParamURL(safeSource, params, config)
		}

		return this.buildPathBasedURL(safeSource, params, config)
	}

	/**
	 * Build URL with query parameters (Imgix, Generic)
	 */
	private buildQueryParamURL(
		source: string,
		params: {
			format: ImageFormat
			quality: number
			width?: number
			height?: number
		},
		config: URLBuilderConfig,
	): string {
		const searchParams = new URLSearchParams()
		searchParams.set(config.formatKey, params.format)
		searchParams.set(config.qualityKey, params.quality.toString())

		if (config.additionalParams) {
			for (const [key, value] of Object.entries(
				config.additionalParams,
			)) {
				searchParams.set(key, value)
			}
		}

		if (params.width) {
			searchParams.set(config.widthKey, params.width.toString())
		}

		if (params.height) {
			searchParams.set(config.heightKey, params.height.toString())
		}

		return `${this.baseUrl}/${source}?${searchParams.toString()}`
	}

	/**
	 * Build URL with path-based transformations (Cloudflare, Cloudinary)
	 */
	private buildPathBasedURL(
		source: string,
		params: {
			format: ImageFormat
			quality: number
			width?: number
			height?: number
		},
		config: URLBuilderConfig,
	): string {
		const transformations: string[] = [
			`${config.formatKey}${params.format}`,
			`${config.qualityKey}${params.quality}`,
		]

		if (params.width) {
			transformations.push(`${config.widthKey}${params.width}`)
		}

		if (params.height) {
			transformations.push(`${config.heightKey}${params.height}`)
		}

		const paramsString = transformations.join(config.separator || ',')

		if (config.pathTemplate) {
			return `${this.baseUrl}${config.pathTemplate
				.replace('{params}', paramsString)
				.replace('{source}', source)}`
		}

		return `${this.baseUrl}/${paramsString}/${source}`
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
