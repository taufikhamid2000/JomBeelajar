/**
 * @jest-environment node
 */
import { requireAdmin } from '@/lib/requireAdmin';
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

describe('requireAdmin (server-side admin gate, fails closed)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 when there is no verified user', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await requireAdmin()).toEqual({ ok: false, status: 401, error: 'Unauthorized' });
    expect(adminFrom).not.toHaveBeenCalled();
  });

  it('ok for a user whose role row is admin, looked up by the verified user id', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u-admin' } } });
    const { from, calls } = makeFrom({
      user_roles: { data: { role: 'admin' }, error: null },
    });
    adminFrom.mockImplementation(from);

    expect(await requireAdmin()).toEqual({ ok: true, userId: 'u-admin' });
    expect(calls.user_roles).toContainEqual({ method: 'eq', args: ['user_id', 'u-admin'] });
  });

  it.each([
    ['no role row', null],
    ['moderator', { role: 'moderator' }],
    ['user', { role: 'user' }],
    ['Admin with wrong case', { role: 'Admin' }],
  ])('403 for %s', async (_label, row) => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    adminFrom.mockImplementation(makeFrom({ user_roles: { data: row, error: null } }).from);
    expect(await requireAdmin()).toEqual({ ok: false, status: 403, error: 'Forbidden' });
  });

  it('403 (fail closed) when the role lookup errors', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    adminFrom.mockImplementation(
      makeFrom({ user_roles: { data: { role: 'admin' }, error: { message: 'db down' } } }).from
    );
    expect(await requireAdmin()).toEqual({ ok: false, status: 403, error: 'Forbidden' });
  });

  it('403 (fail closed) when Supabase Auth throws', async () => {
    getUser.mockRejectedValue(new Error('network'));
    expect(await requireAdmin()).toEqual({ ok: false, status: 403, error: 'Forbidden' });
  });

  it('403 (fail closed) when the service-role client is unavailable', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    adminFrom.mockImplementation(() => {
      throw new Error('Missing Supabase admin credentials');
    });
    expect(await requireAdmin()).toEqual({ ok: false, status: 403, error: 'Forbidden' });
  });
});
