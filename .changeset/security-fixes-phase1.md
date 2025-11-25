---
'@nextnode/functions-client': major
---

# Security Fixes - Phase 1 (Critical)

## Breaking Changes

### 1. Removed Deprecated XSS-Vulnerable Function

- **REMOVED**: `generateLQIPHTML()` function (deprecated, had XSS vulnerability)
- **Migration**: Use `generateLQIPElement()` instead
- **Before**: `const html = generateLQIPHTML(uri, alt, config)`
- **After**: `const element = generateLQIPElement(uri, alt, config); document.body.appendChild(element)`

### 2. Stricter URL Validation in LQIP Generation

- Added URL validation to prevent XSS attacks
- Now rejects `javascript:` protocol and non-image data URIs
- Only allows: `data:image/*`, `https://`, `http://` URLs
- Invalid URLs will throw errors instead of being silently accepted

### 3. Stricter URL Validation in OptimizedBackgroundImage

- Added URL validation before using in CSS `backgroundImage`
- Blocks `javascript:` protocol and `data:text/html` URIs
- Only allows: `data:image/*`, `https://`, `http://`, or relative paths starting with `/`

### 4. Reduced MAX_PIXELS Security Limit

- **Changed**: MAX_PIXELS from 100 mebipixels (104,857,600) to 50 mebipixels (52,428,800)
- **Reason**: Prevents MAX_WIDTH × MAX_HEIGHT (100M pixels) from being allowed simultaneously
- **Impact**: Images with 10000 × 10000 pixels will now be rejected
- Individual dimensions can still be at max (10000px), but not both simultaneously

## Security Fixes

### HIGH Severity

- **Fixed XSS vulnerability** in LQIP HTML generation by removing deprecated function
- Added **input validation** to prevent javascript: protocol injection
- Added **URL validation** to OptimizedBackgroundImage component

### MEDIUM Severity

- **Improved filename sanitization** to handle emoji and preserve extensions when truncating
- **Fixed pixel validation logic** to prevent DoS attacks through oversized images

## Additional Changes

- Added comprehensive security tests for URL validation
- Improved filename sanitization to collapse consecutive invalid characters
- Added React testing libraries as dev dependencies (@testing-library/react)
- All 391 tests passing with 100% security test coverage

## Upgrade Guide

### If you used `generateLQIPHTML()`:

```typescript
// OLD (deprecated, removed)
const html = generateLQIPHTML(dataURI, alt, config)
element.innerHTML = html

// NEW (secure)
const imgElement = generateLQIPElement(dataURI, alt, config)
element.appendChild(imgElement)
```

### If you rely on MAX_PIXELS limit:

- Images with dimensions up to 10000 × 7228 pixels are still allowed
- Images with exactly 10000 × 10000 pixels will now be rejected
- Consider optimizing large images before processing

### If you pass URLs to LQIP or background images:

- Ensure URLs use `https://`, `http://`, or `data:image/*` protocols
- `javascript:` and `data:text/html` URLs will throw errors
- Update any URL generation logic to comply with new validation
