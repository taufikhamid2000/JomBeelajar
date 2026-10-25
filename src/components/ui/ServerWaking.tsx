'use client';
import React, { useEffect, useState } from 'react';

export function ServerWaking({
  delayMs = 4000,
  active = true,
}: {
  delayMs?: number;
  active?: boolean;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs, active]);

  if (!active || !show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto my-4 flex max-w-xl items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 shadow-sm dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
    >
      <span className="text-xl" aria-hidden="true">
        ☕
      </span>
      <span>Waking up the server, this can take ~30s on first load.</span>
    </div>
  );
}

export default ServerWaking;
