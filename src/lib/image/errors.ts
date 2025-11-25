/**
 * Custom error classes for image optimization library
 * Provides structured error handling with error codes and context
 */

/**
 * Base error class for all image optimization errors
 */
export class ImageOptimizationError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly context?: Record<string, unknown>,
	) {
		super(message)
		this.name = 'ImageOptimizationError'
		Error.captureStackTrace(this, this.constructor)
	}
}

/**
 * Security-related errors (injection, traversal, etc.)
 */
export class ImageSecurityError extends ImageOptimizationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'SECURITY_ERROR', context)
		this.name = 'ImageSecurityError'
	}
}

/**
 * Validation errors (dimensions, format, etc.)
 */
export class ImageValidationError extends ImageOptimizationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'VALIDATION_ERROR', context)
		this.name = 'ImageValidationError'
	}
}

/**
 * Processing errors (optimization failed, format conversion, etc.)
 */
export class ImageProcessingError extends ImageOptimizationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'PROCESSING_ERROR', context)
		this.name = 'ImageProcessingError'
	}
}

/**
 * Configuration errors (invalid config, missing dependencies, etc.)
 */
export class ImageConfigError extends ImageOptimizationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'CONFIG_ERROR', context)
		this.name = 'ImageConfigError'
	}
}

/**
 * Type guard to check if error is an ImageOptimizationError
 */
export function isImageOptimizationError(
	error: unknown,
): error is ImageOptimizationError {
	return error instanceof ImageOptimizationError
}

/**
 * Type guard to check if error is an ImageSecurityError
 */
export function isImageSecurityError(
	error: unknown,
): error is ImageSecurityError {
	return error instanceof ImageSecurityError
}

/**
 * Type guard to check if error is an ImageValidationError
 */
export function isImageValidationError(
	error: unknown,
): error is ImageValidationError {
	return error instanceof ImageValidationError
}
