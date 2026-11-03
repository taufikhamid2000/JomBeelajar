/**
 * @jest-environment node
 */
import { GET } from '@/app/api/profile/[userId]/achievements/route';
import { getUserAchievements } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ get: () => undefined })),
  headers: jest.fn(async () => new Headers({ host: 'app.test' })),
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));
jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));
jest.mock('@/lib/serverSession', () => ({ getSessionToken: jest.fn() }));
jest.mock('@/lib/jombeelajar-api', () => ({
  getMyAchievements: jest.fn(),
  getUserAchievements: jest.fn(),
}));

const apiAchievement = {
  id: 'a1',
  achievementType: 'quiz_master',
  title: 'Quiz Master',
  description: 'Done',
  icon: 'star',
  earnedAt: '2026-01-01T00:00:00Z',
  progress: null,
  maxProgress: null,
};

const call = (userId = 'u-123') =>
  GET(new Request('https://app.test/api/profile/x/achievements'), {
    params: Promise.resolve({ userId }),
  });

describe('GET /api/profile/[userId]/achievements (other user)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getUserAchievements)
      .mockResolvedValue([apiAchievement] as never);
  });

  it('forwards the viewer token and is private, no-store when logged in', async () => {
    jest.mocked(getSessionToken).mockResolvedValue('viewer-token');

    const res = await call();

    expect(getUserAchievements).toHaveBeenCalledWith('u-123', 'viewer-token');
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('Vary')).toContain('Authorization');
    const body = await res.json();
    expect(body[0]).toMatchObject({
      id: 'a1',
      user_id: 'u-123',
      title: 'Quiz Master',
    });
  });

  it('stays anonymous and publicly cached for 5 minutes when logged out', async () => {
    jest.mocked(getSessionToken).mockResolvedValue(null);

    const res = await call();

    expect(getUserAchievements).toHaveBeenCalledWith('u-123', null);
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    expect(res.headers.get('Vary')).toBeNull();
  });

  it('treats a failing session lookup as anonymous, not an error', async () => {
    jest
      .mocked(getSessionToken)
      .mockRejectedValue(new Error('cookies unavailable'));

    const res = await call();

    expect(res.status).toBe(200);
    expect(getUserAchievements).toHaveBeenCalledWith('u-123', null);
    expect(res.headers.get('Cache-Control')).toMatch(/^public, s-maxage=300/);
  });

  it('returns 500 when the upstream API fails', async () => {
    jest.mocked(getSessionToken).mockResolvedValue('viewer-token');
    jest.mocked(getUserAchievements).mockRejectedValue(new Error('boom'));

    const res = await call();

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to fetch achievements');
  });

  it('serves guest as an empty, publicly cached list without calling the API', async () => {
    const res = await call('guest');

    expect(await res.json()).toEqual([]);
    expect(res.headers.get('Cache-Control')).toMatch(/^public/);
    expect(getUserAchievements).not.toHaveBeenCalled();
  });
});
