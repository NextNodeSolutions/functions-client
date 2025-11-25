/**
 * Image optimization library
 * Reusable image processing utilities for all NextNode projects
 */

// Adapters
export * from './adapters/index.js'
// Cache strategies
export * from './cache.js'
// React components and hooks
export * from './components/index.js'
// Error classes
export * from './errors.js'
// Types (excluding OptimizedImage to avoid conflict with component)
// Export OptimizedImage type with alias to avoid conflict
export type {
	BatchOptimizationResult,
	CacheStrategyConfig,
	CompressionProfile,
	ImageFormat,
	ImageOptimizationOptions,
	ImageQualityConfig,
	ImageSource,
	ImageValidationConfig,
	ImageValidationResult,
	LQIPConfig,
	OptimizedImage as OptimizedImageType,
	ResponsiveImageConfig,
} from './types.js'
// Core utilities
export * from './utils/index.js'
