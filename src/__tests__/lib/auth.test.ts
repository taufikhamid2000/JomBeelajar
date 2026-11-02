import { signIn, signUp, signOut } from '@/lib/auth';
import { checkAdminPermission } from '@/lib/auth-utils';
import { hardNavigate } from '@/lib/hard-navigate';
import { supabase } from '@/lib/supabase';
import { makeFrom } from '@/test-utils/supabaseMock';

jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock('@/lib/hard-navigate', () => ({ hardNavigate: jest.fn() }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const auth = supabase.auth as unknown as Record<string, jest.Mock>;
const from = supabase.from as unknown as jest.Mock;

describe('client auth helpers (lib/auth)', () => {
  beforeEach(() => jest.resetAllMocks());

  it('signIn returns the session, or throws the Supabase error', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: { id: 's' } }, error: null });
    await expect(signIn('a@b.c', 'pw')).resolves.toEqual({ id: 's' });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw' });

    const err = new Error('Invalid login credentials');
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: err });
    await expect(signIn('a@b.c', 'bad')).rejects.toBe(err);
  });

  it('signUp signs the new user straight in, and surfaces either failure', async () => {
    auth.signUp.mockResolvedValue({ error: null });
    auth.signInWithPassword.mockResolvedValue({ data: { session: 'S' }, error: null });
    await expect(signUp('a@b.c', 'pw')).resolves.toBe('S');

    const e1 = new Error('exists');
    auth.signUp.mockResolvedValue({ error: e1 });
    await expect(signUp('a@b.c', 'pw')).rejects.toBe(e1);

    const e2 = new Error('unconfirmed');
    auth.signUp.mockResolvedValue({ error: null });
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: e2 });
    await expect(signUp('a@b.c', 'pw')).rejects.toBe(e2);
  });

  describe('signOut', () => {
    beforeEach(() => {
      document.cookie = 'sb-ref-auth-token=abc; path=/';
      document.cookie = 'keepme=1; path=/';
      localStorage.setItem('supabase.auth.token', 'x');
    });

    it('revokes globally, clears local state, and hard-navigates to /auth', async () => {
      auth.signOut.mockResolvedValue({ error: null });

      await expect(signOut()).resolves.toBe(true);

      expect(auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
      expect(localStorage.getItem('supabase.auth.token')).toBeNull();
      expect(document.cookie).not.toMatch(/sb-ref-auth-token/);
      expect(document.cookie).toMatch(/keepme=1/);
      expect(hardNavigate).toHaveBeenCalledWith('/auth');
    });

    it('still signs the device out when Supabase reports an error or throws', async () => {
      auth.signOut.mockResolvedValue({ error: new Error('down') });
      await expect(signOut()).resolves.toBe(true);
      expect(hardNavigate).toHaveBeenCalledWith('/auth');

      document.cookie = 'sb-ref-auth-token=abc; path=/';
      auth.signOut.mockRejectedValue(new Error('network'));
      await expect(signOut()).resolves.toBe(true);
      expect(document.cookie).not.toMatch(/sb-ref-auth-token/);
    });

    it('is not blocked by a hung Supabase call (3s race)', async () => {
      jest.useFakeTimers();
      try {
        auth.signOut.mockReturnValue(new Promise(() => {}));
        const p = signOut();
        await jest.advanceTimersByTimeAsync(3000);
        await expect(p).resolves.toBe(true);
        expect(hardNavigate).toHaveBeenCalledWith('/auth');
      } finally {
        jest.useRealTimers();
      }
    });
  });
});

describe('checkAdminPermission (client-side UI gate)', () => {
  beforeEach(() => jest.resetAllMocks());

  const session = (id = 'u1') => ({ data: { session: { user: { id } } }, error: null });

  it('unauthorised without a session', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await checkAdminPermission()).toEqual({ isAuthorized: false, userId: null });
  });

  it('unauthorised when the session lookup errors', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: new Error('x') });
    expect((await checkAdminPermission()).isAuthorized).toBe(false);
  });

  it('authorised for an admin role', async () => {
    auth.getSession.mockResolvedValue(session());
    from.mockImplementation(makeFrom({ user_roles: { data: { role: 'admin' }, error: null } }).from);
    expect(await checkAdminPermission()).toEqual({ isAuthorized: true, userId: 'u1', role: 'admin' });
  });

  it('authorised for a teacher via school_role, but not for a plain student', async () => {
    auth.getSession.mockResolvedValue(session());
    from.mockImplementation(
      makeFrom({
        user_roles: { data: null, error: null },
        user_profiles: { data: { school_role: 'Teacher' }, error: null },
      }).from
    );
    expect(await checkAdminPermission()).toEqual({ isAuthorized: true, userId: 'u1', role: 'teacher' });

    from.mockImplementation(
      makeFrom({
        user_roles: { data: null, error: null },
        user_profiles: { data: { school_role: 'student' }, error: null },
      }).from
    );
    expect(await checkAdminPermission()).toEqual({ isAuthorized: false, userId: 'u1', role: undefined });
  });

  it('fails closed on a role-query error and on thrown errors', async () => {
    auth.getSession.mockResolvedValue(session());
    from.mockImplementation(
      makeFrom({ user_roles: { data: { role: 'admin' }, error: { message: 'rls' } } }).from
    );
    expect(await checkAdminPermission()).toEqual({ isAuthorized: false, userId: 'u1' });

    auth.getSession.mockRejectedValue(new Error('boom'));
    expect(await checkAdminPermission()).toEqual({ isAuthorized: false, userId: null });
  });
});
