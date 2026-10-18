'use client';
import { logger } from '@/lib/logger';
/* eslint-disable react/no-unescaped-entities */

import { useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';

export default function TermsPage() {
  // Check session on page load to prevent unintended logout
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { error } = await supabase.auth.getSession();

        // If there's an authentication error, attempt to recover the session
        if (error) {
          const { recoverSession } = await import('@/lib/supabase');
          await recoverSession();
        }
      } catch (err) {
        logger.error('Session check error:', err);
      }
    };

    checkSession();
  }, []);
  return (
    <>
      <Head>
        <title>Terms of Service | JomBeelajar</title>
      </Head>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Terms of Service
        </h1>

        <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-8">
          <p className="mb-4 italic text-gray-400 dark:text-gray-600 text-center">
            Last Updated: May 18, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-300 dark:text-gray-700">
              By accessing or using JomBeelajar ("we", "our", or "us") website,
              mobile application, or any of our services (collectively, the
              "Services"), you agree to be bound by these Terms of Service. If
              you do not agree to these terms, please do not use our Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">
              2. Description of Services
            </h2>
            <p className="text-gray-300 dark:text-gray-700">
              JomBeelajar is a microlearning platform that offers educational
              content through quizzes, activities, and other learning materials
              primarily focused on the Malaysian Form 4 and Form 5 curriculum.
              Our Services include features such as daily quizzes, progress
              tracking, leaderboards, and reward systems.
            </p>
            <p className="mt-3 text-gray-300 dark:text-gray-700">
              We operate independently and do not claim official alignment with
              any examination board or curriculum.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
            <p className="mb-3 text-gray-300 dark:text-gray-700">
              To access certain features of our Services, you may need to create
              an account. You are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300 dark:text-gray-700">
              <li>
                Providing accurate and complete information during registration
              </li>
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">4. User Conduct</h2>
            <p className="mb-3 text-gray-300 dark:text-gray-700">
              By using our Services, you agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300 dark:text-gray-700">
              <li>Use our Services for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Services
              </li>
              <li>Share your account credentials with others</li>
              <li>
                Use automated means to access or collect data from our Services
              </li>
              <li>
                Post or transmit harmful content, including viruses or malware
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">
              5. Intellectual Property
            </h2>
            <p className="text-gray-300 dark:text-gray-700">
              All content, features, and functionality of our Services,
              including but not limited to text, graphics, logos, and software,
              are owned by JomBeelajar or our licensors and are protected by
              intellectual property laws. You may not reproduce, distribute, or
              create derivative works without our express permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">
              6. Disclaimer of Warranties
            </h2>
            <p className="text-gray-300 dark:text-gray-700">
              Our Services are provided on an "as is" and "as available" basis.
              We make no warranties, expressed or implied, regarding the
              operation or availability of our Services, or the accuracy of any
              content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">
              7. Limitation of Liability
            </h2>
            <p className="text-gray-300 dark:text-gray-700">
              In no event shall JomBeelajar be liable for any indirect,
              incidental, special, or consequential damages arising out of or in
              any way connected with the use of our Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">8. Changes to Terms</h2>
            <p className="text-gray-300 dark:text-gray-700">
              We may modify these Terms of Service at any time. We will provide
              notice of any material changes through our Services or by other
              means. Your continued use of our Services after such modifications
              constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-gray-300 dark:text-gray-700">
              If you have any questions about these Terms, please contact us at
              terms@edubridge.example.com.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
