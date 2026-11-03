// src/__tests__/services/dashboardService.test.ts
import {
  fetchDashboardData,
  fetchUserStats,
} from '@/services/dashboardService';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Dashboard Service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFetch.mockClear();
  });

  describe('fetchDashboardData', () => {
    const mockDashboardData = {
      user: {
        email: 'test@example.com',
        display_name: 'Test User',
        streak: 5,
        xp: 1000,
        level: 3,
        lastQuizDate: '2025-06-14T00:00:00Z',
      },
      subjects: [
        {
          id: '1',
          name: 'Mathematics',
          slug: 'mathematics',
          description: 'Math subjects',
          icon: '🔢',
          category: 'STEM',
          category_priority: 1,
          order_index: 1,
        },
      ],
      categories: ['STEM', 'Language Arts'],
      stats: {
        totalSubjects: 10,
        userRank: 5,
        completedQuizzes: 25,
      },
    };

    it('should fetch dashboard data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockDashboardData),
      });

      const result = await fetchDashboardData();

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      expect(result).toEqual(mockDashboardData);
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest
          .fn()
          .mockResolvedValueOnce({ error: 'Authentication required' }),
      });

      await expect(fetchDashboardData()).rejects.toThrow(
        'Authentication required'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchDashboardData()).rejects.toThrow('Network error');
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValueOnce({ error: 'Database error' }),
      });

      await expect(fetchDashboardData()).rejects.toThrow('Database error');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
      });

      await expect(fetchDashboardData()).rejects.toThrow(
        'HTTP 500: Internal Server Error'
      );
    });
  });

  describe('fetchUserStats', () => {
    const mockUserStats = {
      weeklyProgress: {
        quizzesCompleted: 8,
        quizzesTotal: 10,
        averageScore: 87.5,
      },
      achievements: [
        {
          title: 'Quiz Master',
          description: 'Completed 10 quizzes',
          bgColor: 'bg-yellow-100',
          earned: true,
          earnedDate: '2025-06-10',
        },
      ],
      streakInfo: {
        currentStreak: 5,
        longestStreak: 12,
        streakType: 'days',
      },
      recentActivity: [
        {
          type: 'quiz_completed',
          title: 'Math Quiz: Algebra',
          description: 'Completed with 92% score',
          date: '2025-06-14T10:30:00Z',
          score: 92,
        },
      ],
    };

    it('should fetch user stats successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUserStats),
      });

      const result = await fetchUserStats();

      expect(mockFetch).toHaveBeenCalledWith('/api/user-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      expect(result).toEqual(mockUserStats);
    });
    it('returns an empty guest payload on 401 instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest
          .fn()
          .mockResolvedValueOnce({ error: 'Authentication required' }),
      });

      const result = await fetchUserStats();
      expect(result).toEqual({
        weeklyProgress: {
          quizzesCompleted: 0,
          quizzesTotal: 0,
          averageScore: 0,
        },
        achievements: [],
        isGuest: true,
      });
    });

    it('should handle empty response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      const result = await fetchUserStats();
      expect(result).toEqual({});
    });
    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValueOnce({ error: 'Server error' }),
      });

      // fetchUserStats returns fallback data instead of throwing for server errors
      const result = await fetchUserStats();
      expect(result).toEqual({
        weeklyProgress: {
          quizzesCompleted: 7,
          quizzesTotal: 10,
          averageScore: 85,
        },
        achievements: [
          {
            title: 'Quiz Master',
            description: 'Completed 10 quizzes in a week',
            bgColor: 'bg-blue-100',
          },
          {
            title: 'High Scorer',
            description: 'Scored above 90% in 5 quizzes',
            bgColor: 'bg-green-100',
          },
          {
            title: 'Consistent Learner',
            description: 'Maintained a 7-day streak',
            bgColor: 'bg-yellow-100',
          },
        ],
      });
    });
  });
  describe('Error Handling', () => {
    it('should handle timeout errors consistently', async () => {
      const timeoutError = new Error('Request timeout');

      mockFetch.mockRejectedValueOnce(timeoutError);
      await expect(fetchDashboardData()).rejects.toThrow('Request timeout');

      // fetchUserStats returns fallback data instead of throwing for network errors
      mockFetch.mockRejectedValueOnce(timeoutError);
      const result = await fetchUserStats();
      expect(result).toEqual({
        weeklyProgress: {
          quizzesCompleted: 7,
          quizzesTotal: 10,
          averageScore: 85,
        },
        achievements: [
          {
            title: 'Quiz Master',
            description: 'Completed 10 quizzes in a week',
            bgColor: 'bg-blue-100',
          },
          {
            title: 'High Scorer',
            description: 'Scored above 90% in 5 quizzes',
            bgColor: 'bg-green-100',
          },
          {
            title: 'Consistent Learner',
            description: 'Maintained a 7-day streak',
            bgColor: 'bg-yellow-100',
          },
        ],
      });
    });

    it('should include credentials in all requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      await fetchDashboardData();
      await fetchUserStats();

      expect(mockFetch).toHaveBeenCalledTimes(2);

      const calls = mockFetch.mock.calls;
      calls.forEach((call) => {
        expect(call[1]).toHaveProperty('credentials', 'include');
      });
    });
  });
});
