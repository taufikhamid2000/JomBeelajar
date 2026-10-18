import {
  getTopicQuizzes,
  getQuizDetail,
  submitAttempt,
  getMyProgress,
  getLeaderboard,
} from '@/lib/myquiza';

// These tests exercise JomBeelajar's own MyQuiza client in isolation: fetch is
// mocked, so they assert that we build the right request (URL, method, headers,
// body, query params) and parse/propagate responses correctly — without ever
// hitting the live MyQuiza API.
describe('MyQuiza API client (lib/myquiza)', () => {
  const realFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.clearAllMocks();
  });

  const mockOk = (body: unknown) =>
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    });

  it('getTopicQuizzes hits the topic-quizzes path without an Authorization header', async () => {
    mockOk([{ id: 'q1', topicId: 't123', name: 'Quiz 1', verified: true, questionCount: 5 }]);

    const res = await getTopicQuizzes('t123');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toEqual(expect.stringContaining('/api/v1/topics/t123/quizzes'));
    expect(opts.headers).not.toHaveProperty('Authorization');
    expect(res).toEqual([
      { id: 'q1', topicId: 't123', name: 'Quiz 1', verified: true, questionCount: 5 },
    ]);
  });

  it('submitAttempt POSTs the answers with a Bearer token and JSON body', async () => {
    mockOk({
      attemptId: 'a1',
      score: 80,
      correctAnswers: 4,
      totalQuestions: 5,
      maxScore: 100,
      xpAwarded: true,
    });
    const payload = {
      answers: [{ questionId: 'q1', selectedAnswerIds: ['o1'] }],
      timeTaken: 42,
    };

    const res = await submitAttempt('quiz9', payload, 'tok-abc');

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toEqual(expect.stringContaining('/api/v1/quizzes/quiz9/attempts'));
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer tok-abc');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opts.body)).toEqual(payload);
    expect(res.score).toBe(80);
    expect(res.xpAwarded).toBe(true);
  });

  it('getMyProgress forwards the Bearer token', async () => {
    mockOk([]);

    await getMyProgress('tok-xyz');

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toEqual(expect.stringContaining('/api/v1/me/progress'));
    expect(opts.headers.Authorization).toBe('Bearer tok-xyz');
  });

  it('getLeaderboard builds period + limit query params', async () => {
    mockOk([]);

    await getLeaderboard(null, { period: 'weekly', limit: 50 });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toEqual(expect.stringContaining('/api/v1/leaderboard?'));
    expect(url).toEqual(expect.stringContaining('period=weekly'));
    expect(url).toEqual(expect.stringContaining('limit=50'));
  });

  it('getLeaderboard omits the query string when given no options', async () => {
    mockOk([]);

    await getLeaderboard(null);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toEqual(expect.stringContaining('/api/v1/leaderboard'));
    expect(url).not.toContain('?');
  });

  it('omits the Authorization header when token is null', async () => {
    mockOk({ id: 'q1', topicId: 't1', name: 'Q', verified: false, questions: [] });

    await getQuizDetail('q1');

    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.headers).not.toHaveProperty('Authorization');
  });

  it('throws with the status and path on a non-ok response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => '{}',
    });

    await expect(getQuizDetail('missing')).rejects.toThrow('MyQuiza 404');
  });
});
