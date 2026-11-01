'use client';

import Link from 'next/link';

export default function RewardsSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
      <h1 className="text-3xl font-bold text-strong mb-4">
        Reward Claim Submitted!
      </h1>
      <p className="text-soft mb-8">
        Your reward claim has been successfully submitted. Our team will review
        your claim and process the payment within 5-7 working days. You can
        check the status of your claim in your profile.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/rewards"
          className="px-6 py-2 bg-muted text-strong rounded-lg font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
        >
          View All Rewards
        </Link>
        <Link
          href="/profile"
          className="px-6 py-2 bg-[var(--band-via)] text-white rounded-lg font-medium hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 transition-colors"
        >
          Check Claim Status
        </Link>
      </div>
    </div>
  );
}
