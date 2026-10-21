'use client';
import { logger } from '@/lib/logger';
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { jomIdSignupHref } from '@/lib/jom-id';

export default function AboutPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isParallaxEnabled, setIsParallaxEnabled] = useState(false);

  // Listen for auth changes so the "Access your dashboard" CTA below can
  // route logged-in visitors straight to /dashboard instead of /auth.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      logger.log('Auth state changed:', {
        event,
        isLoggedIn: loggedIn,
        hasSession: !!session,
      });
    });

    return () => subscription.unsubscribe();
  }, []);
  // Unified parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (!isParallaxEnabled) return;
      document.documentElement.style.setProperty(
        '--scroll',
        window.pageYOffset.toString()
      );
    };

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsParallaxEnabled(!isMobile);

      if (isMobile) {
        document.documentElement.style.setProperty('--scroll', '0');
        window.removeEventListener('scroll', handleScroll);
      } else {
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
      }
    };

    // Initial setup
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    // Only add scroll listener if parallax is enabled
    if (isParallaxEnabled) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isParallaxEnabled]);

  return (
    <>
      <Head>
        <title>About JomBeelajar</title>
      </Head>{' '}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24 px-8 md:px-20 overflow-hidden">
        {' '}
        {/* Parallax decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white transform translate-y-[calc(var(--scroll)*0.2px)]"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white transform translate-y-[calc(var(--scroll)*-0.3px)]"></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-white transform translate-y-[calc(var(--scroll)*0.15px)]"></div>

          {/* Additional parallax elements */}
          <div className="absolute top-1/4 left-1/4 w-12 h-12 rounded-full bg-white transform translate-y-[calc(var(--scroll)*-0.1px)]"></div>
          <div className="absolute bottom-1/3 left-1/5 w-24 h-24 rounded-full bg-white transform translate-y-[calc(var(--scroll)*0.25px)]"></div>

          {/* Enhanced parallax elements */}
          <div className="absolute top-1/5 right-1/3 w-28 h-28 rounded-lg rotate-45 bg-white transform translate-y-[calc(var(--scroll)*0.13px)] opacity-40"></div>
          <div className="absolute bottom-1/4 left-1/3 w-16 h-16 rounded-full bg-yellow-300 mix-blend-screen transform translate-y-[calc(var(--scroll)*-0.18px)] opacity-25"></div>
          <div className="absolute top-2/3 right-1/5 w-10 h-10 rounded-md bg-white transform translate-y-[calc(var(--scroll)*0.22px)] rotate-12"></div>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fadeIn">
            <span className="inline-block">Edu</span>
            <span className="inline-block text-yellow-300">Bridge</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto font-light">
            Earn up to RM1000 when you join JomBeelajar – and make your school
            proud!
          </p>{' '}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {' '}
            <button
              className="inline-block uppercase tracking-wide rounded-full shadow-lg transition-all duration-300 ease-in-out px-8 py-4 bg-white text-blue-600 font-medium hover:bg-gray-100 hover:scale-105 transform"
              onClick={() => {
                logger.log(
                  'Dashboard button clicked, isLoggedIn:',
                  isLoggedIn
                );
                router.push(isLoggedIn ? '/dashboard' : '/auth');
              }}
            >
              Access your dashboard
            </button>{' '}
            <button
              className="inline-block uppercase tracking-wide rounded-full shadow-lg transition-all duration-300 ease-in-out px-8 py-4 bg-yellow-400 text-blue-800 font-medium hover:bg-yellow-300 hover:scale-105 transform"
              onClick={() => {
                router.push('/career-guidance');
              }}
            >
              Subject Guidance 📚
            </button>{' '}
            <button
              className="inline-block uppercase tracking-wide rounded-full shadow-lg transition-all duration-300 ease-in-out px-8 py-4 bg-green-400 text-blue-800 font-medium hover:bg-green-300 hover:scale-105 transform"
              onClick={() => {
                router.push('/education-pathway');
              }}
            >
              Education Pathway 🎓
            </button>{' '}
            <button
              className="inline-block uppercase tracking-wide rounded-full shadow-lg transition-all duration-300 ease-in-out px-8 py-4 bg-transparent border-2 border-white text-white font-medium hover:bg-white/10 hover:scale-105 transform"
              onClick={() => {
                window.open('/docs/JomBeelajar%20Research.pdf', '_blank');
              }}
            >
              Learn More 📄
            </button>
          </div>
          {/* Stats preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 transform transition-all hover:scale-105">
              <div className="text-4xl font-bold text-yellow-300">1.1M+</div>
              <div className="text-sm mt-2">Malaysian Students</div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 transform transition-all hover:scale-105">
              <div className="text-4xl font-bold text-yellow-300">30+</div>
              <div className="text-sm mt-2">Quizzes per Week</div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 transform transition-all hover:scale-105">
              <div className="text-4xl font-bold text-yellow-300">70%</div>
              <div className="text-sm mt-2">Academic Improvement</div>
            </div>
          </div>
        </div>
      </div>{' '}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="mb-4 text-gray-300 dark:text-gray-700">
            JomBeelajar is a lightweight, gamified microlearning platform built to
            help Malaysian Form 4 and Form 5 students strengthen their academic
            skills through daily engagement. By offering fast, rewarding quiz
            experiences, JomBeelajar motivates students to build consistent study
            habits, earn recognition, and achieve measurable academic growth.
          </p>
          <p className="text-gray-300 dark:text-gray-700">
            The platform operates independently, without claiming alignment with
            any official examination board or curriculum.
          </p>
        </div>

        <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Approach</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-medium mb-2 text-blue-600 dark:text-blue-400">
                Learning Method
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-300 dark:text-gray-700">
                <li>
                  Daily bite-sized quizzes covering key secondary school topics
                </li>
                <li>XP points earned for participation and mastery</li>
                <li>Streak rewards for consecutive daily engagement</li>
                <li>Weekly and monthly prizes to drive motivation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2 text-blue-600 dark:text-blue-400">
                Platform Principles
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-300 dark:text-gray-700">
                <li>Mobile-first design</li>
                <li>Low-bandwidth usage</li>
                <li>Gamification at the core</li>
                <li>Independent and curriculum-neutral</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="py-20 px-8 max-w-6xl mx-auto">
        {' '}
        <div className="text-center mb-16 relative">
          {/* About us parallax background */}
          <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden">
            {/* Animated background shapes */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-50/30 dark:bg-blue-900/5 rounded-full blur-3xl transform translate-y-[calc(var(--scroll)*0.06px)]"></div>
            <div className="absolute -bottom-20 -right-10 w-72 h-72 bg-indigo-50/30 dark:bg-indigo-900/5 rounded-full blur-3xl transform translate-y-[calc(var(--scroll)*-0.04px)]"></div>
          </div>

          <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-4 dark:bg-blue-900/30 dark:text-blue-300 relative">
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full transform translate-y-[calc(var(--scroll)*0.25px)]"></span>
            ABOUT US
          </span>
          <h2 className="text-4xl font-bold mb-6">
            Welcome to{' '}
            <span className="text-blue-600 dark:text-blue-400 relative inline-block">
              JomBeelajar
            </span>
          </h2>
          <div className="h-1 w-20 bg-yellow-400 mx-auto"></div>
        </div>{' '}
        <div className="bg-gray-800 dark:bg-white rounded-xl shadow-xl p-8 mb-16 border border-gray-100 dark:border-gray-700 transform transition-all hover:shadow-2xl">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none text-gray-300 dark:text-gray-700">
              <h2 className="text-3xl font-bold mb-6 text-gray-100 dark:text-gray-800">
                Earn up to RM1000 when you join JomBeelajar – and make your school
                proud!
              </h2>

              <p className="text-lg mb-6">
                JomBeelajar isn't just about preparing for your SPM – it's a
                revolution in how Malaysian students learn, compete, and get
                rewarded.
              </p>

              <p className="text-lg mb-6">
                As a Quiz Answerer, you'll complete quizzes, collect points, and
                climb the leaderboard. But this isn't just about personal glory:
                at the end of the year, the top students will win up to RM1000
                in cash prizes! Imagine walking into your exam hall knowing
                you've already scored a major win.
              </p>

              <p className="text-lg mb-6">
                But why stop at solo success? JomBeelajar lets you represent your
                school. Your points don't just boost your own ranking – they
                contribute to your school's total. Imagine Sekolah Menengah
                Kebangsaan Ayer Jernih outperforming MRSM Tawau. Pergh. The
                bragging rights would be legendary! Watch the leaderboard as
                your school rises through the ranks, bringing pride (yeah its
                impossible tho).
              </p>

              <p className="text-lg mb-6">
                And it's not just the students paying attention. KPM be like:
                "Alamak, this analytics says students from Klang, Selangor are
                actually far behind. What are they doing? Maybe we gotta send in
                some reinforcement." JomBeelajar doesn't just gamify studying – it
                generates real insights that spotlight where schools shine and
                where they need extra support.
              </p>

              <p className="text-lg mb-6">
                Here's the kicker: The KPM tried to switch away from exam-based
                education. Oh yeah? Watch this. JomBeelajar isn't just embracing
                exams – we're making them worth your time.
              </p>

              <p className="text-lg mb-6">
                Meanwhile, the elite school's headmaster be like: "We can't lose
                to fools like them." Slowly pulls out her rotan. "Get back to
                https://jombeelajar.taufikhamid.com/, students." (For legal
                purposes, this is a joke.)
              </p>

              <p className="text-lg mb-6">
                If you've got a knack for creativity, become a Quiz Maker.
                Design quizzes that attract thousands of answers, and you'll
                earn real money. With ad engagement rates of RM2–RM6.50 per 1000
                attempts, your viral quizzes could generate hundreds – maybe
                even RM1000 or more. Yes, this one's open to all, not just
                students.
              </p>

              <p className="text-lg mb-6">
                Whether you're competing solo, representing your school, or
                creating quizzes, JomBeelajar is your chance to turn study time
                into earning time.
              </p>

              <p className="text-lg mb-6 font-semibold">
                Join JomBeelajar today. Master your subjects, make money, and
                maybe even watch your school crush the competition.
              </p>

              <p className="text-lg italic">
                "Hey Taufik, isn't this a scam?"
                <br />
                Yes. Yes it is. (For legal purposes, this is also a joke.)
              </p>
            </div>
          </div>
        </div>{' '}
        <div className="text-center mb-12 mt-20 relative">
          {/* Subtle parallax decorative elements */}
          <div className="absolute pointer-events-none -z-10 opacity-5">
            <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-green-500 transform translate-y-[calc(var(--scroll)*-0.05px)]"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-blue-500 transform translate-y-[calc(var(--scroll)*0.05px)]"></div>
          </div>

          <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-4 dark:bg-green-900/30 dark:text-green-300">
            OPPORTUNITY
          </span>
          <h3 className="text-3xl font-bold mb-6">Market Opportunity</h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
                <svg
                  className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-100 dark:text-gray-800">
                Market Overview
              </h4>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  <strong>1.1 million</strong> students in Malaysian upper
                  secondary education (Form 4 and 5)
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Competitors focus on static notes or traditional AI tutors
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Current options lack proper engagement loops
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-4">
                <svg
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-100 dark:text-gray-800">
                Gaps Identified
              </h4>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Limited tools combining quick learning ⚡, habit formation,
                  and tangible rewards 🏅
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Traditional apps are not mobile-data friendly, disadvantaging
                  B40 groups
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  No major platform currently gamifies daily subject mastery at
                  secondary school level
                </span>
              </li>
            </ul>
          </div>{' '}
        </div>{' '}
        <div className="text-center mb-12 mt-20 relative">
          {/* Target users parallax elements */}
          <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute -top-10 -left-5 w-20 h-20 rounded-lg bg-yellow-500/5 transform translate-y-[calc(var(--scroll)*0.1px)] rotate-12"></div>
            <div className="absolute top-1/2 right-0 w-32 h-32 rounded-lg bg-yellow-500/5 transform translate-y-[calc(var(--scroll)*-0.15px)] -rotate-12"></div>
            <div className="absolute -bottom-5 left-1/3 w-16 h-16 rounded-full bg-yellow-500/5 transform translate-y-[calc(var(--scroll)*0.08px)]"></div>
          </div>

          <span className="inline-block px-4 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold mb-4 dark:bg-yellow-900/30 dark:text-yellow-300 relative">
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full transform translate-y-[calc(var(--scroll)*0.3px)]"></span>
            <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full transform translate-y-[calc(var(--scroll)*-0.3px)]"></span>
            AUDIENCE
          </span>
          <h3 className="text-3xl font-bold mb-6">🎯 Target Users</h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8 relative">
            <div className="absolute w-3 h-3 rounded-full bg-yellow-300 -left-4 -top-1 transform translate-y-[calc(var(--scroll)*-0.25px)]"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-center text-gray-100 dark:text-gray-800">
              Primary
            </h4>
            <p className="text-gray-300 dark:text-gray-600 text-center">
              Form 4 and Form 5 students aiming to strengthen academic mastery
              📚
            </p>
          </div>

          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-center text-gray-100 dark:text-gray-800">
              Secondary
            </h4>
            <p className="text-gray-300 dark:text-gray-600 text-center">
              Students retaking secondary-level examinations 🔄
            </p>
          </div>

          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-center text-gray-100 dark:text-gray-800">
              Tertiary
            </h4>
            <p className="text-gray-300 dark:text-gray-600 text-center">
              Parents and teachers seeking complementary study tools for their
              children or students 👨‍🏫
            </p>
          </div>
        </div>{' '}
        <div className="text-center mb-12 mt-20 relative">
          {/* Floating shapes with parallax */}
          <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden">
            <div className="absolute -top-10 left-1/4 w-16 h-16 rounded-md bg-blue-500/5 rotate-45 transform translate-y-[calc(var(--scroll)*0.08px)]"></div>
            <div className="absolute top-1/2 -right-5 w-20 h-20 rounded-md bg-indigo-500/5 rotate-12 transform translate-y-[calc(var(--scroll)*-0.1px)]"></div>
            <div className="absolute -bottom-5 left-10 w-12 h-12 rounded-full bg-green-500/5 transform translate-y-[calc(var(--scroll)*0.12px)]"></div>
          </div>

          <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-4 dark:bg-blue-900/30 dark:text-blue-300">
            FEATURES
          </span>
          <h3 className="text-3xl font-bold mb-6">💡 Core Concept</h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8 relative">
            <div className="absolute w-4 h-4 rounded-full bg-yellow-300/30 -left-5 -top-1 transform translate-y-[calc(var(--scroll)*-0.2px)]"></div>
            <div className="absolute w-3 h-3 rounded-full bg-yellow-300/20 -right-4 -top-1 transform translate-y-[calc(var(--scroll)*0.15px)]"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl">
            <h4 className="text-xl font-semibold mb-4 text-gray-100 dark:text-gray-800 flex items-center">
              <span className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full mr-3">
                <svg
                  className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </span>
              Learning Method
            </h4>
            <ul className="space-y-3 pl-12">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Daily bite-sized quizzes covering key secondary school topics
                  ❓
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  XP points earned for participation and mastery ✨
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Streak rewards for consecutive daily engagement 🔥
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Weekly and monthly cash prizes to drive motivation 💰
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl">
            <h4 className="text-xl font-semibold mb-4 text-gray-100 dark:text-gray-800 flex items-center">
              <span className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-full mr-3">
                <svg
                  className="h-6 w-6 text-teal-600 dark:text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </span>
              Platform Principles
            </h4>
            <ul className="space-y-3 pl-12">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Mobile-first design 📱
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Low-bandwidth usage 🌐
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Gamification at the core 🎮
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 dark:text-gray-700">
                  Independent and curriculum-neutral 🔍
                </span>
              </li>
            </ul>
          </div>
        </div>{' '}
        <div className="text-center mb-12 mt-20 relative">
          {/* Roadmap parallax decorations */}
          <div className="absolute inset-0 w-full h-full -z-10">
            <div className="absolute top-1/2 left-1/4 transform translate-y-[calc(-50%+var(--scroll)*0.05px)] w-28 h-28 rounded-full border-2 border-dashed border-indigo-200/30 dark:border-indigo-700/20 rotate-[calc(var(--scroll)*0.03deg)]"></div>
            <div className="absolute top-1/3 right-1/5 transform translate-y-[calc(-50%+var(--scroll)*-0.03px)] w-40 h-40 rounded-full border border-indigo-200/20 dark:border-indigo-700/10 rotate-[calc(var(--scroll)*-0.02deg)]"></div>
          </div>

          <span className="inline-block px-4 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-semibold mb-4 dark:bg-indigo-900/30 dark:text-indigo-300 relative">
            <span className="absolute -right-2 -top-2 w-2 h-2 bg-indigo-400 rounded-full transform translate-y-[calc(var(--scroll)*-0.15px)]"></span>
            ROADMAP
          </span>
          <h3 className="text-3xl font-bold mb-6">📅 Phase-by-Phase Plan</h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8"></div>
        </div>
        <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 mb-16">
          <div className="relative">
            {' '}
            {/* Timeline line with parallax effect */}
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-blue-200 dark:bg-blue-900/50 rounded-full ml-0.5 timeline-line"></div>
            {/* Parallax timeline decorations */}
            <div className="absolute left-6 top-[10%] w-3 h-3 bg-blue-400/30 dark:bg-blue-400/20 rounded-full ml-0.5 transform -translate-x-1/2 translate-y-[calc(var(--scroll)*-0.12px)]"></div>
            <div className="absolute left-6 top-[35%] w-3 h-3 bg-blue-400/30 dark:bg-blue-400/20 rounded-full ml-0.5 transform -translate-x-1/2 translate-y-[calc(var(--scroll)*0.14px)]"></div>
            <div className="absolute left-6 top-[60%] w-3 h-3 bg-blue-400/30 dark:bg-blue-400/20 rounded-full ml-0.5 transform -translate-x-1/2 translate-y-[calc(var(--scroll)*-0.08px)]"></div>
            <div className="absolute left-6 top-[85%] w-3 h-3 bg-blue-400/30 dark:bg-blue-400/20 rounded-full ml-0.5 transform -translate-x-1/2 translate-y-[calc(var(--scroll)*0.10px)]"></div>
            <div className="space-y-8">
              {/* Phase 1 */}
              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    1
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-100 dark:text-gray-800 mb-2">
                  MVP Development{' '}
                  <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">
                    (0-4 months)
                  </span>
                </h4>
                <p className="text-gray-300 dark:text-gray-600">
                  Bahasa Melayu and Sejarah modules, XP system, streak
                  mechanics, leaderboard functionality. Pilot version tested
                  internally 🧪
                </p>
              </div>

              {/* Phase 2 */}
              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    2
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-100 dark:text-gray-800 mb-2">
                  Pilot Testing{' '}
                  <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">
                    (4-6 months)
                  </span>
                </h4>
                <p className="text-gray-300 dark:text-gray-600">
                  Soft-launch with 2–3 schools 🏫, Target 100–500 students 🎯,
                  Measure Day-2 retention and weekly engagement metrics 📊
                </p>
              </div>

              {/* Phase 3 */}
              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    3
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-100 dark:text-gray-800 mb-2">
                  Expansion{' '}
                  <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">
                    (6-9 months)
                  </span>
                </h4>
                <p className="text-gray-300 dark:text-gray-600">
                  Add new subjects (Mathematics, Science) ➕, Improve user
                  experience based on pilot feedback 🔄
                </p>
              </div>

              {/* Phase 4 */}
              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    4
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-100 dark:text-gray-800 mb-2">
                  Malaysia-Wide Launch{' '}
                  <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">
                    (9-15 months)
                  </span>
                </h4>
                <p className="text-gray-300 dark:text-gray-600">
                  Regional marketing efforts 📣, Introduce first formal
                  sponsorship programs 🤝
                </p>
              </div>

              {/* Phase 5 */}
              <div className="relative pl-16">
                <div className="absolute left-0 top-1 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    5
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-100 dark:text-gray-800 mb-2">
                  Optional Regional Expansion{' '}
                  <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">
                    (15+ months)
                  </span>
                </h4>
                <p className="text-gray-300 dark:text-gray-600">
                  Launch "Global Skills Track" (basic English, Math, Science
                  quizzes) 🌍, Offer flexible onboarding for regional markets 🛫
                </p>
              </div>
            </div>
          </div>{' '}
        </div>
        <div className="text-center mb-12 mt-20">
          <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-4 dark:bg-green-900/30 dark:text-green-300">
            BUSINESS
          </span>
          <h3 className="text-3xl font-bold mb-6">
            💰 Revenue & Sustainability
          </h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center mb-5">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold ml-3 text-gray-100 dark:text-gray-800">
                Revenue Streams
              </h4>
            </div>

            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full mr-3 mt-0.5">
                  <svg
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-200 dark:text-gray-800">
                    Freemium Access 🆓
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Free quizzes with optional upgrades (analytics, offline
                    packs)
                  </p>
                </div>
              </li>

              <li className="flex items-start">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full mr-3 mt-0.5">
                  <svg
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-200 dark:text-gray-800">
                    Sponsored Rewards 🏆
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Corporate sponsors for cash prizes and tournament events
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center mb-5">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                <svg
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold ml-3 text-gray-100 dark:text-gray-800">
                Partnership Models
              </h4>
            </div>

            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-full mr-3 mt-0.5">
                  <svg
                    className="h-4 w-4 text-purple-600 dark:text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-200 dark:text-gray-800">
                    B2B Licensing 🏢
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Packages for tuition centers, NGOs, and community programs
                  </p>
                </div>
              </li>

              <li className="flex items-start">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-full mr-3 mt-0.5">
                  <svg
                    className="h-4 w-4 text-purple-600 dark:text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-200 dark:text-gray-800">
                    Supporter Donations 🎗️
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Voluntary support from alumni, parents, or public backers
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>{' '}
        <div className="text-center mb-12 mt-20">
          <span className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold mb-4 dark:bg-amber-900/30 dark:text-amber-300">
            RISK MANAGEMENT
          </span>
          <h3 className="text-3xl font-bold mb-6">⚠️ Risks and Mitigation</h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8"></div>
        </div>
        <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-700/50 dark:bg-gray-50 rounded-lg p-5 border border-gray-600 dark:border-gray-100">
              <div className="flex items-center mb-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                  <svg
                    className="h-5 w-5 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-bold ml-3 text-gray-100 dark:text-gray-800">
                  Competition Risk
                </h4>
              </div>
              <div className="ml-10">
                <p className="text-gray-300 dark:text-gray-700 mb-2">
                  <strong>Risk:</strong> Competition from existing education
                  apps.
                </p>
                <p className="text-gray-400 dark:text-gray-600 text-sm bg-green-900/20 dark:bg-green-50 p-2 rounded-md border-l-4 border-green-500">
                  <strong>Mitigation:</strong> Focus on gamification and rewards
                  system, not static content. Unique selling proposition through
                  engagement loops.
                </p>
              </div>
            </div>

            <div className="bg-gray-700/50 dark:bg-gray-50 rounded-lg p-5 border border-gray-600 dark:border-gray-100">
              <div className="flex items-center mb-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                  <svg
                    className="h-5 w-5 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-bold ml-3 text-gray-100 dark:text-gray-800">
                  Retention Risk
                </h4>
              </div>
              <div className="ml-10">
                <p className="text-gray-300 dark:text-gray-700 mb-2">
                  <strong>Risk:</strong> Low user retention rates.
                </p>
                <p className="text-gray-400 dark:text-gray-600 text-sm bg-green-900/20 dark:bg-green-50 p-2 rounded-md border-l-4 border-green-500">
                  <strong>Mitigation:</strong> Implement gamified loops, cash
                  incentives, and social recognition features to enhance user
                  engagement.
                </p>
              </div>
            </div>

            <div className="bg-gray-700/50 dark:bg-gray-50 rounded-lg p-5 border border-gray-600 dark:border-gray-100">
              <div className="flex items-center mb-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                  <svg
                    className="h-5 w-5 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-bold ml-3 text-gray-100 dark:text-gray-800">
                  System Abuse Risk
                </h4>
              </div>
              <div className="ml-10">
                <p className="text-gray-300 dark:text-gray-700 mb-2">
                  <strong>Risk:</strong> Abuse of prize system.
                </p>
                <p className="text-gray-400 dark:text-gray-600 text-sm bg-green-900/20 dark:bg-green-50 p-2 rounded-md border-l-4 border-green-500">
                  <strong>Mitigation:</strong> Implement fraud prevention
                  through ID verification, randomized audits, and behavior
                  pattern analysis.
                </p>
              </div>
            </div>

            <div className="bg-gray-700/50 dark:bg-gray-50 rounded-lg p-5 border border-gray-600 dark:border-gray-100">
              <div className="flex items-center mb-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                  <svg
                    className="h-5 w-5 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-bold ml-3 text-gray-100 dark:text-gray-800">
                  Financial Risk
                </h4>
              </div>
              <div className="ml-10">
                <p className="text-gray-300 dark:text-gray-700 mb-2">
                  <strong>Risk:</strong> Funding shortages.
                </p>
                <p className="text-gray-400 dark:text-gray-600 text-sm bg-green-900/20 dark:bg-green-50 p-2 rounded-md border-l-4 border-green-500">
                  <strong>Mitigation:</strong> Secure early sponsorship deals
                  and implement low-cost serverless hosting strategies to
                  minimize burn rate.
                </p>
              </div>
            </div>
          </div>
        </div>{' '}
        <div className="text-center mb-12 mt-20 relative">
          {/* Success metrics parallax decorations */}
          <div className="absolute inset-0 w-full h-full -z-10">
            {/* Chart-like decorative elements with parallax */}
            <div className="absolute top-1/4 left-1/4 w-24 h-1 bg-blue-500/10 transform translate-y-[calc(var(--scroll)*0.14px)]"></div>
            <div className="absolute top-1/3 left-1/4 w-32 h-1 bg-blue-500/10 transform translate-y-[calc(var(--scroll)*0.08px)]"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-1 bg-blue-500/10 transform translate-y-[calc(var(--scroll)*0.11px)]"></div>

            {/* Right side chart elements */}
            <div className="absolute top-1/4 right-1/4 w-16 h-1 bg-green-500/10 transform translate-y-[calc(var(--scroll)*-0.15px)]"></div>
            <div className="absolute top-1/3 right-1/4 w-24 h-1 bg-green-500/10 transform translate-y-[calc(var(--scroll)*-0.09px)]"></div>
            <div className="absolute top-1/2 right-1/4 w-20 h-1 bg-green-500/10 transform translate-y-[calc(var(--scroll)*-0.12px)]"></div>
          </div>
          <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-4 dark:bg-blue-900/30 dark:text-blue-300 relative">
            <span className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full transform translate-y-[calc(var(--scroll)*-0.2px)]"></span>
            PERFORMANCE
          </span>
          <h3 className="text-3xl font-bold mb-6">📈 Success Metrics</h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8 relative">
            <div className="absolute -right-4 -top-1 w-3 h-3 rounded-full bg-yellow-300 transform translate-y-[calc(var(--scroll)*0.22px)]"></div>
          </div>{' '}
        </div>{' '}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 relative">
          {/* Parallax effect for first card */}
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center sm:translate-y-[calc(var(--scroll)*0.02px)]">
            {' '}
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
              <div className="absolute w-10 sm:w-12 h-3 bg-indigo-200/50 dark:bg-indigo-700/30 rounded-full -rotate-45 transform sm:translate-y-[calc(var(--scroll)*-0.05px)]"></div>
              <svg
                className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-gray-100 dark:text-gray-800 mb-2">
              45%
            </h4>
            <p className="text-gray-300 dark:text-gray-600">
              Day-2 retention among pilot users
            </p>
          </div>{' '}
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-gray-100 dark:text-gray-800 mb-2">
              30+
            </h4>
            <p className="text-gray-300 dark:text-gray-600">
              Quizzes per user weekly
            </p>{' '}
          </div>{' '}
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center sm:translate-y-[calc(var(--scroll)*-0.015px)]">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
              <div className="absolute w-10 h-10 bg-purple-200/40 dark:bg-purple-700/30 rounded-full transform sm:translate-y-[calc(var(--scroll)*0.04px)] rotate-45"></div>
              <svg
                className="h-8 w-8 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-gray-100 dark:text-gray-800 mb-2">
              1,000+
            </h4>
            <p className="text-gray-300 dark:text-gray-600">
              Monthly active users by Month 4
            </p>{' '}
          </div>{' '}
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center sm:translate-y-[calc(var(--scroll)*0.025px)]">
            <div className="bg-amber-100 dark:bg-amber-900/30 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-amber-200/30 dark:bg-amber-700/20 rounded-full clip-path-star transform sm:translate-y-[calc(var(--scroll)*-0.06px)] rotate-[25deg]"></div>
              <svg
                className="h-8 w-8 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-gray-100 dark:text-gray-800 mb-2">
              70%
            </h4>
            <p className="text-gray-300 dark:text-gray-600">
              Users showing academic improvement
            </p>
          </div>
        </div>
        <div className="text-center mb-12 mt-20">
          <span className="inline-block px-4 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-semibold mb-4 dark:bg-purple-900/30 dark:text-purple-300">
            SUMMARY
          </span>
          <h3 className="text-3xl font-bold mb-6">🔚 Conclusion</h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8"></div>
        </div>
        <div className="bg-gray-800 dark:bg-white rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 mb-16">
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-300 dark:text-gray-700 leading-relaxed text-center">
              JomBeelajar addresses a critical gap in Malaysia&rsquo;s education
              ecosystem: the need for daily, engaging, rewarding, and low-data
              independent learning. Its initial launch in Malaysia gives it a
              clear target market with manageable competition. By validating
              user engagement and impact early, JomBeelajar can later expand to
              broader regions without losing focus.
            </p>
          </div>
        </div>
        <div className="text-center mb-12 mt-20">
          <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-4 dark:bg-green-900/30 dark:text-green-300">
            ACTION PLAN
          </span>
          <h3 className="text-3xl font-bold mb-6">Next Steps ➡️</h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8"></div>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-blue-50 dark:to-indigo-50 rounded-xl shadow-lg p-8 border border-gray-700 dark:border-blue-100 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="font-bold">1</span>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-bold mb-2 text-gray-100 dark:text-gray-800">
                  Finalize MVP Specifications
                </h4>
                <p className="text-gray-300 dark:text-gray-600">
                  Complete technical requirements and feature prioritization for
                  the minimum viable product.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="font-bold">2</span>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-bold mb-2 text-gray-100 dark:text-gray-800">
                  Build Minimum Content
                </h4>
                <p className="text-gray-300 dark:text-gray-600">
                  Develop initial quiz sets for Bahasa Melayu and Sejarah
                  modules to support launch.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="font-bold">3</span>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-bold mb-2 text-gray-100 dark:text-gray-800">
                  Prepare Reward Pool
                </h4>
                <p className="text-gray-300 dark:text-gray-600">
                  Establish initial funding for the early reward pool to
                  incentivize user participation.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="font-bold">4</span>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-bold mb-2 text-gray-100 dark:text-gray-800">
                  Begin Pilot Outreach
                </h4>
                <p className="text-gray-300 dark:text-gray-600">
                  Contact potential school partners for initial testing phase
                  and feedback collection.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mb-12 mt-20">
          <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-4 dark:bg-blue-900/30 dark:text-blue-300">
            JOIN US
          </span>
          <h3 className="text-3xl font-bold mb-6">🙌 Get Involved</h3>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8"></div>
        </div>{' '}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-xl shadow-xl p-12 border border-blue-500 mb-16 text-center relative overflow-hidden">
          {/* Parallax background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-40 h-40 rounded-full bg-white opacity-5 transform translate-y-[calc(var(--scroll)*-0.07px)]"></div>
            <div className="absolute bottom-10 right-1/5 w-60 h-60 rounded-full bg-white opacity-5 transform translate-y-[calc(var(--scroll)*0.04px)]"></div>
            <div className="absolute top-1/2 left-3/4 w-20 h-20 rounded-full bg-white opacity-5 transform translate-y-[calc(var(--scroll)*-0.12px)]"></div>
          </div>

          <h4 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to empower students?
          </h4>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
            Join JomBeelajar today and make a difference in Malaysia's education
            ecosystem.
          </p>
          <a
            href={jomIdSignupHref}
            className="inline-block uppercase tracking-wide rounded-full shadow-lg transition-all duration-300 ease-in-out px-8 py-4 bg-white text-blue-600 font-medium hover:bg-gray-100 hover:scale-105 transform"
          >
            Sign Up Now
          </a>
        </div>
      </section>
    </>
  );
}
