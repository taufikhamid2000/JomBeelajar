/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/quiz/[quizId]/route';

// The public quiz payload must never carry the answer key to the browser.
const fetchMock = jest.fn();
const realFetch = global.fetch;

jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock('@/lib/serverSession', () => ({ getSessionToken: jest.fn() }));

const topicQuery = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => {
      const b: Record<string, unknown> = {};
      for (const m of ['select', 'eq']) b[m] = () => b;
      b.single = () => topicQuery();
      return b;
    },
  },
}));

const get = (quizId = 'quiz-1') =>
  GET(new NextRequest(`https://app.test/api/quiz/${quizId}`), {
    params: Promise.resolve({ quizId }),
  });

const upstream = (status: number, body: unknown) =>
  fetchMock.mockResolvedValue({
    ok: status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

describe('GET /api/quiz/[quizId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    topicQuery.mockResolvedValue({
      data: {
        id: 't1',
        name: 'Algebra',
        chapter: { id: 'c1', name: 'Ch1', form: 4, subject: { id: 's1', name: 'Maths' } },
      },
      error: null,
    });
  });
  afterAll(() => {
    global.fetch = realFetch;
  });

  it('strips correctness info from questions/options even if upstream included it', async () => {
    upstream(200, {
      id: 'quiz-1',
      name: 'Quiz',
      verified: true,
      topicId: 't1',
      timeLimit: null,
      difficulty: 'easy',
      isPublic: true,
      questions: [
        {
          id: 'q1',
          text: 'Q?',
          type: 'radio',
          orderIndex: 0,
          correctOptionIds: ['o1'],
          explanation: 'because',
          options: [
            { id: 'o1', text: 'A', orderIndex: 0, isCorrect: true },
            { id: 'o2', text: 'B', orderIndex: 1, isCorrect: false },
          ],
        },
      ],
    });

    const res = await get();
    const raw = JSON.stringify(await res.json());

    expect(res.status).toBe(200);
    expect(raw).not.toMatch(/isCorrect|is_correct|correctOptionIds|because/);
    expect(raw).toContain('"Algebra"');
    expect(raw).toContain('"Maths"');
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/quizzes\/quiz-1$/);
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('still serves the quiz when the breadcrumb lookup fails', async () => {
    topicQuery.mockResolvedValue({ data: null, error: { message: 'boom' } });
    upstream(200, {
      id: 'quiz-1', name: 'Quiz', verified: true, topicId: 't1',
      timeLimit: null, difficulty: null, isPublic: true, questions: [],
    });
    const res = await get();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.topicContext.topicTitle).toBe('Unknown Topic');
  });

  it('returns 404 for an unknown quiz and 500 on other upstream errors', async () => {
    upstream(404, {});
    expect((await get()).status).toBe(404);
    upstream(500, {});
    expect((await get()).status).toBe(500);
  });
});
