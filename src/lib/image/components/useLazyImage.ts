/**
 * React hook for lazy loading images with IntersectionObserver
 * Implements progressive loading with blur-to-sharp transition
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Lazy image loading options
 */
export interface UseLazyImageOptions {
	/** Root margin for IntersectionObserver (default: '50px') */
	rootMargin?: string

	/** Intersection threshold (default: 0.01) */
	threshold?: number

	/** LQIP placeholder data URI */
	placeholder?: string

	/** Callback when image starts loading */
	onLoadStart?: () => void

	/** Callback when image is loaded */
	onLoadComplete?: () => void

	/** Callback on load error */
	onError?: (error: Error) => void
}

/**
 * Lazy image loading state
 */
export interface UseLazyImageResult {
	/** Current image source (placeholder or full) */
	src: string

	/** Whether full image is loaded */
	isLoaded: boolean

	/** Whether image is in loading state */
	isLoading: boolean

	/** Loading error if any */
	error: Error | null

	/** Ref to attach to img element */
	ref: React.RefObject<HTMLImageElement | null>

	/** Inline styles for blur transition */
	style: React.CSSProperties
}

/**
 * Hook for lazy loading images with IntersectionObserver
 *
 * @example
 * ```tsx
 * const lazyImage = useLazyImage('/image-full.jpg', {
 *   placeholder: '/image-lqip.jpg',
 *   rootMargin: '50px'
 * })
 *
 * <img
 *   ref={lazyImage.ref}
 *   src={lazyImage.src}
 *   style={lazyImage.style}
 *   alt="Description"
 * />
 * ```
 */
export function useLazyImage(
	src: string,
	options: UseLazyImageOptions = {},
): UseLazyImageResult {
	const {
		rootMargin = '50px',
		threshold = 0.01,
		placeholder,
		onLoadStart,
		onLoadComplete,
		onError,
	} = options

	const imgRef = useRef<HTMLImageElement>(null)
	const [isLoaded, setIsLoaded] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [currentSrc, setCurrentSrc] = useState(placeholder || src)

	// Stable refs for callbacks to prevent unnecessary re-renders
	const callbacksRef = useRef({ onLoadStart, onLoadComplete, onError })
	callbacksRef.current = { onLoadStart, onLoadComplete, onError }

	const loadImage = useCallback(() => {
		setIsLoading(true)
		setError(null)
		callbacksRef.current.onLoadStart?.()

		const img = globalThis.Image
			? new globalThis.Image()
			: ({ onload: null, onerror: null, src: '' } as HTMLImageElement)

		img.onload = () => {
			setCurrentSrc(src)
			setIsLoaded(true)
			setIsLoading(false)
			callbacksRef.current.onLoadComplete?.()
		}

		img.onerror = () => {
			const err = new Error(`Failed to load image: ${src}`)
			setError(err)
			setIsLoading(false)
			callbacksRef.current.onError?.(err)
		}

		img.src = src

		return () => {
			// Cleanup: abort loading if component unmounts
			img.src = ''
		}
	}, [src])

	useEffect(() => {
		const imgElement = imgRef.current
		if (!imgElement) return

		let cleanup: (() => void) | undefined

		// If no placeholder, load immediately
		if (!placeholder) {
			cleanup = loadImage()
			return cleanup
		}

		// Create IntersectionObserver
		const observer = new IntersectionObserver(
			entries => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						cleanup = loadImage()
						observer.disconnect()
						break
					}
				}
			},
			{
				rootMargin,
				threshold,
			},
		)

		observer.observe(imgElement)

		return () => {
			observer.disconnect()
			cleanup?.()
		}
	}, [placeholder, rootMargin, threshold, loadImage])

	// Blur transition styles
	const style: React.CSSProperties = {
		filter: isLoaded ? 'blur(0px)' : placeholder ? 'blur(10px)' : 'none',
		transition: 'filter 0.3s ease-in-out',
		willChange: isLoaded ? 'auto' : 'filter',
	}

	return {
		src: currentSrc,
		isLoaded,
		isLoading,
		error,
		ref: imgRef,
		style,
	}
}

/**
 * Hook for preloading images
 * Useful for critical images that should start loading immediately
 *
 * @example
 * ```tsx
 * const { isPreloaded, error } = useImagePreload([
 *   '/hero-image.jpg',
 *   '/logo.png'
 * ])
 * ```
 */
export interface UseImagePreloadResult {
	/** All images successfully preloaded */
	isPreloaded: boolean

	/** Loading progress (0-1) */
	progress: number

	/** Preload errors */
	errors: Array<{ src: string; error: Error }>
}

export function useImagePreload(sources: string[]): UseImagePreloadResult {
	const [loadedCount, setLoadedCount] = useState(0)
	const [errors, setErrors] = useState<Array<{ src: string; error: Error }>>(
		[],
	)

	useEffect(() => {
		if (sources.length === 0) return

		const images = sources.map(src => {
			const img = new Image()

			img.onload = () => {
				setLoadedCount(prev => prev + 1)
			}

			img.onerror = () => {
				setErrors(prev => [
					...prev,
					{ src, error: new Error(`Failed to preload: ${src}`) },
				])
				setLoadedCount(prev => prev + 1) // Count as "processed"
			}

			img.src = src
			return img
		})

		return () => {
			// Cleanup - abort loading if component unmounts
			for (const img of images) {
				img.src = ''
			}
		}
	}, [sources])

	return {
		isPreloaded: loadedCount === sources.length,
		progress: sources.length > 0 ? loadedCount / sources.length : 1,
		errors,
	}
}

/**
 * Hook for background image lazy loading
 * Useful for CSS background-image properties
 *
 * @example
 * ```tsx
 * const bgImage = useBackgroundImage('/hero-bg.jpg', {
 *   placeholder: '/hero-bg-lqip.jpg'
 * })
 *
 * <div style={bgImage.style} className="hero-section">
 *   Content
 * </div>
 * ```
 */
export interface UseBackgroundImageResult {
	/** CSS background-image value */
	style: React.CSSProperties

	/** Whether image is loaded */
	isLoaded: boolean

	/** Ref to attach to element */
	ref: React.RefObject<HTMLDivElement | null>
}

export function useBackgroundImage(
	src: string,
	options: UseLazyImageOptions = {},
): UseBackgroundImageResult {
	const { placeholder, rootMargin = '50px', threshold = 0.01 } = options

	const divRef = useRef<HTMLDivElement>(null)
	const [isLoaded, setIsLoaded] = useState(false)
	const [backgroundImage, setBackgroundImage] = useState(
		placeholder ? `url(${placeholder})` : 'none',
	)

	useEffect(() => {
		const divElement = divRef.current
		if (!divElement) return

		const observer = new IntersectionObserver(
			entries => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const img = new Image()
						img.onload = () => {
							setBackgroundImage(`url(${src})`)
							setIsLoaded(true)
						}
						img.src = src
						observer.disconnect()
						break
					}
				}
			},
			{ rootMargin, threshold },
		)

		observer.observe(divElement)

		return () => {
			observer.disconnect()
		}
	}, [src, rootMargin, threshold])

	const style: React.CSSProperties = {
		backgroundImage,
		backgroundSize: 'cover',
		backgroundPosition: 'center',
		transition: 'filter 0.3s ease-in-out',
		filter: isLoaded ? 'blur(0px)' : placeholder ? 'blur(10px)' : 'none',
	}

	return {
		style,
		isLoaded,
		ref: divRef,
	}
}
