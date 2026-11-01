import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Reward, RewardClaim } from '@/types/rewards';

const ALL_TIME_REWARDS: Reward[] = [
  {
    id: 'all-time-first',
    tier: 'first',
    amount: 1000,
    name: 'First Prize',
    description: 'Top performer on the all-time leaderboard',
    requirements: {
      minRank: 1,
      maxRank: 1,
    },
  },
  {
    id: 'all-time-second',
    tier: 'second',
    amount: 500,
    name: 'Second Prize',
    description: 'Second place on the all-time leaderboard',
    requirements: {
      minRank: 2,
      maxRank: 2,
    },
  },
  {
    id: 'all-time-third',
    tier: 'third',
    amount: 250,
    name: 'Third Prize',
    description: 'Third place on the all-time leaderboard',
    requirements: {
      minRank: 3,
      maxRank: 3,
    },
  },
  {
    id: 'all-time-active',
    tier: 'mostActive',
    amount: 300,
    name: 'Most Active',
    description: 'Most active participant with highest participation rate',
    requirements: {
      minParticipation: 90,
      minStreak: 7,
    },
  },
];

const WEEKLY_REWARDS: Reward[] = [
  {
    id: 'weekly-first',
    tier: 'first',
    amount: 300,
    name: 'Weekly Champion',
    description: 'Top performer this week',
    requirements: {
      minRank: 1,
      maxRank: 1,
    },
  },
  {
    id: 'weekly-second',
    tier: 'second',
    amount: 150,
    name: 'Weekly Runner-up',
    description: 'Second place this week',
    requirements: {
      minRank: 2,
      maxRank: 2,
    },
  },
  {
    id: 'weekly-third',
    tier: 'third',
    amount: 75,
    name: 'Weekly Third Place',
    description: 'Third place this week',
    requirements: {
      minRank: 3,
      maxRank: 3,
    },
  },
  {
    id: 'weekly-active',
    tier: 'mostActive',
    amount: 100,
    name: 'Weekly Most Active',
    description: 'Most active participant this week',
    requirements: {
      minParticipation: 80,
      minStreak: 3,
    },
  },
];

const DAILY_REWARDS: Reward[] = [
  {
    id: 'daily-first',
    tier: 'first',
    amount: 50,
    name: 'Daily Champion',
    description: 'Top performer today',
    requirements: {
      minRank: 1,
      maxRank: 1,
    },
  },
  {
    id: 'daily-second',
    tier: 'second',
    amount: 30,
    name: 'Daily Runner-up',
    description: 'Second place today',
    requirements: {
      minRank: 2,
      maxRank: 2,
    },
  },
  {
    id: 'daily-third',
    tier: 'third',
    amount: 20,
    name: 'Daily Third Place',
    description: 'Third place today',
    requirements: {
      minRank: 3,
      maxRank: 3,
    },
  },
  {
    id: 'daily-active',
    tier: 'mostActive',
    amount: 25,
    name: 'Daily Most Active',
    description: 'Most active participant today',
    requirements: {
      minParticipation: 70,
    },
  },
];

export const getRewardsByTimeFrame = (
  timeFrame: 'daily' | 'weekly' | 'allTime'
): Reward[] => {
  switch (timeFrame) {
    case 'daily':
      return DAILY_REWARDS;
    case 'weekly':
      return WEEKLY_REWARDS;
    case 'allTime':
    default:
      return ALL_TIME_REWARDS;
  }
};

/**
 * Check if a user is eligible for any rewards
 */
export async function checkRewardEligibility(userId: string): Promise<{
  eligibleRewards: Reward[];
  error?: { message: string } | null;
}> {
  try {
    // Get user's current rank and stats
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    if (!userData) {
      throw new Error('User not found');
    }

    // Get user's current rank
    const { data: rankData } = await supabase
      .from('user_profiles')
      .select('id')
      .order('xp', { ascending: false });

    const currentRank = rankData?.findIndex((user) => user.id === userId) ?? -1; // Check eligibility for all reward pools
    const allRewards = [
      ...DAILY_REWARDS,
      ...WEEKLY_REWARDS,
      ...ALL_TIME_REWARDS,
    ];

    // Check each reward's eligibility
    const eligibleRewards = allRewards.filter((reward) => {
      // Check rank requirements
      if (
        reward.requirements.minRank !== undefined &&
        reward.requirements.maxRank !== undefined
      ) {
        if (
          currentRank + 1 < reward.requirements.minRank ||
          currentRank + 1 > reward.requirements.maxRank
        ) {
          return false;
        }
      }

      // Check participation requirements
      if (reward.requirements.minParticipation !== undefined) {
        // Placeholder - actual participation calculation needed
        const participationRate = userData.participation_rate || 0;
        if (participationRate < reward.requirements.minParticipation) {
          return false;
        }
      }

      // Check streak requirements
      if (reward.requirements.minStreak !== undefined) {
        if (userData.streak < reward.requirements.minStreak) {
          return false;
        }
      }

      return true;
    });

    return {
      eligibleRewards,
      error: null,
    };
  } catch (error) {
    logger.error('Error checking reward eligibility:', error);
    return {
      eligibleRewards: [],
      error: {
        message:
          (error as { message?: string })?.message ?? String(error),
      },
    };
  }
}

/**
 * Submit a reward claim for a user
 */
export async function submitRewardClaim(
  userId: string,
  rewardId: string,
  paymentDetails: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  }
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    // Check if user has already claimed this reward
    const { data: existingClaim } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('user_id', userId)
      .eq('reward_id', rewardId)
      .single();

    if (existingClaim) {
      throw new Error('You have already claimed this reward');
    } // Check eligibility
    const { eligibleRewards, error: eligibilityError } =
      await checkRewardEligibility(userId);

    if (eligibilityError) {
      throw new Error(eligibilityError.message);
    }

    if (!eligibleRewards.find((r) => r.id === rewardId)) {
      throw new Error('You are not eligible for this reward');
    }

    // Create the claim
    const { error: insertError } = await supabase.from('reward_claims').insert([
      {
        user_id: userId,
        reward_id: rewardId,
        status: 'pending',
        payment_details: paymentDetails,
      },
    ]);

    if (insertError) {
      throw insertError;
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error submitting reward claim:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Get reward claims for a user
 */
export async function getUserRewardClaims(userId: string): Promise<{
  claims: RewardClaim[];
  error: Error | null;
}> {
  try {
    const { data: claims, error: fetchError } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    return {
      claims: claims as RewardClaim[],
      error: null,
    };
  } catch (error) {
    logger.error('Error fetching user reward claims:', error);
    return { claims: [], error: error as Error };
  }
}
