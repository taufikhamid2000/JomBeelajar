/**
 * @jest-environment node
 */
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as refresh } from '@/app/api/auth/refresh-session/route';
import { createServerClient } from '@supabase/ssr';

const cookieSet = jest.fn();
const cookieGetAll = jest.fn();
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    getAll: () => cookieGetAll(),
    set: (...a: unknown[]) => cookieSet(...a),
  })),
  headers: jest.fn(async () => new Headers({ host: 'app.test' })),
}));
jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const signOut = jest.fn();
const refreshSession = jest.fn();
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({ auth: { signOut, refreshSession } })),
}));

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signOut.mockResolvedValue({ error: null });
  });

  it('signs out and expires every leftover sb-* cookie, leaving others alone', async () => {
    cookieGetAll.mockReturnValue([
      { name: 'sb-abc-auth-token.0', value: 'x' },
      { name: 'sb-abc-auth-token.1', value: 'y' },
      { name: 'theme', value: 'dark' },
    ]);

    const res = await logout();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(signOut).toHaveBeenCalledTimes(1);
    const expired = cookieSet.mock.calls.filter(([, v]) => v === '');
    expect(expired.map(([n]) => n)).toEqual(['sb-abc-auth-token.0', 'sb-abc-auth-token.1']);
    for (const [, , opts] of expired) {
      expect(opts).toMatchObject({ maxAge: 0, path: '/' });
    }
  });

  it('wires the cookie adapter so supabase cookie writes reach the cookie store', async () => {
    cookieGetAll.mockReturnValue([]);
    await logout();
    const opts = (createServerClient as jest.Mock).mock.calls[0][2];
    opts.cookies.setAll([{ name: 'sb-x', value: 'v', options: { path: '/' } }]);
    expect(cookieSet).toHaveBeenCalledWith('sb-x', 'v', { path: '/' });
    cookieGetAll.mockReturnValue([{ name: 'a', value: 'b' }]);
    expect(opts.cookies.getAll()).toEqual([{ name: 'a', value: 'b' }]);
  });
});

describe('POST /api/auth/refresh-session', () => {
  const post = (body: unknown) =>
    refresh(
      new Request('https://app.test/api/auth/refresh-session', {
        method: 'POST',
        headers: { host: 'app.test' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    );

  beforeEach(() => {
    jest.clearAllMocks();
    cookieGetAll.mockReturnValue([]);
  });

  it('400 without a refresh token, and does not call Supabase', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('returns only id/email of the user, never the tokens', async () => {
    refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'AT',
          refresh_token: 'RT',
          user: { id: 'u1', email: 'a@b.c', app_metadata: { secret: true } },
        },
      },
      error: null,
    });

    const res = await post({ refreshToken: 'old-rt' });
    const text = JSON.stringify(await res.json());

    expect(res.status).toBe(200);
    expect(JSON.parse(text)).toEqual({ success: true, user: { id: 'u1', email: 'a@b.c' } });
    expect(text).not.toMatch(/AT|RT|secret/);
    expect(refreshSession).toHaveBeenCalledWith({ refresh_token: 'old-rt' });
  });

  it('writes refreshed session cookies through the cookie adapter', async () => {
    refreshSession.mockResolvedValue({ data: { session: null }, error: null });
    await post({ refreshToken: 'rt' });
    const opts = (createServerClient as jest.Mock).mock.calls[0][2];
    opts.cookies.setAll([{ name: 'sb-1', value: 'v', options: { path: '/' } }]);
    expect(cookieSet).toHaveBeenCalledWith('sb-1', 'v', { path: '/' });
    expect(opts.cookies.getAll()).toEqual([]);
  });

  it('401 with the Supabase message when the refresh is rejected', async () => {
    refreshSession.mockResolvedValue({ data: {}, error: { message: 'Invalid Refresh Token' } });
    const res = await post({ refreshToken: 'bad' });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Invalid Refresh Token' });
  });

  it('500 generic on unexpected failure (including malformed JSON)', async () => {
    refreshSession.mockRejectedValue(new Error('kaput'));
    expect((await post({ refreshToken: 'rt' })).status).toBe(500);
    expect((await post('{bad')).status).toBe(500);
  });
});
