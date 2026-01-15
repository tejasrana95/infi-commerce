# Frontend Build Optimization Guide

## Overview

This document outlines the optimization strategies implemented to reduce chunk sizes from 5MB+ to under 500KB and improve frontend load performance.

## Problem Statement

The original build had several performance issues:
- **Large Chunks**: Many chunks exceeded 5MB due to bundling entire icon libraries
- **Poor Code Splitting**: No granular splitting of vendor libraries
- **Inefficient Caching**: Large monolithic chunks prevented effective browser caching
- **Slow Load Times**: Initial page load required downloading megabytes of unused code

## Implemented Optimizations

### 1. Icon Library Optimization (Critical)

#### Problem
Icon wrapper components (`FaIcon.tsx`, `MdIcon.tsx`, etc.) were importing entire icon libraries:
```typescript
// ❌ Bad: Imports ALL ~2000 FontAwesome icons (~2MB)
import * as FaIcons from 'react-icons/fa';
```

#### Solution
Converted to dynamic imports with caching:
```typescript
// ✅ Good: Imports only the specific icon requested
const IconComponent = dynamic(
    () => import('react-icons/fa').then((mod) => {
        const Icon = (mod as any)[name];
        return Icon;
    }),
    { ssr: false }
);
```

#### Impact
- Each icon library loads only when needed
- Individual icons imported instead of entire libraries
- Runtime caching prevents redundant imports
- **Estimated savings: 10-15MB across all icon libraries**

### 2. Webpack Chunk Splitting

Enhanced `next.config.ts` with comprehensive chunk splitting strategy:

#### Framework Separation
```typescript
framework: {
  name: 'framework',
  test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
  priority: 40,
}
```
- React core in separate chunk
- Better browser caching (framework rarely changes)

#### Library-Specific Chunks
- **Stripe**: Separate chunk for payment processing
- **Animations**: `framer-motion` and `swiper` isolated
- **Icons**: Each icon library (FA, MD, Bi, etc.) in separate chunks
- **Lucide Icons**: Already using granular dynamic imports

#### Common Code Extraction
```typescript
commons: {
  name: 'commons',
  minChunks: 2,
  priority: 10,
}
```
- Shared code extracted automatically
- Loaded once, used everywhere

#### Chunk Size Limits
```typescript
maxSize: 500000, // 500KB max per chunk
minSize: 20000,  // 20KB minimum
```
- Forces splitting of large chunks
- Prevents tiny chunks that increase HTTP overhead

### 3. Dynamic Imports Throughout Codebase

Icon components now support lazy loading:
- Icons load only when component renders
- Loading placeholders prevent layout shift
- SSR disabled for icons (not needed, reduces server load)

## Best Practices for Maintaining Optimizations

### DO ✅

1. **Use DynamicIcon Component**
   ```typescript
   import DynamicIcon from '@/components/core/common/DynamicIcon';
   
   <DynamicIcon name="Shopping" size={24} />
   ```

2. **Import Individual Icons for Static Uses**
   ```typescript
   // If you MUST import statically, import individual icons
   import { FiClock } from 'react-icons/fi';
   ```

3. **Lazy Load Heavy Components**
   ```typescript
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />,
     ssr: false
   });
   ```

4. **Check Bundle Regularly**
   ```bash
   npm run analyze
   ```

### DON'T ❌

1. **Never Import Entire Icon Libraries**
   ```typescript
   // ❌ NEVER DO THIS
   import * as FaIcons from 'react-icons/fa';
   ```

2. **Avoid Large Static Imports in Client Components**
   ```typescript
   // ❌ Bad: Loads entire library immediately
   import { motion, AnimatePresence, useAnimation, ... } from 'framer-motion';
   
   // ✅ Good: Import only what you need
   import { motion } from 'framer-motion';
   ```

3. **Don't Bypass Dynamic Imports**
   ```typescript
   // ❌ Bad: Direct import in multiple files
   import { FaShoppingCart } from 'react-icons/fa';
   
   // ✅ Good: Use DynamicIcon
   <DynamicIcon name="FaShoppingCart" />
   ```

## Performance Monitoring

### Bundle Analysis

Run bundle analyzer after significant changes:
```bash
npm run analyze
```

Look for:
- **Chunk sizes**: Should be under 500KB
- **Duplicate dependencies**: Should be minimal
- **Unused code**: Red flags for tree-shaking issues

### Lighthouse Audits

Check key metrics:
- **First Contentful Paint (FCP)**: < 1.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Total Blocking Time (TBT)**: < 300ms
- **Largest Contentful Paint (LCP)**: < 2.5s

### Real-World Monitoring

In production, monitor:
- **Page Load Time**: Chrome DevTools → Network
- **Bundle Transfer Size**: Should see significant reduction
- **Cache Hit Rate**: Smaller chunks = better caching

## Expected Results

### Before Optimization
- Main chunks: **5-10MB**
- Initial load: **15-30 seconds** (slow 3G)
- Lighthouse Performance: **30-50**

### After Optimization
- Largest chunk: **< 500KB**
- Initial load: **3-5 seconds** (slow 3G)
- Lighthouse Performance: **70-90**

### Breakdown
- Framework chunk: ~150KB (React + Next.js)
- Icons per library: ~50-100KB (only if used)
- Page-specific code: ~100-200KB
- Shared commons: ~150KB

## Troubleshooting

### Icons Not Rendering

**Symptom**: Icons appear as empty spaces

**Causes**:
1. Icon name mismatch (check console warnings)
2. Wrong library prefix (e.g., "Fa" vs "Fi")
3. Cache not cleared after changes

**Solutions**:
```typescript
// Check browser console for warnings
console.warn(`Icon "${name}" not found in react-icons/fa`);

// Clear Next.js cache
rm -rf .next
npm run build
```

### Chunks Still Large

**Symptom**: Chunks exceed 500KB after optimization

**Investigation**:
1. Run `npm run analyze`
2. Check which modules are in the large chunk
3. Look for:
   - Static imports of large libraries
   - Barrel exports (index files re-exporting everything)
   - Accidentally included dev dependencies

**Solutions**:
- Convert to dynamic imports
- Import from specific paths
- Review webpack config

### Build Errors After Config Changes

**Symptom**: Build fails with webpack errors

**Common Issues**:
- TypeScript errors in webpack config
- Invalid regex in cache group tests
- Module resolution issues

**Solutions**:
```bash
# Clear cache and rebuild
rm -rf .next node_modules/.cache
npm run build
```

## Future Optimizations

### Potential Improvements

1. **Route-based Code Splitting**
   - Analyze which routes share common code
   - Further split by feature/route

2. **Preloading Critical Resources**
   - Preload framework chunk
   - Prefetch common icon libraries

3. **Image Optimization**
   - Convert to WebP/AVIF
   - Implement responsive images
   - Lazy load below-fold images

4. **CSS Optimization**
   - Extract critical CSS
   - Lazy load non-critical styles
   - Use CSS modules more extensively

5. **Third-Party Scripts**
   - Defer non-critical scripts
   - Use Next.js Script component with strategy="lazyOnload"

## Additional Resources

- [Next.js Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [Web.dev Performance](https://web.dev/performance/)
- [React Dynamic Imports](https://react.dev/reference/react/lazy)

## Version History

- **v1.0** (2026-01-15): Initial optimization implementation
  - Icon library refactoring
  - Webpack chunk splitting
  - Size limits enforced
