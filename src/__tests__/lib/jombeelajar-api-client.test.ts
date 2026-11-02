/**
 * @jest-environment node
 */
import {
  getQuizDetail,
  createQuiz,
  deleteQuestion,
  submitAttempt,
  verifyQuiz,
  getMyAchievements,
} from '@/lib/jombeelajar-api';

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

const ok = (body: unknown) =>
  ({ ok: true, status: 200, text: async () => (body === undefined ? '' : JSON.stringify(body)) }) as Response;
const fail = (status: number, body?: unknown) =>
  ({
    ok: false,
    status,
    json: async () => {
      if (body === undefined) throw new Error('no body');
      return body;
    },
  }) as unknown as Response;

describe('JomBeelajar API client', () => {
  it('sends no Authorization header for public reads, and Bearer for authed calls', async () => {
    fetchMock.mockResolvedValue(ok({ id: 'q' }));
    await getQuizDetail('q1');
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/quizzes\/q1$/);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();

    await createQuiz({ topicId: 't', name: 'n' }, 'TOK');
    const init = fetchMock.mock.calls[1][1];
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer TOK');
    expect(JSON.parse(init.body)).toEqual({ topicId: 't', name: 'n' });
  });

  it('returns undefined for empty (204) bodies', async () => {
    fetchMock.mockResolvedValue(ok(undefined));
    await expect(deleteQuestion('x', 't')).resolves.toBeUndefined();
    await expect(verifyQuiz('q', { verified: true }, 't')).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('includes status, path and server detail in errors (error preferred over message)', async () => {
    fetchMock.mockResolvedValueOnce(fail(409, { error: '3 children block delete', message: 'm' }));
    await expect(deleteQuestion('x', 't')).rejects.toThrow(
      'JomBeelajar API 409: /api/v1/questions/x — 3 children block delete'
    );
    fetchMock.mockResolvedValueOnce(fail(400, { message: 'bad input' }));
    await expect(getMyAchievements('t')).rejects.toThrow(/JomBeelajar API 400: .* — bad input/);
  });

  it('omits detail when the error body is not JSON or has no message', async () => {
    fetchMock.mockResolvedValueOnce(fail(502));
    await expect(getQuizDetail('q')).rejects.toThrow(/^JomBeelajar API 502: \/api\/v1\/quizzes\/q$/);
    fetchMock.mockResolvedValueOnce(fail(500, {}));
    await expect(getQuizDetail('q')).rejects.toThrow(/^JomBeelajar API 500: \/api\/v1\/quizzes\/q$/);
  });

  it('maps a timeout to a 504 message and rethrows other network errors untouched', async () => {
    const te = new Error('aborted');
    te.name = 'TimeoutError';
    fetchMock.mockRejectedValueOnce(te);
    await expect(getQuizDetail('q')).rejects.toThrow(/JomBeelajar API 504: .* timed out after 8000ms/);

    const net = new TypeError('fetch failed');
    fetchMock.mockRejectedValueOnce(net);
    await expect(getQuizDetail('q')).rejects.toBe(net);
  });

  it('passes an abort signal so a cold API cannot hang the function', async () => {
    fetchMock.mockResolvedValue(ok({}));
    await submitAttempt('q', { answers: [] }, 't');
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
