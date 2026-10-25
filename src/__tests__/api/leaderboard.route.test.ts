/**
 * @jest-environment node
 */
import { GET } from '@/app/api/leaderboard/route';
import { getLeaderboard } from '@/lib/jombeelajar-api';

// Mock the boundaries: the JomBeelajar API client and the Supabase server client.
// The test asserts our proxy route's own logic — query mapping, camelCase ->
// User shape, and server-side rank computation.
jest.mock('@/lib/jombeelajar-api', () => ({
  getLeaderboard: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ get: () => undefined })),
  headers: jest.fn(async () => new Headers({ host: 'app.test' })),
}));

const getSessionMock = jest.fn(async () => ({ data: { session: null } }));
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: { getSession: getSessionMock },
  })),
}));

describe('GET /api/leaderboard (proxy route)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps JomBeelajar API weekly entries to the User shape and requests the weekly period', async () => {
    (getLeaderboard as jest.Mock).mockResolvedValue([
      { userId: 'u1', displayName: 'Ada', avatarUrl: null, xp: 100, level: 3, weeklyXp: 20 },
      { userId: 'u2', displayName: 'Lin', avatarUrl: 'a.png', xp: 80, level: 2, weeklyXp: 10 },
    ]);

    const res = await GET(
      new Request('https://app.test/api/leaderboard?timeFrame=weekly')
    );
    const body = await res.json();

    expect(getLeaderboard).toHaveBeenCalledWith(null, {
      period: 'weekly',
      limit: 100,
    });
    expect(body.data[0]).toMatchObject({
      id: 'u1',
      display_name: 'Ada',
      avatar_url: null,
      xp: 100,
      level: 3,
      weeklyXp: 20,
    });
    // No session -> no rank
    expect(body.currentUserRank).toBeNull();
  });

  it('computes currentUserRank when a session matches an entry', async () => {
    getSessionMock.mockResolvedValueOnce({
      data: { session: { user: { id: 'u2' } } },
    } as never);
    (getLeaderboard as jest.Mock).mockResolvedValue([
      { userId: 'u1', displayName: 'Ada', avatarUrl: null, xp: 100, level: 3, weeklyXp: 20 },
      { userId: 'u2', displayName: 'Lin', avatarUrl: null, xp: 80, level: 2, weeklyXp: 10 },
    ]);

    const res = await GET(new Request('https://app.test/api/leaderboard'));
    const body = await res.json();

    // allTime (default) -> period undefined
    expect(getLeaderboard).toHaveBeenCalledWith(null, {
      period: undefined,
      limit: 100,
    });
    expect(body.currentUserRank).toBe(2);
  });
});
