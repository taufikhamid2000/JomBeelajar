// src/__tests__/hooks/useTopicData.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useTopicData } from '@/hooks/useTopicData';
import { supabase } from '@/lib/supabase';
import { jest, describe, it, expect, beforeEach } from '../../setupTests';
import type { Subject, Topic, Quiz } from '@/types/topics';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  error: jest.fn(),
  debug: jest.fn(),
}));

// Define our response types to avoid using 'any'
interface MockResponse<T> {
  data: T | null;
  error: null | { message: string };
}

// Define the callback type for the 'then' method
type ThenCallback<T> = (value: MockResponse<T>) => void;

// Create a utility function to generate typed mocks
function createTypedMock<T>(returnValue?: MockResponse<T>) {
  // Create a mock object with method chains
  // We're using @ts-ignore because the exact typing of these mocks
  // is not essential for testing, and we want to avoid 'any'
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const mock = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    url: new URL('https://example.com'),
    headers: {},
    schema: '',
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
  };

  // Add response methods
  if (returnValue) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mock.single = jest.fn().mockResolvedValue(returnValue);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mock.then = jest.fn().mockImplementation((callback: ThenCallback<T>) => {
      callback(returnValue);
      return Promise.resolve(returnValue);
    });
  }

  return mock;
}

describe('useTopicData hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle missing parameters', async () => {
    const { result } = renderHook(() => useTopicData('', ''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Missing subject or topic parameters');
    expect(result.current.subjectData).toBeNull();
    expect(result.current.topicData).toBeNull();
  });

  it('should fetch topic data successfully', async () => {
    // Mock the Supabase responses
    const mockSubject: Subject = {
      id: 'sub1',
      name: 'Mathematics',
      slug: 'math',
    };
    const mockTopic: Topic = {
      id: 'top1',
      name: 'Algebra',
      description: 'Introduction to Algebra',
      difficulty_level: 1,
      time_estimate_minutes: 60,
      order_index: 1,
      chapters: [
        {
          id: 'ch1',
          name: 'Introduction to Algebra',
          order_index: 1,
          form: 1,
        },
      ],
    };
    const mockQuizzes: Quiz[] = [
      {
        id: 'q1',
        name: 'Algebra Basics',
        created_by: 'user1',
        created_at: '2023-01-01T00:00:00Z',
        verified: true,
        topic_id: 'top1',
      },
    ];

    // Setup the mock implementations
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - We're using a simplified mock for testing
    jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'subjects') {
        return createTypedMock<Subject>({ data: mockSubject, error: null });
      } else if (table === 'topics') {
        return createTypedMock<Topic>({ data: mockTopic, error: null });
      } else if (table === 'quizzes') {
        return createTypedMock<Quiz[]>({ data: mockQuizzes, error: null });
      } else if (table === 'quizzes_with_email') {
        return createTypedMock<Quiz[]>({ data: mockQuizzes, error: null });
      }
      return createTypedMock<null>({ data: null, error: null });
    });

    const { result } = renderHook(() => useTopicData('math', 'top1'));

    // Wait for the hook to finish loading
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.subjectData).toEqual(mockSubject);
    expect(result.current.topicData).toEqual(mockTopic);
  });

  it('should handle error when fetching subject data', async () => {
    // Setup the mock with an error response
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - We're using a simplified mock for testing
    jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'subjects') {
        return createTypedMock<Subject>({
          data: null,
          error: { message: 'Database error' },
        });
      }
      return createTypedMock<null>({ data: null, error: null });
    });

    const { result } = renderHook(() => useTopicData('math', 'top1'));

    // Wait for the hook to finish loading
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load subject: Database error');
    expect(result.current.subjectData).toBeNull();
  });
});
