/**
 * @jest-environment node
 */
import { getSessionToken } from '@/lib/serverSession';
import { createServerClient } from '@supabase/ssr';

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ get: (n: string) => (n === 'c' ? { value: 'v' } : undefined) })),
  headers: jest.fn(async () => new Headers({ host: 'app.test' })),
}));

const getUser = jest.fn();
const getSession = jest.fn();
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({ auth: { getUser, getSession } })),
}));

describe('getSessionToken', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null and never reads the session when the JWT does not verify', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await getSessionToken()).toBeNull();
    expect(getSession).not.toHaveBeenCalled();
  });

  it('returns the access token for a verified user', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-abc' } } });
    expect(await getSessionToken()).toBe('jwt-abc');
  });

  it('returns null when verified but no session is present', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    getSession.mockResolvedValue({ data: { session: null } });
    expect(await getSessionToken()).toBeNull();
  });

  it('builds a read-only cookie adapter using the edubridge schema', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await getSessionToken();
    const opts = (createServerClient as jest.Mock).mock.calls[0][2];
    expect(opts.db).toEqual({ schema: 'edubridge' });
    expect(opts.cookies.get('c')).toBe('v');
    expect(opts.cookies.get('missing')).toBeUndefined();
    expect(() => opts.cookies.set()).not.toThrow();
    expect(() => opts.cookies.remove()).not.toThrow();
  });
});
