/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { FORBIDDEN_MESSAGE } from '@/lib/permissions';
import * as subjects from '@/app/api/admin/subjects/route';
import * as subjectById from '@/app/api/admin/subjects/[id]/route';
import * as chapters from '@/app/api/admin/chapters/route';
import * as chapterById from '@/app/api/admin/chapters/[id]/route';
import * as topics from '@/app/api/admin/topics/route';
import * as topicById from '@/app/api/admin/topics/[id]/route';
import * as achievements from '@/app/api/achievements/route';
import * as achievementById from '@/app/api/achievements/[achievementId]/route';
import * as api from '@/lib/jombeelajar-api';

jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));
jest.mock('@/lib/serverSession', () => ({
  getSessionToken: jest.fn(async () => 'teacher-token'),
}));
jest.mock('@/lib/jombeelajar-api', () => ({
  createApiSubject: jest.fn(),
  updateApiSubject: jest.fn(),
  deleteApiSubject: jest.fn(),
  createApiChapter: jest.fn(),
  updateApiChapter: jest.fn(),
  deleteApiChapter: jest.fn(),
  createApiTopic: jest.fn(),
  updateApiTopic: jest.fn(),
  deleteApiTopic: jest.fn(),
  getAchievementCatalog: jest.fn(),
  createCatalogAchievement: jest.fn(),
  updateCatalogAchievement: jest.fn(),
  deleteCatalogAchievement: jest.fn(),
}));

const mocked = jest.mocked(api) as unknown as Record<string, jest.Mock>;

const req = (method: string, body?: unknown) =>
  new NextRequest('https://app.test/api/x', {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

type Handler = (r: NextRequest, ctx: never) => Promise<Response>;
const idCtx = { params: Promise.resolve({ id: 'abc' }) } as never;
const achCtx = { params: Promise.resolve({ achievementId: 'abc' }) } as never;

const cases: Array<{
  name: string;
  handler: Handler;
  method: string;
  body?: unknown;
  ctx?: never;
  upstream: string;
}> = [
  {
    name: 'POST /api/admin/subjects',
    handler: subjects.POST,
    method: 'POST',
    body: { name: 'Math', slug: 'math' },
    upstream: 'createApiSubject',
  },
  {
    name: 'PATCH /api/admin/subjects/[id]',
    handler: subjectById.PATCH,
    method: 'PATCH',
    body: { name: 'Math' },
    ctx: idCtx,
    upstream: 'updateApiSubject',
  },
  {
    name: 'DELETE /api/admin/subjects/[id]',
    handler: subjectById.DELETE,
    method: 'DELETE',
    ctx: idCtx,
    upstream: 'deleteApiSubject',
  },
  {
    name: 'POST /api/admin/chapters',
    handler: chapters.POST,
    method: 'POST',
    body: { subjectId: 's', name: 'C', form: 1, orderIndex: 1 },
    upstream: 'createApiChapter',
  },
  {
    name: 'PATCH /api/admin/chapters/[id]',
    handler: chapterById.PATCH,
    method: 'PATCH',
    body: { name: 'C' },
    ctx: idCtx,
    upstream: 'updateApiChapter',
  },
  {
    name: 'DELETE /api/admin/chapters/[id]',
    handler: chapterById.DELETE,
    method: 'DELETE',
    ctx: idCtx,
    upstream: 'deleteApiChapter',
  },
  {
    name: 'POST /api/admin/topics',
    handler: topics.POST,
    method: 'POST',
    body: { chapterId: 'c', name: 'T', orderIndex: 1 },
    upstream: 'createApiTopic',
  },
  {
    name: 'PATCH /api/admin/topics/[id]',
    handler: topicById.PATCH,
    method: 'PATCH',
    body: { name: 'T' },
    ctx: idCtx,
    upstream: 'updateApiTopic',
  },
  {
    name: 'DELETE /api/admin/topics/[id]',
    handler: topicById.DELETE,
    method: 'DELETE',
    ctx: idCtx,
    upstream: 'deleteApiTopic',
  },
  {
    name: 'POST /api/achievements',
    handler: achievements.POST,
    method: 'POST',
    body: { achievementType: 'a', title: 't', description: 'd', icon: 'i' },
    upstream: 'createCatalogAchievement',
  },
  {
    name: 'PATCH /api/achievements/[achievementId]',
    handler: achievementById.PATCH,
    method: 'PATCH',
    body: { title: 't' },
    ctx: achCtx,
    upstream: 'updateCatalogAchievement',
  },
  {
    name: 'DELETE /api/achievements/[achievementId]',
    handler: achievementById.DELETE,
    method: 'DELETE',
    ctx: achCtx,
    upstream: 'deleteCatalogAchievement',
  },
];

describe('content-tree and achievement-catalog write routes: 403 message', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses a message that names admins and moderators', () => {
    expect(FORBIDDEN_MESSAGE).toMatch(/only admins and moderators/i);
  });

  it.each(cases)(
    '$name returns the clear 403 when the upstream API forbids the caller',
    async ({ handler, method, body, ctx, upstream }) => {
      mocked[upstream].mockRejectedValue(new Error('API error 403: Forbidden'));

      const res = await handler(req(method, body), ctx as never);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe(FORBIDDEN_MESSAGE);
      expect(json.error).toMatch(/only admins and moderators/i);
      expect(mocked[upstream]).toHaveBeenCalled();
    }
  );

  it.each(cases)(
    '$name does not mislabel other upstream failures as 403',
    async ({ handler, method, body, ctx, upstream }) => {
      mocked[upstream].mockRejectedValue(new Error('connect ECONNREFUSED'));

      const res = await handler(req(method, body), ctx as never);

      expect(res.status).toBe(500);
      expect((await res.json()).error).not.toBe(FORBIDDEN_MESSAGE);
    }
  );
});
