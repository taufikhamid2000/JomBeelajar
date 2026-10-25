import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getSchools, createSchool, SCHOOL_TYPES } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function GET() {
  try {
    const schools = await getSchools();
    return NextResponse.json(schools, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    logger.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      district,
      state,
      code,
      address,
      website,
      phone,
      principalName,
      totalStudents,
    } = body;

    if (!name || !type || !district || !state) {
      return NextResponse.json(
        { error: 'name, type, district, and state are required' },
        { status: 400 }
      );
    }
    if (!SCHOOL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${SCHOOL_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const school = await createSchool(
      {
        name,
        type,
        district,
        state,
        code,
        address,
        website,
        phone,
        principalName,
        totalStudents,
      },
      token
    );
    return NextResponse.json(school);
  } catch (error) {
    logger.error('Error creating school:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
