// src/__tests__/hooks/useTopicData.test.tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTopicData } from '@/hooks/useTopicData';
import { fetchTopicDataAPI } from '@/services/topicService';

// The router and search params must be referentially stable: the hook lists
// them as effect dependencies, so a fresh object per render would refetch in
// a loop.
const mockPush = jest.fn();
const mockRouter = { push: mockPush };
let mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/services/topicService', () => ({
  fetchTopicDataAPI: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockFetch = jest.mocked(fetchTopicDataAPI);

const subject = { id: 'sub1', name: 'Mathematics', slug: 'math' };
const topic = {
  id: 'top1',
  name: 'Algebra',
  description: 'Introduction to Algebra',
  difficulty_level: 1,
  time_estimate_minutes: 60,
  order_index: 1,
  chapters: [],
};
const chapter = { id: 'ch1', name: 'Intro', order_index: 1, form: 1 };
const quizzes = [
  {
    id: 'q1',
    name: 'Algebra Basics',
    created_by: 'user1',
    created_at: '2023-01-01T00:00:00Z',
    verified: true,
    topic_id: 'top1',
  },
];

describe('useTopicData hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('reports missing parameters without fetching', async () => {
    const { result } = renderHook(() => useTopicData('', ''));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Missing subject or topic parameters');
    expect(result.current.subjectData).toBeNull();
    expect(result.current.topicData).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('loads subject, topic, chapter and quizzes from the topic API', async () => {
    mockFetch.mockResolvedValue({ subject, topic, chapter, quizzes } as never);

    const { result } = renderHook(() => useTopicData('math', 'top1'));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith('top1');
    expect(result.current.error).toBeNull();
    expect(result.current.subjectData).toEqual(subject);
    expect(result.current.topicData).toEqual(topic);
    expect(result.current.chapterData).toEqual(chapter);
    expect(result.current.quizzes).toEqual(quizzes);
  });

  it('falls back to chapter query params when the API returns no chapter', async () => {
    mockSearchParams = new URLSearchParams({
      chapterId: 'ch9',
      chapterName: 'Linear%20Equations',
    });
    mockFetch.mockResolvedValue({
      subject,
      topic,
      chapter: null,
      quizzes: [],
    } as never);

    const { result } = renderHook(() => useTopicData('math', 'top1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.chapterData).toEqual({
      id: 'ch9',
      name: 'Linear Equations',
      form: 0,
      order_index: 0,
    });
  });

  it('surfaces an API error message', async () => {
    mockFetch.mockResolvedValue({
      subject: null,
      topic: null,
      chapter: null,
      quizzes: [],
      error: 'Database error',
    });

    const { result } = renderHook(() => useTopicData('math', 'top1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Database error');
    expect(result.current.subjectData).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to the dashboard after a not-found error', async () => {
    jest.useFakeTimers();
    try {
      mockFetch.mockResolvedValue({
        subject: null,
        topic: null,
        chapter: null,
        quizzes: [],
        error: 'Topic not found',
      });

      const { result } = renderHook(() => useTopicData('math', 'nope'));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe('Topic not found');
      expect(mockPush).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    } finally {
      jest.useRealTimers();
    }
  });
});
