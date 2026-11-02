/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/make-admin/route';
import { makeFrom } from '@/test-utils/supabaseMock';

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ get: () => undefined })),
  headers: jest.fn(async () => new Headers({ host: 'app.test' })),
}));
jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const getUser = jest.fn();
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({ auth: { getUser } })),
}));

const adminFrom = jest.fn();
jest.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: (...a: unknown[]) => adminFrom(...a) },
}));

const UID = '123e4567-e89b-12d3-a456-426614174000';
const post = (body: unknown) =>
  POST(new Request('https://app.test/api/admin/make-admin', { method: 'POST', body: JSON.stringify(body) }));

describe('POST /api/admin/make-admin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 on missing/invalid input before touching auth', async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ userId: 'not-a-uuid', role: 'admin' })).status).toBe(400);
    expect((await post({ userId: UID, role: 'superuser' })).status).toBe(400);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('401 for anonymous callers and writes nothing', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await post({ userId: UID, role: 'admin' })).status).toBe(401);
    expect(adminFrom).not.toHaveBeenCalled();
  });

  it('403 for a signed-in non-admin and writes nothing', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'caller' } } });
    const fm = makeFrom({ user_roles: { data: { role: 'moderator' }, error: null } });
    adminFrom.mockImplementation(fm.from);

    expect((await post({ userId: UID, role: 'admin' })).status).toBe(403);
    expect(fm.calls.user_roles.some((c) => c.method === 'upsert')).toBe(false);
  });

  it('403 when the caller has no role row at all', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'caller' } } });
    adminFrom.mockImplementation(makeFrom({ user_roles: { data: null, error: null } }).from);
    expect((await post({ userId: UID, role: 'admin' })).status).toBe(403);
  });

  it('500 (not success) when verifying the caller throws', async () => {
    getUser.mockRejectedValue(new Error('auth down'));
    expect((await post({ userId: UID, role: 'admin' })).status).toBe(500);
  });

  it('upserts the role for a verified admin caller', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'caller' } } });
    const fm = makeFrom({
      user_roles: [
        { data: { role: 'admin' }, error: null }, // caller check
        { data: [{}], error: null }, // upsert
      ],
    });
    adminFrom.mockImplementation(fm.from);

    const res = await post({ userId: UID, role: 'moderator' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(fm.calls.user_roles).toContainEqual({
      method: 'upsert',
      args: [{ user_id: UID, role: 'moderator' }],
    });
  });

  it('500 with a generic message when the upsert fails', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'caller' } } });
    adminFrom.mockImplementation(
      makeFrom({
        user_roles: [
          { data: { role: 'admin' }, error: null },
          { data: null, error: { message: 'constraint xyz' } },
        ],
      }).from
    );
    const res = await post({ userId: UID, role: 'admin' });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/constraint/);
  });
});
