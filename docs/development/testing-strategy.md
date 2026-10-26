# Testing Strategy

This document outlines the testing approach for the JomBeelajar application.

## Testing Pyramid

Our testing strategy follows the testing pyramid approach:

1. **Unit Tests**: Test individual functions, hooks, and components in isolation
2. **Integration Tests**: Test interactions between multiple components
3. **End-to-End Tests**: Test complete user flows through the application

![Testing Pyramid](https://martinfowler.com/articles/practical-test-pyramid/testPyramid.png)

## Test Structure

The test files are organized to mirror the application structure:

```
src/
└── __tests__/
    ├── components/       # Component tests
    ├── hooks/            # Custom hook tests
    ├── lib/              # Utility function tests
    └── services/         # Service function tests
```

## Testing Tools

- **Jest**: Testing framework
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: API mocking
- **jest-dom**: Custom DOM matchers
- **@testing-library/user-event**: Simulate user interactions

## Test Types

### Unit Tests

Unit tests focus on testing individual functions and components in isolation.

#### Example: Testing a Utility Function

```typescript
// src/__tests__/lib/calculateXP.test.ts
import { calculateXP } from '../../lib/calculateXP';

describe('calculateXP', () => {
  it('calculates XP correctly for a perfect quiz score', () => {
    const result = calculateXP({
      quizScore: 100,
      timeSpent: 120,
      difficulty: 'hard',
    });

    expect(result).toBe(150);
  });

  it('returns zero XP for a zero quiz score', () => {
    const result = calculateXP({
      quizScore: 0,
      timeSpent: 120,
      difficulty: 'easy',
    });

    expect(result).toBe(0);
  });
});
```

#### Example: Testing a React Component

```tsx
// src/__tests__/components/QuizQuestion.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import QuizQuestion from '../../components/quiz/QuizQuestion';

describe('QuizQuestion', () => {
  const mockQuestion = {
    id: 'q1',
    text: 'What is 2+2?',
    options: [
      { id: 'a', text: '3', isCorrect: false },
      { id: 'b', text: '4', isCorrect: true },
      { id: 'c', text: '5', isCorrect: false },
    ],
  };

  const mockOnSelect = jest.fn();

  it('renders the question text', () => {
    render(
      <QuizQuestion
        question={mockQuestion}
        selectedOptionId={null}
        onSelectOption={mockOnSelect}
      />
    );

    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  });

  it('calls onSelectOption when an option is clicked', () => {
    render(
      <QuizQuestion
        question={mockQuestion}
        selectedOptionId={null}
        onSelectOption={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('4'));
    expect(mockOnSelect).toHaveBeenCalledWith('b');
  });
});
```

### Testing Custom Hooks

```tsx
// src/__tests__/hooks/useTopicData.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTopicData } from '../../hooks/useTopicData';

// Mock the API calls
jest.mock('../../services/topicService', () => ({
  fetchTopic: jest.fn().mockResolvedValue({
    id: 'topic1',
    title: 'Example Topic',
    chapters: [
      { id: 'ch1', title: 'Chapter 1' },
      { id: 'ch2', title: 'Chapter 2' },
    ],
  }),
}));

const wrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTopicData', () => {
  it('returns topic data when successful', async () => {
    const { result } = renderHook(() => useTopicData('topic1'), { wrapper });

    // Initial state should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Check the data
    expect(result.current.data).toEqual({
      id: 'topic1',
      title: 'Example Topic',
      chapters: [
        { id: 'ch1', title: 'Chapter 1' },
        { id: 'ch2', title: 'Chapter 2' },
      ],
    });
  });
});
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

```tsx
// src/__tests__/integration/QuizFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuizPage from '../../pages/quiz/[id]';

// Mock the API responses
jest.mock('../../services/quizService', () => ({
  fetchQuiz: jest.fn().mockResolvedValue({
    id: 'quiz1',
    title: 'Math Quiz',
    questions: [
      {
        id: 'q1',
        text: 'What is 2+2?',
        options: [
          { id: 'a', text: '3', isCorrect: false },
          { id: 'b', text: '4', isCorrect: true },
          { id: 'c', text: '5', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        text: 'What is 3×3?',
        options: [
          { id: 'd', text: '6', isCorrect: false },
          { id: 'e', text: '9', isCorrect: true },
          { id: 'f', text: '12', isCorrect: false },
        ],
      },
    ],
  }),
  submitQuizAnswers: jest.fn().mockResolvedValue({
    score: 100,
    correctAnswers: 2,
    totalQuestions: 2,
    xpEarned: 50,
  }),
}));

// Mock the router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'quiz1' },
    push: jest.fn(),
  }),
}));

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('Quiz Flow', () => {
  it('allows user to complete a quiz and see results', async () => {
    // Setup user event
    const user = userEvent.setup();

    // Render the quiz page
    renderWithProviders(<QuizPage />);

    // Wait for the quiz to load
    await waitFor(() => {
      expect(screen.getByText('Math Quiz')).toBeInTheDocument();
    });

    // Answer the first question
    await user.click(screen.getByText('4'));

    // Go to next question
    await user.click(screen.getByText('Next'));

    // Answer the second question
    await user.click(screen.getByText('9'));

    // Submit the quiz
    await user.click(screen.getByText('Submit'));

    // Check the results
    await waitFor(() => {
      expect(screen.getByText('Quiz Results')).toBeInTheDocument();
      expect(screen.getByText('Score: 100%')).toBeInTheDocument();
      expect(screen.getByText('XP Earned: 50')).toBeInTheDocument();
    });
  });
});
```

## Mocking Strategies

### Mocking Supabase

```typescript
// src/__tests__/mocks/supabase.ts
export const mockSupabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
      },
      error: null,
    }),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((callback) => {
      // Customize the response based on the called method
      return Promise.resolve(callback({ data: [], error: null }));
    }),
  }),
};

jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabase,
}));
```

### Mocking API Responses with MSW

```typescript
// src/__tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/topics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        topics: [
          { id: 'topic1', title: 'Topic 1' },
          { id: 'topic2', title: 'Topic 2' },
        ],
      })
    );
  }),

  rest.get('/api/topics/:id', (req, res, ctx) => {
    const { id } = req.params;

    return res(
      ctx.status(200),
      ctx.json({
        topic: {
          id,
          title: `Topic ${id}`,
          chapters: [{ id: 'ch1', title: 'Chapter 1' }],
        },
      })
    );
  }),

  rest.post('/api/quizzes/:id/submit', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        score: 80,
        correctAnswers: 8,
        totalQuestions: 10,
        xpEarned: 40,
      })
    );
  }),
];

// src/__tests__/setup.js
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Setup requests interception using the given handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen());

// Reset any handlers that might added during the tests
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
```

## Test Coverage

We aim for the following test coverage targets:

- **Overall coverage**: 80%+
- **Core components**: 90%+
- **Utility functions**: 95%+
- **UI components**: 75%+

Generate coverage reports with:

```bash
npm run test:coverage
```

## Testing Guidelines

### Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how it does it
2. **Write meaningful assertions**: Test important outcomes, not implementation details
3. **Use realistic test data**: Use data that resembles real-world usage
4. **Keep tests independent**: Each test should run in isolation
5. **Follow the AAA pattern**: Arrange, Act, Assert

### What to Test

- **Components**: Rendering, user interactions, conditional rendering
- **Hooks**: Initial state, state changes, side effects
- **Services**: API calls, error handling, data transformations
- **Utils**: Input/output, edge cases, error handling

### What Not to Test

- Third-party libraries (assume they work correctly)
- Implementation details that users don't interact with
- Styling (unless critical for functionality)
- Complex animations

## Continuous Integration

Tests run automatically on:

- Every pull request
- Push to main branch
- Nightly builds

Failed tests block deployment to production environments.

## Test-Driven Development (TDD)

For critical features, follow TDD:

1. Write a failing test
2. Implement the minimum code to pass the test
3. Refactor while keeping tests passing
