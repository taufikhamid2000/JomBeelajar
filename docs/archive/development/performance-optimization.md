# Performance Optimization Guide

This document outlines strategies and best practices for optimizing the performance of the EduBridge application.

## Key Performance Metrics

We focus on these critical metrics:

1. **First Contentful Paint (FCP)**: Target < 1.8s
2. **Largest Contentful Paint (LCP)**: Target < 2.5s
3. **Time to Interactive (TTI)**: Target < 3.5s
4. **Cumulative Layout Shift (CLS)**: Target < 0.1
5. **First Input Delay (FID)**: Target < 100ms
6. **Server Response Time**: Target < 200ms

## Frontend Optimizations

### Next.js Optimizations

#### Image Optimization

Use the Next.js Image component with proper sizing:

```jsx
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  width={500}
  height={300}
  alt="Description"
  priority={isAboveFold}
  loading="lazy" // for below-fold images
/>;
```

#### Code Splitting

Leverage dynamic imports for code splitting:

```jsx
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('../components/HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Use when the component relies on browser APIs
});
```

#### Font Optimization

Use Next.js font optimization:

```jsx
import { GeistSans } from 'next/font/google';

const geist = GeistSans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### React Optimizations

#### Component Memoization

Use memo for expensive renders:

```jsx
import { memo, useMemo } from 'react';

const MemoizedComponent = memo(function Component({ data }) {
  // Only re-renders if data changes
  return (
    <div>
      {data.map((item) => (
        <Item key={item.id} {...item} />
      ))}
    </div>
  );
});

function ParentComponent({ items }) {
  // Only recalculates when items change
  const processedData = useMemo(() => {
    return expensiveCalculation(items);
  }, [items]);

  return <MemoizedComponent data={processedData} />;
}
```

#### List Virtualization

For long lists, use virtualization:

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // estimated row height
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### React Query Optimizations

#### Caching and Stale Time

Configure appropriate stale time for different data types:

```tsx
// Frequently changing data
const { data: leaderboardData } = useQuery({
  queryKey: ['leaderboard'],
  queryFn: fetchLeaderboard,
  staleTime: 30 * 1000, // 30 seconds
});

// Rarely changing data
const { data: subjectsData } = useQuery({
  queryKey: ['subjects'],
  queryFn: fetchSubjects,
  staleTime: 60 * 60 * 1000, // 1 hour
  cacheTime: 24 * 60 * 60 * 1000, // 24 hours
});
```

#### Prefetching

Prefetch data for probable user journeys:

```tsx
function SubjectsList({ subjects }) {
  const queryClient = useQueryClient();

  const prefetchTopics = async (subjectId) => {
    await queryClient.prefetchQuery({
      queryKey: ['topics', subjectId],
      queryFn: () => fetchTopics(subjectId),
    });
  };

  return (
    <ul>
      {subjects.map((subject) => (
        <li key={subject.id} onMouseEnter={() => prefetchTopics(subject.id)}>
          <Link href={`/subjects/${subject.id}`}>{subject.name}</Link>
        </li>
      ))}
    </ul>
  );
}
```

## Backend Optimizations

### Supabase Query Optimization

#### Selecting Specific Columns

Only request needed columns:

```typescript
const { data, error } = await supabase
  .from('topics')
  .select('id, title, description')
  .eq('subject_id', subjectId);
```

#### Pagination

Implement pagination for large datasets:

```typescript
const { data, error } = await supabase
  .from('users')
  .select('id, email, created_at')
  .range(0, 9); // Get first 10 users (0-9)
```

#### Efficient Joins

Use efficient join strategies:

```typescript
// Instead of nested queries
const { data, error } = await supabase
  .from('topics')
  .select(
    `
    id, 
    title,
    chapters (
      id,
      title,
      order_index
    )
  `
  )
  .eq('subject_id', subjectId)
  .order('order_index');
```

### API Route Optimization

#### Response Caching

Implement caching for appropriate routes:

```typescript
export async function GET(request: Request) {
  // Set cache headers
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
```

## Build and Bundle Optimization

### Bundle Analysis

Use the Next.js bundle analyzer:

```bash
# Install
npm install -D @next/bundle-analyzer

# Configure in next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Your Next.js config
});

# Run analysis
ANALYZE=true npm run build
```

### Dependency Management

Keep dependencies lean:

```bash
# Find and remove unused dependencies
npm install -D depcheck
npx depcheck

# Analyze dependency sizes
npm install -D size-limit
```

## Monitoring and Measurement

### Performance Monitoring

Set up monitoring with:

1. **Lighthouse CI**: Automated performance testing
2. **Web Vitals Reporting**: Track real-user metrics
3. **Error Tracking**: Monitor for runtime errors

### Implementation Example

```typescript
// pages/_app.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as Sentry from '@sentry/nextjs';
import { reportWebVitals } from 'next-web-vitals';

function reportToAnalytics({ name, delta, id }) {
  // Send metrics to your analytics service
  console.log({ name, delta, id });
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Report performance metrics
    reportWebVitals(reportToAnalytics);

    // Track page views
    const handleRouteChange = (url) => {
      // Track page view
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return <Component {...pageProps} />;
}

export default Sentry.withErrorBoundary(MyApp);
```

## Performance Optimization Checklist

Use this checklist before deploying changes:

- [ ] Images properly optimized with Next/Image
- [ ] Component memoization applied where appropriate
- [ ] React Query caching configured optimally
- [ ] Virtualization used for long lists
- [ ] API responses appropriately cached
- [ ] Bundle size analyzed and reduced if needed
- [ ] Tree-shaking verified working
- [ ] Code splitting implemented for large features
- [ ] Core Web Vitals metrics measured
- [ ] Lazy loading applied to below-fold content
