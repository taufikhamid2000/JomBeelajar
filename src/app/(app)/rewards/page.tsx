'use client';

import { useEffect, useState } from 'react';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import {
  checkRewardEligibility,
  submitRewardClaim,
  getRewardsByTimeFrame,
} from '@/services/rewardService';
import { Reward } from '@/types/rewards';
import { supabase } from '@/lib/supabase';

export default function RewardsClaimPage() {
  const router = useRouter();
  const [eligibleRewards, setEligibleRewards] = useState<Reward[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkEligibility() {
      try {
        const session = await supabase.auth.getSession();
        if (!session?.data.session?.user) {
          router.push('/login');
          return;
        }
        const userId = session.data.session.user.id;
        const { eligibleRewards, error } = await checkRewardEligibility(userId);

        if (error) {
          setError(error.message);
          return;
        }

        setEligibleRewards(eligibleRewards);
      } catch {
        setError('Failed to check reward eligibility');
      } finally {
        setLoading(false);
      }
    }

    checkEligibility();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      if (!session?.data.session?.user || !selectedReward) {
        return;
      }

      const { success, error } = await submitRewardClaim(
        session.data.session.user.id,
        selectedReward.id,
        paymentDetails
      );

      if (error) {
        setError(error.message);
        return;
      }

      if (success) {
        router.push('/rewards/success');
      }
    } catch {
      setError('Failed to submit reward claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-4 h-9 w-64" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        🏆 Claim Your Rewards
      </h1>
      <p className="text-gray-400 dark:text-gray-600 mb-8">
        Select an eligible reward and provide your payment details to claim your
        prize.
      </p>
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}{' '}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {getRewardsByTimeFrame('allTime').map((reward: Reward) => {
          const isEligible = eligibleRewards.some((r) => r.id === reward.id);
          return (
            <button
              key={reward.id}
              onClick={() => setSelectedReward(reward)}
              disabled={!isEligible}
              className={`p-4 rounded-lg border transition-colors ${
                selectedReward?.id === reward.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : isEligible
                    ? 'border-gray-700 dark:border-gray-200 hover:border-blue-300 dark:hover:border-blue-700'
                    : 'border-gray-700 dark:border-gray-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-lg font-medium mb-2">{reward.name}</div>
              <div className="text-2xl font-bold mb-2">RM {reward.amount}</div>
              <div className="text-sm text-gray-400 dark:text-gray-600">
                {isEligible ? '✅ Eligible' : '❌ Not Eligible'}
              </div>
            </button>
          );
        })}
      </div>
      {selectedReward && (
        <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6 border border-gray-700 dark:border-gray-200">
          <h2 className="text-xl font-bold mb-4">
            Claim {selectedReward.name}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                required
                value={paymentDetails.bankName}
                onChange={(e) =>
                  setPaymentDetails((prev) => ({
                    ...prev,
                    bankName: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-600 dark:border-gray-300 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                placeholder="e.g., Maybank, CIMB, Public Bank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                required
                value={paymentDetails.accountNumber}
                onChange={(e) =>
                  setPaymentDetails((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-600 dark:border-gray-300 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                placeholder="Enter your bank account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                value={paymentDetails.accountHolderName}
                onChange={(e) =>
                  setPaymentDetails((prev) => ({
                    ...prev,
                    accountHolderName: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-600 dark:border-gray-300 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                placeholder="Enter account holder's name"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
