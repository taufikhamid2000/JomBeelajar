import {
  getRewardsByTimeFrame,
  checkRewardEligibility,
  submitRewardClaim,
  getUserRewardClaims,
} from '@/services/rewardService';
import { supabase } from '@/lib/supabase';
import { makeFrom } from '@/test-utils/supabaseMock';

jest.mock('@/lib/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

const from = supabase.from as unknown as jest.Mock;
const pay = { bankName: 'B', accountNumber: '000', accountHolderName: 'H' };

// user_profiles is queried twice (user row, then ranking list), in that order.
const profiles = (user: unknown, ranking: unknown[], userError: unknown = null) => ({
  user_profiles: [
    { data: user, error: userError },
    { data: ranking, error: null },
  ],
});

describe('rewardService', () => {
  beforeEach(() => jest.resetAllMocks());

  it('getRewardsByTimeFrame returns the right pool, defaulting to all-time', () => {
    expect(getRewardsByTimeFrame('daily').every((r) => r.id.startsWith('daily-'))).toBe(true);
    expect(getRewardsByTimeFrame('weekly').every((r) => r.id.startsWith('weekly-'))).toBe(true);
    expect(getRewardsByTimeFrame('allTime').every((r) => r.id.startsWith('all-time-'))).toBe(true);
    expect(getRewardsByTimeFrame('bogus' as 'daily')[0].id).toBe('all-time-first');
  });

  describe('checkRewardEligibility', () => {
    it('rank 1 with high participation and streak qualifies for every pool', async () => {
      from.mockImplementation(
        makeFrom(profiles({ id: 'u1', participation_rate: 95, streak: 10 }, [{ id: 'u1' }, { id: 'u2' }])).from
      );
      const { eligibleRewards, error } = await checkRewardEligibility('u1');
      const ids = eligibleRewards.map((r) => r.id);
      expect(error).toBeNull();
      expect(ids).toEqual(
        expect.arrayContaining(['daily-first', 'weekly-first', 'all-time-first', 'daily-active', 'weekly-active', 'all-time-active'])
      );
      expect(ids).not.toContain('all-time-second');
    });

    it('rank 3 with no participation only gets the third-place prizes', async () => {
      from.mockImplementation(
        makeFrom(
          profiles({ id: 'u3', participation_rate: 0, streak: 0 }, [{ id: 'a' }, { id: 'b' }, { id: 'u3' }])
        ).from
      );
      const ids = (await checkRewardEligibility('u3')).eligibleRewards.map((r) => r.id);
      expect(ids.sort()).toEqual(['all-time-third', 'daily-third', 'weekly-third']);
    });

    it('streak requirement blocks the weekly most-active prize', async () => {
      from.mockImplementation(
        makeFrom(
          profiles({ id: 'u9', participation_rate: 85, streak: 1 }, [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'u9' }])
        ).from
      );
      const ids = (await checkRewardEligibility('u9')).eligibleRewards.map((r) => r.id);
      expect(ids).toContain('daily-active');
      expect(ids).not.toContain('weekly-active');
    });

    it('returns an empty list and the message when the user lookup fails or is missing', async () => {
      from.mockImplementation(makeFrom(profiles(null, [], { message: 'rls' })).from);
      expect(await checkRewardEligibility('u')).toEqual({ eligibleRewards: [], error: { message: 'rls' } });

      from.mockImplementation(makeFrom(profiles(null, [])).from);
      expect(await checkRewardEligibility('u')).toEqual({
        eligibleRewards: [],
        error: { message: 'User not found' },
      });
    });
  });

  describe('submitRewardClaim', () => {
    it('refuses a duplicate claim without inserting', async () => {
      const fm = makeFrom({ reward_claims: { data: { id: 'c1' }, error: null } });
      from.mockImplementation(fm.from);
      const r = await submitRewardClaim('u1', 'daily-first', pay);
      expect(r.success).toBe(false);
      expect(r.error?.message).toBe('You have already claimed this reward');
      expect(fm.calls.reward_claims.some((c) => c.method === 'insert')).toBe(false);
    });

    it('refuses an ineligible claim without inserting', async () => {
      const fm = makeFrom({
        reward_claims: { data: null, error: null },
        ...profiles({ id: 'u2', participation_rate: 0, streak: 0 }, [{ id: 'a' }, { id: 'u2' }]),
      });
      from.mockImplementation(fm.from);
      const r = await submitRewardClaim('u2', 'all-time-first', pay);
      expect(r.success).toBe(false);
      expect(r.error?.message).toBe('You are not eligible for this reward');
      expect(fm.calls.reward_claims.some((c) => c.method === 'insert')).toBe(false);
    });

    it('surfaces an eligibility-check failure', async () => {
      from.mockImplementation(
        makeFrom({ reward_claims: { data: null, error: null }, ...profiles(null, [], { message: 'db' }) }).from
      );
      const r = await submitRewardClaim('u', 'daily-first', pay);
      expect(r).toMatchObject({ success: false });
      expect(r.error?.message).toBe('db');
    });

    it('inserts a pending claim carrying the payment details for an eligible user', async () => {
      const fm = makeFrom({
        reward_claims: { data: null, error: null },
        ...profiles({ id: 'u1', participation_rate: 0, streak: 0 }, [{ id: 'u1' }]),
      });
      from.mockImplementation(fm.from);
      expect(await submitRewardClaim('u1', 'daily-first', pay)).toEqual({ success: true, error: null });
      const insert = fm.calls.reward_claims.find((c) => c.method === 'insert')!;
      expect(insert.args[0]).toEqual([
        { user_id: 'u1', reward_id: 'daily-first', status: 'pending', payment_details: pay },
      ]);
    });

    it('reports an insert error', async () => {
      // claim lookup (none) then insert (error): same table, sequential results
      const fm = makeFrom({
        reward_claims: [
          { data: null, error: null },
          { data: null, error: { message: 'insert failed' } },
        ],
        ...profiles({ id: 'u1', participation_rate: 0, streak: 0 }, [{ id: 'u1' }]),
      });
      from.mockImplementation(fm.from);
      const r = await submitRewardClaim('u1', 'daily-first', pay);
      expect(r.success).toBe(false);
      expect(r.error).toEqual({ message: 'insert failed' });
    });
  });

  describe('getUserRewardClaims', () => {
    it('lists claims newest first', async () => {
      const fm = makeFrom({ reward_claims: { data: [{ id: 'c1' }], error: null } });
      from.mockImplementation(fm.from);
      expect(await getUserRewardClaims('u1')).toEqual({ claims: [{ id: 'c1' }], error: null });
      expect(fm.calls.reward_claims).toContainEqual({ method: 'order', args: ['claimed_at', { ascending: false }] });
    });

    it('returns an empty list and the error on failure', async () => {
      from.mockImplementation(makeFrom({ reward_claims: { data: null, error: { message: 'x' } } }).from);
      expect(await getUserRewardClaims('u1')).toEqual({ claims: [], error: { message: 'x' } });
    });
  });
});
