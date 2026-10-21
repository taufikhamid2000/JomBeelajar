import { logger } from '@/lib/logger';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'edubridge' },
      // Jom ID: shared *.taufikhamid.com session cookie (read-only here).
      cookieOptions: jomCookieOptions((await headers()).get('host')),
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
  try {
    const { data, error } = await supabase.rpc('get_random_topic');

    logger.log('Random topic response:', { data, error });

    if (error) {
      logger.error('Error executing get_random_topic:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || !data[0]) {
      logger.error('No topics found in database');
      return NextResponse.json(
        { error: 'No topics found in database' },
        { status: 404 }
      );
    }

    const topic = data[0];

    if (!topic.subject_slug) {
      logger.error('Topic found but subject_slug is missing:', topic);
      return NextResponse.json(
        { error: 'Topic found but subject is missing' },
        { status: 500 }
      );
    }

    const response = {
      subject_slug: topic.subject_slug,
      topic_id: topic.id,
    };

    logger.log('Returning response:', response);
    return NextResponse.json(response);
  } catch (err) {
    logger.error('Error fetching random topic:', err);
    return NextResponse.json(
      { error: 'Failed to fetch random topic' },
      { status: 500 }
    );
  }
}
