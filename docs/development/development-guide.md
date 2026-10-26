# Development Guide for JomBeelajar

This guide provides essential information for developers working on the JomBeelajar project.

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Git
- Supabase account (for database and authentication)

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

### Database Setup

This project uses Supabase as the backend database. You'll need to set up the following tables in your Supabase project:

- Refer to the `database-schema-reference.md` for the complete schema
- Apply migrations using `npm run db:migrate`
- Use the migration scripts in the `supabase/migrations` directory for schema updates

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for feature development
- `feature/[feature-name]` - Feature branches
- `fix/[issue-number]` - Bug fix branches

### Code Contribution Process

1. Create a new branch from `develop`
2. Implement your changes
3. Write tests for your changes
4. Ensure all tests pass with `npm test`
5. Submit a pull request to the `develop` branch

### Testing

The project uses Jest and React Testing Library for testing:

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

When writing tests:

- Place component tests in `src/__tests__/components/`
- Place hook tests in `src/__tests__/hooks/`
- Place service tests in `src/__tests__/services/`
- Use the utilities in `src/test-utils/` for testing helpers

### Common Development Tasks

#### Adding a New Subject

1. Add the subject data to the Supabase `subjects` table
2. Create related chapter records in the `chapters` table
3. Implement the new subject UI in the appropriate components

#### Creating a New Quiz

1. Design the quiz questions and answers
2. Add the quiz to the appropriate topic in the `quizzes` table
3. Test the quiz functionality in the development environment

#### Modifying Admin Features

1. Ensure you have admin privileges in your development environment
2. Navigate to the admin panel to test your changes
3. Verify admin-only APIs are properly secured

## Troubleshooting

### Common Issues

#### Admin Authentication Issues

If you encounter admin authentication issues:

- Refer to `fix-admin-auth.md` for detailed troubleshooting steps
- Ensure your service role key is properly configured
- Verify your user has the admin role in the database

#### Database Connection Problems

If you have issues connecting to the database:

- Check your Supabase credentials in `.env.local`
- Verify your IP is allowlisted in Supabase
- Check the network tab for specific error messages

#### Next.js Build Errors

For build-time errors:

- Run `npm run lint` to identify and fix linting issues
- Check for TypeScript errors with `npm run prebuild`
- Verify all dependencies are properly installed

## Architecture Guidelines

### Component Structure

- Create reusable components in `src/components/ui/`
- Feature-specific components should go in their respective feature folders
- Use TypeScript interfaces to define component props

### Data Fetching

- Use React Query hooks for data fetching
- Implement service functions in `src/services/` directory
- Handle loading and error states properly

### State Management

- Use React Query for server state
- Use React's built-in state management for UI state
- For complex state, use context providers

### Styling

- Use Tailwind CSS for styling components
- Follow the project's design system
- Use responsive design principles

## Performance Considerations

- Use Next.js Image component for optimized images
- Implement proper memoization with useMemo and useCallback
- Minimize bundle size by avoiding unnecessary dependencies
- Use dynamic imports for code splitting

## Security Best Practices

- Never expose the service role key to the client
- Always validate input data on the server
- Use Supabase RLS policies for data access control
- Implement proper authorization checks in API routes
