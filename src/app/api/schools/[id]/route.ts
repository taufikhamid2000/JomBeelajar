import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  getSchoolDetail,
  updateSchool,
  deleteSchool,
  SCHOOL_TYPES,
} from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let school;
    try {
      school = await getSchoolDetail(id);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        return NextResponse.json({ error: 'School not found' }, { status: 404 });
      }
      throw err;
    }

    // teacherCount/studentCount are live counts from user_profiles, which
    // JomBeelajar API's schools domain doesn't own (school_id/school_role linkage
    // stays on Supabase) — these two queries are NOT part of the retirement.
    const { count: teacherCount, error: teacherError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', id)
      .eq('school_role', 'teacher');

    if (teacherError) {
      logger.error('Error fetching teacher count:', teacherError);
    }

    const { count: studentCount, error: studentError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', id)
      .eq('school_role', 'student');

    if (studentError) {
      logger.error('Error fetching student count:', studentError);
    }

    return NextResponse.json({
      ...school,
      teacherCount: teacherCount || 0,
      studentCount: studentCount || 0,
    });
  } catch (error) {
    logger.error('Error in school profile API:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (type && !SCHOOL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${SCHOOL_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const school = await updateSchool(
      id,
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
    logger.error('Error updating school:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteSchool(id, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting school:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
