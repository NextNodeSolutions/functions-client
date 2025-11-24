# CLAUDE.md - @nextnode/functions-client

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@nextnode/functions-client** is a TypeScript library for interacting with Nextnode Functions. It provides utilities for date formatting, data processing, API client creation, and comprehensive logging.

**Key Features:**

- **TypeScript strict mode** with maximum type safety
- **ESM-only package** with proper exports configuration
- **Modern CI/CD** with automated version management and publishing
- **Comprehensive tooling** (Biome, Vitest, Husky)
- **Automated release management** with changesets and NPM provenance
- **Professional logging** with @nextnode/logger

## Project Structure

```
functions-client/
├── .changeset/              # Version management configuration
├── .github/workflows/       # CI/CD workflows (test, version, publish)
├── .husky/                  # Git hooks configuration
├── src/                     # Source code
│   ├── lib/                # Core library modules (client, validation, processing)
│   ├── types/              # Type definitions (ClientConfig, ApiResponse, LibraryError)
│   ├── utils/              # Utility functions (logger, date, general utils)
│   └── index.ts            # Main export file
├── tests/                  # Test setup and configuration
├── package.json            # Package configuration
├── tsconfig.json           # TypeScript config (development)
├── tsconfig.build.json     # TypeScript config (build)
├── vitest.config.ts        # Test configuration
└── biome.json              # Formatting configuration
```

## Development Commands

### Build & Development

```bash
pnpm build              # Build library (clean + tsc + tsc-alias)
pnpm clean              # Remove dist directory
pnpm type-check         # TypeScript validation
```

### Testing

```bash
pnpm test               # Run tests once
pnpm test:watch         # Watch mode for tests
pnpm test:coverage      # Generate coverage report (output: tests/coverage/)
pnpm test:ui            # Open Vitest UI
```

### Code Quality

```bash
pnpm lint               # Biome check with auto-fix
pnpm format             # Prettier formatting
```

### Version Management & Publishing

```bash
pnpm changeset          # Create changeset for version bump
pnpm changeset:version  # Update versions from changesets
pnpm changeset:publish  # Publish to NPM registry
```

## CI/CD Workflows

The library uses modern GitHub Actions workflows following NextNode standards:

### Test Workflow (`test.yml`)

- **Trigger**: Pull requests to main/master
- **Node.js**: Version 24 (latest)
- **Uses**: NextNodeSolutions/github-actions quality-checks workflow
- **Checks**: Lint, typecheck, tests, build, coverage

### Version Management (`version.yml`)

- **Trigger**: Pushes to main branch, manual dispatch
- **Uses**: NextNodeSolutions/github-actions version-management workflow
- **Function**: Creates version bump PRs using changesets
- **Auto-merge**: Enabled for automated workflow
- **Node**: 24, PNPM: 10.11.0

### Auto Publish (`auto-publish.yml`)

- **Trigger**: Repository dispatch when version PR is merged
- **Uses**: NextNodeSolutions/github-actions publish-release workflow
- **Function**: Automatically publishes to NPM with provenance
- **GitHub Releases**: Creates releases automatically
- **Security**: NPM provenance enabled

### Manual Publish (`manual-publish.yml`)

- **Trigger**: Manual workflow dispatch
- **Function**: Emergency publishing without version PR
- **Same configuration** as auto-publish

### Changeset Check (`changeset-check.yml`)

- **Trigger**: Pull request creation/updates
- **Function**: Ensures changesets are added for source code changes
- **Smart detection**: Only requires changesets for actual code changes

## TypeScript Configuration

### Strict Mode Settings

- **Extends**: `@nextnode/standards/typescript/library`
- **Path mapping**: `@/*` for src, `@/types/*` for types
- **Types**: node, vitest/globals
- **Build separation**: Development config (noEmit), separate build config

### Module System

- **ESM-only**: Pure ES modules, no CommonJS
- **Exports**: Properly configured with types and import paths
- **Extension mapping**: `.js` extensions in imports for Node.js compatibility

### Build Configuration (`tsconfig.build.json`)

- **Extends**: Main tsconfig.json
- **Output**: dist/ directory with source maps and declarations
- **Root**: src/ directory
- **Excludes**: Test files (_.test.ts, _.spec.ts)

## Code Quality Standards

### Biome Configuration

- **Extends**: `@nextnode/standards/biome`
- **Centralized configuration**: All rules from shared standards
- **Consistent formatting**: Across all NextNode projects

### Prettier

- **Configuration**: Uses `@nextnode/standards/prettier`
- **Integration**: Works alongside Biome for code formatting

### Testing

- **Vitest**: Modern test runner with built-in TypeScript support
- **Configuration**: Extends `@nextnode/standards/vitest/backend`
- **Path resolution**: Uses vite-tsconfig-paths plugin
- **Setup file**: tests/setup.ts for global test configuration
- **Coverage**: V8 provider in tests/coverage/ directory

## Library Functionality

### Core Module (`src/lib/core.ts`)

#### createClient(options)

Creates a client instance with optional configuration:

```typescript
import { createClient } from '@nextnode/functions-client'

const client = createClient({
	apiKey: 'your-api-key',
	baseUrl: 'https://api.example.com',
	timeout: 5000,
})
```

#### validateConfig(config)

Type guard for validating configuration objects:

```typescript
import { validateConfig } from '@nextnode/functions-client'

if (validateConfig(config)) {
	// config is Record<string, unknown>
}
```

#### processData(data)

Processes data array with metadata addition:

```typescript
import { processData } from '@nextnode/functions-client'

const processed = await processData([
	{ id: 1, name: 'item1' },
	{ id: 2, name: 'item2' },
])
// Returns items with { processed: true, timestamp: number }
```

### Type Definitions (`src/types/`)

#### ClientConfig

```typescript
interface ClientConfig {
	apiKey?: string
	baseUrl?: string
	timeout?: number
}
```

#### ApiResponse<T>

```typescript
interface ApiResponse<T = unknown> {
	success: boolean
	data?: T
	error?: string
	statusCode: number
}
```

#### LibraryError

```typescript
interface LibraryError {
	code: string
	message: string
	details?: Record<string, unknown>
}
```

### Utility Functions (`src/utils/`)

#### Date Formatting

```typescript
import { formatDate } from '@nextnode/functions-client'

formatDate(new Date()) // "November 24, 2025"
formatDate(new Date(), 'fr-FR') // "24 novembre 2025"
formatDate(timestamp, 'en-US', options) // Custom formatting
```

#### Deep Merge

```typescript
import { deepMerge } from '@nextnode/functions-client'

const merged = deepMerge({ a: 1, nested: { b: 2 } }, { nested: { c: 3 } })
// Result: { a: 1, nested: { b: 2, c: 3 } }
```

#### Object Validation

```typescript
import { isObject } from '@nextnode/functions-client'

isObject({}) // true
isObject([]) // false
isObject(null) // false
```

#### Async Delay

```typescript
import { delay } from '@nextnode/functions-client'

await delay(1000) // Wait 1 second
```

## Logging System

The library includes comprehensive logging using `@nextnode/logger` with specialized loggers for different modules.

### Available Loggers

```typescript
import {
	logger, // Main library logger
	apiLogger, // API-specific operations
	coreLogger, // Core functionality
	utilsLogger, // Utility functions
	logDebug, // Debug helper
	logApiResponse, // API response helper
	logError, // Error helper with context
} from '@nextnode/functions-client'
```

### Usage Examples

#### Basic Logging

```typescript
import { coreLogger } from '@nextnode/functions-client'

coreLogger.info('Creating client instance', {
	details: { hasApiKey: true },
})
```

#### Error Logging with Context

```typescript
import { logError } from '@nextnode/functions-client'

try {
	// ... some operation
} catch (error) {
	logError(error, {
		userId: 123,
		action: 'fetchData',
	})
}
```

#### API Response Logging

```typescript
import { logApiResponse } from '@nextnode/functions-client'

logApiResponse('get', '/api/users', 200, { users: [...] })
```

#### Debug Logging

```typescript
import { logDebug } from '@nextnode/functions-client'

logDebug('Complex computation', {
	input: data,
	intermediate: results,
	output: final,
})
```

## Dependency Management

### Production Dependencies

- **@nextnode/logger** (^0.2.4): Lightweight logging library

### Development Dependencies

- **@nextnode/standards** (^2.1.3): Shared configurations
- **@biomejs/biome** (^2.2.3): Modern formatting and linting
- **@vitest/coverage-v8** (^3.1.4): Test coverage
- **@changesets/cli** (^2.29.4): Version management
- **typescript** (^5.0.0): TypeScript compiler
- **tsc-alias** (^1.8.16): Path alias resolution
- **vite-tsconfig-paths** (^5.1.4): Vite path support
- **prettier** (^3.2.0): Code formatting
- **@types/node** (^22.0.0): Node.js type definitions

## Important Notes

### Node.js Version

- **Required**: Node.js >= 24.0.0
- All CI/CD workflows use Node 24

### Package Manager

- **PNPM only**: Version 10.11.0
- Never use npm or yarn

### Pre-commit Hooks

- Automatic linting and formatting
- Commitlint validation
- Tests run before push

### Build Process

- `pnpm build` compiles TypeScript and resolves path aliases
- Output in `dist/` directory
- `prepublishOnly` ensures build before npm publish
- Source maps and declaration maps generated

## Migration Notes

This library was migrated from an older structure to align with NextNode standards:

### Major Changes

1. **Added build process**: tsconfig.build.json, tsc-alias
2. **Modernized CI/CD**: Separated version/publish workflows, reusable actions
3. **Extended shared standards**: @nextnode/standards for TypeScript, Biome, Vitest
4. **Removed ESLint**: Using Biome only for linting
5. **Added logger infrastructure**: @nextnode/logger with specialized loggers
6. **Reorganized code**: lib/, types/, utils/ structure
7. **Migrated date formatting**: From src/formatting/ to src/utils/
8. **Added utility functions**: deepMerge, isObject, delay
9. **Updated Node requirement**: 20 → 24

### Breaking Changes

- Requires Node.js 24+
- ESM-only package
- Import paths changed (formatDate now from utils)
- Build process required before publishing

## Release Process

1. **Make changes** and write tests
2. **Create changeset**: `pnpm changeset`
3. **Push to feature branch**: Create PR
4. **CI checks run**: Lint, typecheck, tests, build
5. **Merge PR**: Version workflow creates version PR
6. **Version PR auto-merges**: Triggers auto-publish workflow
7. **NPM publication**: Package published with provenance
8. **GitHub release**: Created automatically

For emergency releases, use manual-publish workflow.
