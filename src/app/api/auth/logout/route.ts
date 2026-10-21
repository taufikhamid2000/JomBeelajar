import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';

export async function POST() {
  const cookieStore = await cookies();
  // Jom ID: the session cookie is shared across *.taufikhamid.com, so the
  // sign-out (and any cookie deletion) must target the same Domain/Path the
  // cookie was written with, or the browser keeps the shared one.
  const cookieOptions = jomCookieOptions((await headers()).get('host'));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'edubridge' },
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.signOut();

  // Belt and braces: expire any sb-* auth cookie still present (e.g. if the
  // signOut call failed) with the same Domain/Path as the shared cookie.
  const { domain, path, sameSite, secure } = cookieOptions;
  for (const { name } of cookieStore.getAll()) {
    if (!name.startsWith('sb-')) continue;
    cookieStore.set(name, '', { domain, path, sameSite, secure, maxAge: 0 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
