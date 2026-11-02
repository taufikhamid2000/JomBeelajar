import { verifyAdminAccess, checkAdminAccess } from '@/services/adminAuthService';
import { isUserAdmin, updateUserRole, toggleUserDisabled, logAdminAction, getSiteConfig, updateSiteConfig, getAdminLogs, fetchAdminUsers } from '@/services/adminService';
import { supabase } from '@/lib/supabase';
import { makeFrom } from '@/test-utils/supabaseMock';

jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: jest.fn() }, from: jest.fn(), rpc: jest.fn() },
}));

const getSession = supabase.auth.getSession as unknown as jest.Mock;
const from = supabase.from as unknown as jest.Mock;
const rpc = supabase.rpc as unknown as jest.Mock;

const withSession = (id: string | null) =>
  getSession.mockResolvedValue({ data: { session: id ? { user: { id } } : null } });

describe('verifyAdminAccess / checkAdminAccess (fail closed)', () => {
  beforeEach(() => jest.resetAllMocks());

  it('denies with "Authentication required" when there is no session', async () => {
    withSession(null);
    const r = await verifyAdminAccess();
    expect(r.isAdmin).toBe(false);
    expect(r.error?.message).toMatch(/Authentication required/);
    expect(from).not.toHaveBeenCalled();
  });

  it('grants only for role === admin', async () => {
    withSession('u1');
    const fm = makeFrom({ user_roles: { data: { role: 'admin' }, error: null } });
    from.mockImplementation(fm.from);
    expect(await verifyAdminAccess()).toEqual({ isAdmin: true, userId: 'u1', error: null });
    expect(fm.calls.user_roles).toContainEqual({ method: 'eq', args: ['user_id', 'u1'] });
    expect(await checkAdminAccess()).toEqual({ success: true, error: null });
  });

  it.each([[null], [{ role: 'user' }], [{ role: 'moderator' }]])(
    'denies non-admin row %j',
    async (row) => {
      withSession('u1');
      from.mockImplementation(makeFrom({ user_roles: { data: row, error: null } }).from);
      const r = await verifyAdminAccess();
      expect(r.isAdmin).toBe(false);
      expect(r.error?.message).toBe('Admin access required');
    }
  );

  it('denies on a role query error, even if data claims admin', async () => {
    withSession('u1');
    from.mockImplementation(
      makeFrom({ user_roles: { data: { role: 'admin' }, error: { message: 'rls denied' } } }).from
    );
    const r = await verifyAdminAccess();
    expect(r.isAdmin).toBe(false);
    expect(r.error?.message).toMatch(/Role check failed: rls denied/);
  });

  it('denies on thrown Error and on thrown non-Error values', async () => {
    getSession.mockRejectedValue(new Error('net'));
    expect(await verifyAdminAccess()).toMatchObject({ isAdmin: false });

    getSession.mockRejectedValue({ code: 42 });
    const r = await verifyAdminAccess();
    expect(r.isAdmin).toBe(false);
    expect(r.error?.message).toBe('{"code":42}');

    getSession.mockRejectedValue(undefined);
    expect((await verifyAdminAccess()).error?.message).toBe('Unknown error verifying admin access');
    expect(await checkAdminAccess()).toMatchObject({ success: false });
  });
});

describe('adminService', () => {
  beforeEach(() => jest.resetAllMocks());

  it('isUserAdmin: true only for admin, false on error/throw', async () => {
    from.mockImplementation(makeFrom({ user_roles: { data: { role: 'admin' }, error: null } }).from);
    expect(await isUserAdmin('u')).toBe(true);
    from.mockImplementation(makeFrom({ user_roles: { data: { role: 'user' }, error: null } }).from);
    expect(await isUserAdmin('u')).toBe(false);
    from.mockImplementation(makeFrom({ user_roles: { data: { role: 'admin' }, error: { message: 'x' } } }).from);
    expect(await isUserAdmin('u')).toBe(false);
    from.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(await isUserAdmin('u')).toBe(false);
  });

  it('updateUserRole upserts the role; false on error', async () => {
    const fm = makeFrom({ user_roles: { data: null, error: null } });
    from.mockImplementation(fm.from);
    expect(await updateUserRole('u1', 'moderator')).toBe(true);
    expect(fm.calls.user_roles[0].args[0]).toMatchObject({ user_id: 'u1', role: 'moderator' });

    from.mockImplementation(makeFrom({ user_roles: { data: null, error: { message: 'x' } } }).from);
    expect(await updateUserRole('u1', 'admin')).toBe(false);
    from.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(await updateUserRole('u1', 'admin')).toBe(false);
  });

  it('toggleUserDisabled updates the profile row for that user', async () => {
    const fm = makeFrom({ user_profiles: { data: null, error: null } });
    from.mockImplementation(fm.from);
    expect(await toggleUserDisabled('u1', true)).toBe(true);
    expect(fm.calls.user_profiles[0].args[0]).toMatchObject({ is_disabled: true });
    expect(fm.calls.user_profiles).toContainEqual({ method: 'eq', args: ['id', 'u1'] });

    from.mockImplementation(makeFrom({ user_profiles: { data: null, error: { message: 'x' } } }).from);
    expect(await toggleUserDisabled('u1', false)).toBe(false);
    from.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(await toggleUserDisabled('u1', false)).toBe(false);
  });

  it('logAdminAction serialises details and returns the rpc result; null on failure', async () => {
    rpc.mockResolvedValue({ data: 'log-1', error: null });
    expect(await logAdminAction('a', 'delete', 'quiz', 'q1', { why: 'spam' })).toBe('log-1');
    expect(rpc).toHaveBeenCalledWith('log_admin_action', {
      admin_id: 'a', action: 'delete', entity_type: 'quiz', entity_id: 'q1',
      details: JSON.stringify({ why: 'spam' }),
    });
    await logAdminAction('a', 'x', 'y', 'z');
    expect(rpc.mock.calls[1][1].details).toBeNull();

    rpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await logAdminAction('a', 'x', 'y', 'z')).toBeNull();
    rpc.mockRejectedValue(new Error('x'));
    expect(await logAdminAction('a', 'x', 'y', 'z')).toBeNull();
  });

  it('site config get/update handle success, error and throw', async () => {
    from.mockImplementation(makeFrom({ site_config: { data: { config: { siteTitle: 'T' } }, error: null } }).from);
    expect(await getSiteConfig()).toEqual({ siteTitle: 'T' });
    expect(await updateSiteConfig('general', { siteTitle: 'N' })).toBe(true);

    from.mockImplementation(makeFrom({ site_config: { data: null, error: { message: 'x' } } }).from);
    expect(await getSiteConfig()).toBeNull();
    expect(await updateSiteConfig('general', {})).toBe(false);

    from.mockImplementation(() => {
      throw new Error('x');
    });
    expect(await getSiteConfig()).toBeNull();
    expect(await updateSiteConfig('general', {})).toBe(false);
  });

  it('getAdminLogs paginates with range and returns [] on error', async () => {
    const fm = makeFrom({ admin_logs: { data: [{ id: '1' }], error: null } });
    from.mockImplementation(fm.from);
    expect(await getAdminLogs(10, 20)).toEqual([{ id: '1' }]);
    expect(fm.calls.admin_logs).toContainEqual({ method: 'range', args: [20, 29] });

    from.mockImplementation(makeFrom({ admin_logs: { data: null, error: { message: 'x' } } }).from);
    expect(await getAdminLogs()).toEqual([]);
    from.mockImplementation(() => {
      throw new Error('x');
    });
    expect(await getAdminLogs()).toEqual([]);
  });

  describe('fetchAdminUsers', () => {
    it('refuses non-admins without querying profiles', async () => {
      withSession('u1');
      const fm = makeFrom({ user_roles: { data: { role: 'user' }, error: null } });
      from.mockImplementation(fm.from);
      const r = await fetchAdminUsers();
      expect(r.data).toBeNull();
      expect(r.error?.message).toBe('Admin access required');
      expect(fm.calls.user_profiles).toBeUndefined();
    });

    it('refuses when the role check errors', async () => {
      withSession('u1');
      from.mockImplementation(makeFrom({ user_roles: { data: null, error: { message: 'x' } } }).from);
      expect((await fetchAdminUsers()).error?.message).toBe('Admin access required');
    });

    it('merges roles into profiles for admins (default role "user")', async () => {
      withSession('u1');
      from.mockImplementation(
        makeFrom({
          user_roles: [
            { data: { role: 'admin' }, error: null },
            { data: [{ user_id: 'p1', role: 'moderator' }], error: null },
          ],
          user_profiles: {
            data: [
              { id: 'p1', display_name: 'Ada Lovelace' },
              { id: 'abcdefghij', display_name: null },
            ],
            error: null,
          },
        }).from
      );
      const r = await fetchAdminUsers();
      expect(r.error).toBeNull();
      expect(r.data).toMatchObject([
        { id: 'p1', role: 'moderator', email: 'ada.lovelace@example.com' },
        { id: 'abcdefghij', role: 'user', email: 'abcdefgh@example.com' },
      ]);
    });

    it('propagates profile/role fetch errors and thrown errors', async () => {
      withSession('u1');
      from.mockImplementation(
        makeFrom({
          user_roles: { data: { role: 'admin' }, error: null },
          user_profiles: { data: null, error: { message: 'profiles failed' } },
        }).from
      );
      expect((await fetchAdminUsers()).error).toEqual({ message: 'profiles failed' });

      from.mockImplementation(
        makeFrom({
          user_roles: [
            { data: { role: 'admin' }, error: null },
            { data: null, error: { message: 'roles failed' } },
          ],
          user_profiles: { data: [], error: null },
        }).from
      );
      expect((await fetchAdminUsers()).error).toEqual({ message: 'roles failed' });

      getSession.mockRejectedValue(new Error('net'));
      expect((await fetchAdminUsers()).error?.message).toBe('net');
    });
  });
});
