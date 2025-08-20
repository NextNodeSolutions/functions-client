# @nextnode/functions-client

A TypeScript client library for UI utilities, featuring the powerful `cn` function for seamless Tailwind CSS className management. Perfect for React, Vue, and other frontend frameworks.

## Features

- 🎨 **Smart className merging** - Combines clsx and tailwind-merge for optimal Tailwind CSS class handling
- 🛡️ **TypeScript support** - Full type safety for className inputs
- ⚡ **Performance optimized** - Efficient class deduplication and conflict resolution  
- 🔄 **Framework agnostic** - Works with React, Vue, Svelte, and vanilla JavaScript
- 📦 **Zero configuration** - Works out of the box with any Tailwind CSS setup
- 🎯 **Conflict resolution** - Automatically resolves Tailwind CSS class conflicts

## Installation

```bash
npm install @nextnode/functions-client
```

Or with pnpm:

```bash
pnpm add @nextnode/functions-client
```

Or with yarn:

```bash
yarn add @nextnode/functions-client
```

## Quick Start

### Basic Usage

```typescript
import { cn } from '@nextnode/functions-client'

// Basic className merging
const buttonClass = cn('px-4 py-2 bg-blue-500 text-white rounded')
// Result: "px-4 py-2 bg-blue-500 text-white rounded"

// Conditional classes
const alertClass = cn(
  'p-4 rounded border',
  isError && 'bg-red-100 border-red-500 text-red-700',
  isSuccess && 'bg-green-100 border-green-500 text-green-700'
)

// Array syntax
const cardClass = cn([
  'bg-white shadow-lg rounded-lg',
  'hover:shadow-xl transition-shadow',
  isDark && 'bg-gray-800 text-white'
])
```

### React Component Example

```typescript
import { cn } from '@nextnode/functions-client'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          
          // Variants
          {
            'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500': 
              variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500': 
              variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500': 
              variant === 'destructive',
          },
          
          // Sizes
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          
          // User className override
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Vue Component Example

```vue
<template>
  <button :class="buttonClass" @click="$emit('click')">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { cn } from '@nextnode/functions-client'
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false
})

const buttonClass = computed(() => cn(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  
  // Variants
  props.variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
  props.variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  
  // Sizes
  props.size === 'sm' && 'h-8 px-3 text-sm',
  props.size === 'md' && 'h-10 px-4',
  props.size === 'lg' && 'h-12 px-6 text-lg',
  
  // States
  props.disabled && 'opacity-50 cursor-not-allowed',
  
  // User class override
  props.class
))
</script>
```

## API Reference

### `cn(...inputs)`

The main utility function that merges and optimizes className strings.

```typescript
function cn(...inputs: ClassValue[]): string
```

#### Parameters

- `...inputs: ClassValue[]` - Variable number of className inputs

#### ClassValue Types

The `cn` function accepts multiple input types thanks to `clsx`:

```typescript
type ClassValue = 
  | string 
  | number 
  | boolean 
  | undefined 
  | null
  | ClassArray 
  | ClassDictionary

type ClassArray = ClassValue[]

type ClassDictionary = Record<string, any>
```

#### Examples

**String concatenation:**
```typescript
cn('text-red-500', 'font-bold', 'underline')
// → "text-red-500 font-bold underline"
```

**Conditional classes:**
```typescript
cn('base-class', condition && 'conditional-class')
cn('base-class', { 'active': isActive, 'disabled': isDisabled })
```

**Array syntax:**
```typescript
cn(['text-lg', 'font-semibold'], ['text-blue-600', 'hover:text-blue-700'])
```

**Mixed syntax:**
```typescript
cn(
  'base-styles',
  condition && 'conditional',
  ['array', 'of', 'classes'],
  { 'object-conditional': someBoolean }
)
```

## Advanced Usage

### Tailwind CSS Conflict Resolution

The `cn` function automatically resolves Tailwind CSS class conflicts:

```typescript
// Conflicting margin classes - only the last one applies
cn('m-4 m-6')  // → "m-6"

// Conflicting background colors
cn('bg-red-500 bg-blue-500')  // → "bg-blue-500"

// Conflicting text sizes
cn('text-sm text-lg text-xl')  // → "text-xl"

// Complex conflicts
cn('px-4 py-2 p-6')  // → "p-6" (p-6 overrides px-4 py-2)
```

### Component Patterns

#### Base + Variants Pattern
```typescript
const baseStyles = 'rounded-lg border transition-colors'

const variants = {
  primary: 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600',
  secondary: 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50',
  ghost: 'bg-transparent border-transparent hover:bg-gray-100'
}

function getButtonClass(variant: keyof typeof variants, className?: string) {
  return cn(baseStyles, variants[variant], className)
}
```

#### Size Variants
```typescript
const sizeVariants = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base', 
  lg: 'h-12 px-6 text-lg',
  xl: 'h-14 px-8 text-xl'
}

function getCardClass(size: keyof typeof sizeVariants) {
  return cn('bg-white rounded-lg shadow', sizeVariants[size])
}
```

#### State-Based Styling
```typescript
function getInputClass(state: 'default' | 'error' | 'success') {
  return cn(
    'w-full px-3 py-2 border rounded-md transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      'border-gray-300 focus:border-blue-500 focus:ring-blue-500': state === 'default',
      'border-red-500 focus:border-red-500 focus:ring-red-500': state === 'error',
      'border-green-500 focus:border-green-500 focus:ring-green-500': state === 'success'
    }
  )
}
```

### Custom Utility Functions

Build your own utility functions on top of `cn`:

```typescript
import { cn } from '@nextnode/functions-client'

// Create a focus utility
export const focusRing = (className?: string) => cn(
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  className
)

// Create a card utility
export const card = (className?: string) => cn(
  'bg-white rounded-lg border border-gray-200 shadow-sm',
  className
)

// Create responsive text utility
export const responsiveText = (className?: string) => cn(
  'text-sm sm:text-base md:text-lg lg:text-xl',
  className
)

// Usage
const buttonClass = cn(
  'px-4 py-2 bg-blue-500 text-white rounded',
  focusRing(),
  className
)
```

## Framework Integration

### React with TypeScript
```typescript
import { cn } from '@nextnode/functions-client'
import { ComponentProps } from 'react'

interface CardProps extends ComponentProps<'div'> {
  variant?: 'default' | 'outlined' | 'elevated'
}

function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        variant === 'default' && 'bg-white shadow-sm',
        variant === 'outlined' && 'border-gray-300',
        variant === 'elevated' && 'shadow-lg',
        className
      )}
      {...props}
    />
  )
}
```

### Next.js App Router
```typescript
// app/components/ui/button.tsx
import { cn } from '@nextnode/functions-client'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
}
```

### Astro Components
```astro
---
// components/Card.astro
import { cn } from '@nextnode/functions-client'

interface Props {
  variant?: 'default' | 'highlight' | 'muted'
  class?: string
}

const { variant = 'default', class: className } = Astro.props

const cardClass = cn(
  'rounded-lg border p-6',
  variant === 'default' && 'bg-white border-gray-200',
  variant === 'highlight' && 'bg-blue-50 border-blue-200',
  variant === 'muted' && 'bg-gray-50 border-gray-300',
  className
)
---

<div class={cardClass}>
  <slot />
</div>
```

## Best Practices

### 1. Consistent Base Classes
```typescript
// Define consistent base classes for component types
const BUTTON_BASE = 'inline-flex items-center justify-center rounded-md font-medium transition-colors'
const INPUT_BASE = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm'
const CARD_BASE = 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm'
```

### 2. Variant Objects
```typescript
// Use objects for variants to maintain consistency
const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  outline: 'border-gray-300 bg-transparent hover:bg-gray-50'
} as const
```

### 3. Prop-based Styling
```typescript
// Use TypeScript to enforce valid variant props
type ButtonVariant = keyof typeof buttonVariants

interface ButtonProps {
  variant?: ButtonVariant
  className?: string
}
```

### 4. Conditional Logic
```typescript
// Keep conditional logic readable
const className = cn(
  baseStyles,
  variant && variants[variant],
  size && sizes[size],
  disabled && disabledStyles,
  userClassName
)
```

## Performance

The `cn` function is highly optimized:

- **Class deduplication** - Removes duplicate classes automatically
- **Conflict resolution** - Resolves Tailwind CSS conflicts efficiently  
- **Smart caching** - `tailwind-merge` includes internal optimizations
- **Bundle size** - Minimal impact on your bundle size

## Troubleshooting

### Classes Not Applying
- Ensure Tailwind CSS is properly configured in your project
- Check that your Tailwind CSS includes the classes you're using
- Verify class names are spelled correctly

### TypeScript Errors
- Make sure `@nextnode/functions-client` is properly imported
- Check that you're using supported `ClassValue` types
- Ensure TypeScript strict mode is compatible with your usage

### Conflicts Not Resolving
- `tailwind-merge` resolves most Tailwind conflicts automatically
- For custom classes, they may need to be configured in `tailwind-merge`
- Check the order of your classes - later classes override earlier ones

## Contributing

We welcome contributions! Please ensure your code:

- Follows TypeScript best practices
- Includes proper type definitions  
- Has comprehensive test coverage
- Follows the existing code style

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Type checking  
pnpm type-check

# Linting
pnpm lint

# Build
pnpm build
```

## License

ISC

## Related Packages

- [clsx](https://github.com/lukeed/clsx) - The underlying className utility
- [tailwind-merge](https://github.com/dcastil/tailwind-merge) - Tailwind CSS conflict resolution
- [class-variance-authority](https://github.com/joe-bell/cva) - Type-safe variant API for components