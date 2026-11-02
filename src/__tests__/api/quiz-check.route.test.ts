/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/quiz/[quizId]/check/route';

// Boundaries mocked: Supabase session (cookie jar) and global fetch (the
// JomBeelajar API). The real jombeelajar-api client runs, so URL building,
// auth header forwarding and error mapping are exercised end to end.
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ get: () => undefined })),
  headers: jest.fn(async () => new Headers({ host: 'app.test' })),
}));

const getSession = jest.fn();
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({ auth: { getSession } })),
}));

jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const fetchMock = jest.fn();
const realFetch = global.fetch;

const call = (body: unknown, quizId = 'quiz-1') =>
  POST(
    new NextRequest(`https://app.test/api/quiz/${quizId}/check`, {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ quizId }) }
  );

const apiReply = (status: number, body: unknown) =>
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

describe('POST /api/quiz/[quizId]/check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    getSession.mockResolvedValue({ data: { session: null } });
  });
  afterAll(() => {
    global.fetch = realFetch;
  });

  it('rejects malformed bodies with 400 and never calls the API', async () => {
    for (const bad of [
      {},
      { questionId: 'q1' },
      { questionId: 42, selectedAnswerIds: ['a'] },
      { questionId: 'q1', selectedAnswerIds: 'a' },
      { questionId: 'q1', selectedAnswerIds: ['a', 7] },
    ]) {
      const res = await call(bad);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Invalid request' });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a generic 500 when the body is not JSON', async () => {
    const res = await call('not json{');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });

  it('works for guests: calls the public check endpoint without Authorization', async () => {
    apiReply(200, { isCorrect: true, correctOptionIds: ['a1'], explanation: null });

    const res = await call({ questionId: 'q1', selectedAnswerIds: ['a1'] });

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/quizzes/quiz-1/questions/q1/check');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ selectedAnswerIds: ['a1'] });
    expect(opts.headers).not.toHaveProperty('Authorization');
  });

  it('forwards the session access token as a Bearer token when signed in', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok-123' } } });
    apiReply(200, { isCorrect: false, correctOptionIds: ['a2'], explanation: 'why' });

    await call({ questionId: 'q1', selectedAnswerIds: ['a1'] });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-123');
  });

  it('only hits the per-question check endpoint, never the author/answer-key endpoint', async () => {
    apiReply(200, { isCorrect: true, correctOptionIds: ['a1'], explanation: null });

    await call({ questionId: 'q1', selectedAnswerIds: ['a1'] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).not.toMatch(/author/);
    expect(url).toMatch(/\/questions\/q1\/check$/);
  });

  it('returns the feedback for the one checked question', async () => {
    apiReply(200, { isCorrect: false, correctOptionIds: ['a2'], explanation: null });

    const res = await call({ questionId: 'q1', selectedAnswerIds: ['a1'] });

    expect(await res.json()).toEqual({
      isCorrect: false,
      correctOptionIds: ['a2'],
      explanation: null,
    });
  });

  it('maps an upstream 404 to 404 "Question not found"', async () => {
    apiReply(404, { error: 'nope' });
    const res = await call({ questionId: 'missing', selectedAnswerIds: ['a1'] });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Question not found' });
  });

  it.each([401, 403, 500, 502])(
    'maps upstream %i to a generic 500 without leaking upstream detail',
    async (status) => {
      apiReply(status, { error: 'secret upstream detail' });
      const res = await call({ questionId: 'q1', selectedAnswerIds: ['a1'] });
      expect(res.status).toBe(500);
      const text = JSON.stringify(await res.json());
      expect(text).toBe('{"error":"Internal server error"}');
    }
  );

  it('maps a network failure to a generic 500', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await call({ questionId: 'q1', selectedAnswerIds: ['a1'] });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });

  it('maps an API timeout to a generic 500', async () => {
    const err = new Error('timeout');
    err.name = 'TimeoutError';
    fetchMock.mockRejectedValue(err);
    const res = await call({ questionId: 'q1', selectedAnswerIds: ['a1'] });
    expect(res.status).toBe(500);
  });
});
