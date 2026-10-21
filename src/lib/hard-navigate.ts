/**
 * Full-page navigation to an internal path, bypassing the Next.js client
 * router on purpose.
 *
 * Used after auth state changes (sign-in, sign-out, session loss): a hard
 * load makes the browser send the freshly written/cleared Supabase cookies
 * so middleware and Server Components render against the new session, and
 * it drops any client-side state belonging to the previous user. For
 * ordinary in-app navigation use `next/link` or `useRouter().push()`.
 */
export function hardNavigate(path: string): void {
  window.location.assign(path);
}
