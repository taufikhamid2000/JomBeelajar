import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getSchools } from '@/lib/jombeelajar-api';

export async function GET() {
  try {
    // School rankings + per-school stats come from JomBeelajar API now. Growth rates
    // still read school_stats_history directly — JomBeelajar API excluded that table
    // (it's a single platform-wide time series, not per-school, so it
    // doesn't fit their schools domain).
    const [mqSchools, studentsResult, historyResult] = await Promise.all([
      getSchools(),
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_role', 'student'),
      supabase
        .from('school_stats_history')
        .select('*')
        .gte(
          'recorded_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('recorded_at', { ascending: false })
        .limit(1),
    ]);

    if (studentsResult.error) {
      throw new Error('Failed to fetch student count');
    }

    const schools = [...mqSchools]
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((school, index) => ({
        id: school.id,
        name: school.name,
        type: school.type,
        district: school.district || 'Unknown',
        state: school.state || 'Unknown',
        activeStudents: school.activeStudents || 0,
        averageScore: Math.round(school.averageScore * 10) / 10,
        participationRate: Math.round(school.participationRate * 10) / 10,
        rank: index + 1,
      }));

    const schoolCount = schools.length;
    const studentCount = studentsResult.count || 0;

    const withParticipation = schools.filter((s) => s.participationRate > 0);
    const averageParticipation =
      withParticipation.reduce((acc, s) => acc + s.participationRate, 0) /
      (withParticipation.length || 1);

    const lastMonthStats = historyResult.data?.[0];
    const growthRates = {
      schools:
        lastMonthStats?.schools_count > 0
          ? Math.round(
              ((schoolCount - lastMonthStats.schools_count) /
                lastMonthStats.schools_count) *
                1000
            ) / 10
          : 0,
      participation:
        lastMonthStats?.average_participation > 0
          ? Math.round(
              ((averageParticipation - lastMonthStats.average_participation) /
                lastMonthStats.average_participation) *
                1000
            ) / 10
          : 0,
      students:
        lastMonthStats?.students_count > 0
          ? Math.round(
              ((studentCount - lastMonthStats.students_count) /
                lastMonthStats.students_count) *
                1000
            ) / 10
          : 0,
    };

    return NextResponse.json(
      {
        data: schools,
        stats: {
          totalSchools: schoolCount,
          averageParticipation: Math.round(averageParticipation * 10) / 10,
          totalStudents: studentCount,
          growthRates,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error) {
    logger.error('Error in school leaderboard API:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
