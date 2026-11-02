/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/users/route';
import { POST as submit } from '@/app/api/quiz/[quizId]/submit/route';
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
const getSession = jest.fn();
const userFrom = jest.fn();
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: { getUser, getSession },
    from: (...a: unknown[]) => userFrom(...a),
  })),
}));

const adminFrom = jest.fn();
jest.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: (...a: unknown[]) => adminFrom(...a) },
}));

const submitAttempt = jest.fn();
jest.mock('@/lib/jombeelajar-api', () => ({
  submitAttempt: (...a: unknown[]) => submitAttempt(...a),
}));

const json = (body: unknown) =>
  new Request('https://app.test/api/admin/users', { method: 'POST', body: JSON.stringify(body) });

describe('GET /api/admin/users', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 when anonymous, with no data access', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await GET()).status).toBe(401);
    expect(adminFrom).not.toHaveBeenCalled();
  });

  it.each([[null], [{ role: 'user' }]])('403 for non-admin role row %j', async (row) => {
    getUser.mockResolvedValue({ data: { user: { id: 'u' } } });
    const fm = makeFrom({ user_roles: { data: row, error: null } });
    adminFrom.mockImplementation(fm.from);
    expect((await GET()).status).toBe(403);
    expect(fm.calls.user_profiles).toBeUndefined();
  });

  it('returns users with emails and roles for an admin', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'a' } } });
    adminFrom.mockImplementation(
      makeFrom({
        user_roles: { data: { role: 'admin' }, error: null },
        user_profiles: {
          data: [
            { id: 'p1', display_name: 'A', user_roles: [{ role: 'moderator' }] },
            { id: 'p2', display_name: 'B', user_roles: [] },
          ],
          error: null,
        },
        users: { data: [{ id: 'p1', email: 'a@x.y' }], error: null },
      }).from
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const { users } = await res.json();
    expect(users).toMatchObject([
      { id: 'p1', email: 'a@x.y', role: 'moderator' },
      { id: 'p2', email: 'Email not available', role: 'user' },
    ]);
  });

  it('500 generic when profiles or emails fail, or on exception', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'a' } } });
    adminFrom.mockImplementation(
      makeFrom({
        user_roles: { data: { role: 'admin' }, error: null },
        user_profiles: { data: null, error: { message: 'secret-detail' } },
      }).from
    );
    const r1 = await GET();
    expect(r1.status).toBe(500);
    expect(JSON.stringify(await r1.json())).not.toMatch(/secret-detail/);

    adminFrom.mockImplementation(
      makeFrom({
        user_roles: { data: { role: 'admin' }, error: null },
        user_profiles: { data: [], error: null },
        users: { data: null, error: { message: 'x' } },
      }).from
    );
    expect((await GET()).status).toBe(500);

    getUser.mockRejectedValue(new Error('boom'));
    expect((await GET()).status).toBe(500);
  });
});

describe('POST /api/admin/users (role update)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 anonymous, 403 non-admin; neither writes', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(json({ userId: 'x', role: 'admin' }))).status).toBe(401);

    getUser.mockResolvedValue({ data: { user: { id: 'u' } } });
    userFrom.mockImplementation(makeFrom({ user_roles: { data: { role: 'user' }, error: null } }).from);
    expect((await POST(json({ userId: 'x', role: 'admin' }))).status).toBe(403);
    expect(adminFrom).not.toHaveBeenCalled();
  });

  it('400 when fields are missing', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'a' } } });
    userFrom.mockImplementation(makeFrom({ user_roles: { data: { role: 'admin' }, error: null } }).from);
    expect((await POST(json({ userId: 'x' }))).status).toBe(400);
    expect(adminFrom).not.toHaveBeenCalled();
  });

  it('upserts for an admin, and hides DB errors', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'a' } } });
    userFrom.mockImplementation(makeFrom({ user_roles: { data: { role: 'admin' }, error: null } }).from);
    const fm = makeFrom({ user_roles: { data: [{}], error: null } });
    adminFrom.mockImplementation(fm.from);
    const ok = await POST(json({ userId: 'x', role: 'moderator' }));
    expect(ok.status).toBe(200);
    expect(fm.calls.user_roles[0]).toEqual({ method: 'upsert', args: [{ user_id: 'x', role: 'moderator' }] });

    adminFrom.mockImplementation(makeFrom({ user_roles: { data: null, error: { message: 'pg detail' } } }).from);
    const bad = await POST(json({ userId: 'x', role: 'admin' }));
    expect(bad.status).toBe(500);
    expect(JSON.stringify(await bad.json())).not.toMatch(/pg detail/);
  });

  it('500 on malformed body', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'a' } } });
    userFrom.mockImplementation(makeFrom({ user_roles: { data: { role: 'admin' }, error: null } }).from);
    const res = await POST(new Request('https://app.test/x', { method: 'POST', body: '{bad' }));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/quiz/[quizId]/submit', () => {
  beforeEach(() => jest.clearAllMocks());
  const call = (body: unknown) =>
    submit(
      new NextRequest('https://app.test/api/quiz/q1/submit', { method: 'POST', body: JSON.stringify(body) }),
      { params: Promise.resolve({ quizId: 'q1' }) }
    );

  it('401 without a verified user, even if a stale session exists; never calls the API', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    getSession.mockResolvedValue({ data: { session: { access_token: 'stale' } } });
    expect((await call({ answers: [] })).status).toBe(401);
    expect(getSession).not.toHaveBeenCalled();
    expect(submitAttempt).not.toHaveBeenCalled();
  });

  it('forwards answers, time and the access token, returning the API result', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u' } } });
    getSession.mockResolvedValue({ data: { session: { access_token: 'TOK' } } });
    submitAttempt.mockResolvedValue({ score: 3 });
    const res = await call({ answers: [{ questionId: 'a', selectedAnswerIds: ['o'] }], timeTaken: 12 });
    expect(await res.json()).toEqual({ score: 3 });
    expect(submitAttempt).toHaveBeenCalledWith(
      'q1',
      { answers: [{ questionId: 'a', selectedAnswerIds: ['o'] }], timeTaken: 12 },
      'TOK'
    );
  });

  it('defaults missing answers to [] and maps upstream failure to a generic 500', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u' } } });
    getSession.mockResolvedValue({ data: { session: { access_token: 'T' } } });
    submitAttempt.mockResolvedValue({});
    await call({});
    expect(submitAttempt.mock.calls[0][1]).toEqual({ answers: [], timeTaken: undefined });

    submitAttempt.mockRejectedValue(new Error('JomBeelajar API 500: internal stack'));
    const res = await call({ answers: [] });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/stack/);
  });
});
