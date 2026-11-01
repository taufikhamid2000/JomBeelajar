'use client';

import { useState, useEffect } from 'react';

export default function Stopwatch() {
  const [seconds, setSeconds] = useState(0);
  const NEXT_BUILD_TIME = 47; // Based on our build time

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number) => {
    if (seconds < NEXT_BUILD_TIME * 0.5) return 'text-brand';
    if (seconds < NEXT_BUILD_TIME)
      return 'text-yellow-600 dark:text-yellow-300';
    return 'text-red-600 dark:text-red-300';
  };

  return (
    <div className={`text-sm font-mono ${getTimeColor(seconds)}`}>
      Loading time: {formatTime(seconds)}
    </div>
  );
}
