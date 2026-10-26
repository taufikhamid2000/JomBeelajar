# App Router Migration Guide

## Overview

This document outlines the migration from Next.js Pages Router to App Router in the EduBridge project. The App Router is Next.js's new routing system that offers improved features like:

- Server Components
- Nested Layouts
- Improved Loading States
- Route Handlers
- SEO Metadata API

## Migration Steps

### 1. Run the Migration Script

We've created a migration script to help transition smoothly from Pages Router to App Router:

```bash
npm run migrate:app-router
```

This script:

- Creates a backup of your Pages Router files in `src/_pages_backup`
- Removes the `src/pages` directory
- Provides guidance on next steps

### 2. Review the App Router Structure

The project is now using the following App Router structure:

```
src/app/
├── layout.tsx        # Root layout with <html>, <body>, <Providers>
├── page.tsx          # Home page
├── quiz/
│   ├── layout.tsx    # Layout for all quiz pages
│   ├── [subject]/
│   │   ├── chapters/
│   │   ├── [topic]/
│   │   │   ├── page.tsx
│   │   │   ├── client-page.tsx
│   │   │   ├── ...
```

### 3. Key Changes

- **Metadata API**: We now use the Metadata API instead of `<Head>` components
- **Layouts**: Shared UI is defined in layout components
- **Client Components**: Components marked with 'use client' directive
- **Server Components**: Default components that run on the server

### 4. Testing After Migration

After migration, make sure to test:

- Navigation between pages
- Authentication flows
- Data fetching
- Form submissions
- Error handling

### 5. Next Steps

- Remove any Pages Router specific packages or utilities
- Update imports to use the new App Router patterns
- Review and update tests if necessary

## Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Migration Guide from Next.js](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
