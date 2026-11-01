'use client';

import { useRouter } from 'next/navigation';
import Head from 'next/head';
import ContributionForm from '../components/ContributionForm';

export default function ContributePage() {
  const router = useRouter();

  const handleSuccess = () => {
    // You could redirect after a delay if you wanted
    // setTimeout(() => {
    //   router.push('/career-guidance');
    // }, 3000);
  };

  const handleCancel = () => {
    router.push('/career-guidance');
  };

  return (
    <>
      <Head>
        <title>Contribute a Career Pathway - JomBeelajar</title>
      </Head>{' '}
      <div className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {' '}
            <h1 className="text-4xl font-extrabold text-strong sm:text-5xl sm:tracking-tight lg:text-6xl">
              Contribute a Career Pathway
            </h1>
            <p className="max-w-xl mt-5 mx-auto text-xl text-soft">
              Help us expand our database of career pathways by sharing your
              expertise
            </p>
          </div>
          <ContributionForm
            onSubmitSuccess={handleSuccess}
            onCancel={handleCancel}
          />{' '}
          <div className="mt-16 text-center">
            <p className="text-base text-soft">
              Thank you for helping make JomBeelajar better for everyone!
            </p>
            <button
              onClick={() => router.push('/career-guidance')}
              className="mt-4 text-brand hover:text-brand"
            >
              ← Return to Career Guidance
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
