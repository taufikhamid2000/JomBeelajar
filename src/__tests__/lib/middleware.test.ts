/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { middleware, config } from '@/middleware';

jest.mock('@/lib/logger', () => ({
  log: jest.fn(),
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const getSession = jest.fn();
let adapter: { setAll: (c: { name: string; value: string; options?: object }[]) => void } | undefined;
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn((_u: string, _k: string, opts: { cookies: typeof adapter }) => {
    adapter = opts.cookies;
    return { auth: { getSession } };
  }),
}));

const req = (path: string) => new NextRequest(`https://jombeelajar.taufikhamid.com${path}`);

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
  });

  it.each(['/auth', '/_next/static/x.js', '/favicon.ico', '/.well-known/a'])(
    'skips session work for %s',
    async (p) => {
      const res = await middleware(req(p));
      expect(res.status).toBe(200);
      expect(getSession).not.toHaveBeenCalled();
    }
  );

  it('serves a no-store response when the session is fine', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u' } } }, error: null });
    const res = await middleware(req('/quiz'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toMatch(/no-store/);
  });

  it('propagates cookies Supabase refreshes onto the response', async () => {
    getSession.mockImplementation(async () => {
      adapter!.setAll([{ name: 'sb-ref-auth-token', value: 'new', options: { path: '/' } }]);
      return { data: { session: {} }, error: null };
    });
    const res = await middleware(req('/quiz'));
    expect(res.cookies.get('sb-ref-auth-token')?.value).toBe('new');
  });

  it('on a session error redirects /dashboard to /auth, uncached, with cookies cleared', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: new Error('bad jwt') });
    const res = await middleware(req('/dashboard'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth');
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    expect(res.cookies.get('sb-access-token')?.value).toBe('');
  });

  it('on a session error does not redirect public pages, but clears cookies', async () => {
    getSession.mockRejectedValue(new Error('network'));
    const res = await middleware(req('/subjects'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    expect(res.cookies.get('sb-refresh-token')?.value).toBe('');
  });

  it('matcher excludes api, auth and static assets', () => {
    const re = new RegExp(`^${config.matcher[0]}$`);
    expect(re.test('/dashboard')).toBe(true);
    for (const p of ['/api/x', '/auth', '/_next/x', '/favicon.ico']) expect(re.test(p)).toBe(false);
  });
});
