import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SchoolProfileContent from '@/components/schools/SchoolProfileContent';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getSchoolDetail } from '@/lib/myquiza';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const school = await getSchoolDetail(id);

    return {
      title: `${school.name} | JomBeelajar`,
      description: `View ${school.name}'s performance and statistics on JomBeelajar`,
    };
  } catch (error) {
    logger.error('Error generating metadata:', error);
    return {
      title: 'School Profile | JomBeelajar',
      description: 'View school performance and statistics on JomBeelajar',
    };
  }
}

// Fetches everything the profile page shows. notFound() for unknown schools.
async function loadSchoolProfile(id: string) {
  let school;
  try {
    school = await getSchoolDetail(id);
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      notFound();
    }
    throw err;
  }

  // teacherCount/studentCount/topStudents come from user_profiles
  // (school_id/school_role linkage), which MyQuiza's schools domain
  // doesn't own — these stay on Supabase.
  const { count: teacherCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', id)
    .eq('school_role', 'teacher');

  const { count: studentCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', id)
    .eq('school_role', 'student');

  const { data: topStudents } = await supabase
    .from('user_profiles')
    .select(
      `
      id,
      full_name,
      total_points,
      total_correct_answers,
      total_quizzes_completed
    `
    )
    .eq('school_id', id)
    .eq('school_role', 'student')
    .order('total_points', { ascending: false })
    .limit(5);

  const schoolData = {
    id: school.id,
    name: school.name,
    type: school.type,
    district: school.district,
    state: school.state,
    code: school.code ?? undefined,
    address: school.address ?? undefined,
    website: school.website ?? undefined,
    phone: school.phone ?? undefined,
    principal_name: school.principalName ?? undefined,
    total_students: school.totalStudents ?? undefined,
    created_at: '',
    updated_at: '',
    stats: {
      school_id: school.id,
      average_score: school.averageScore,
      participation_rate: school.participationRate,
      total_quizzes_taken: school.stats?.totalQuizzesTaken || 0,
      total_questions_answered: school.stats?.totalQuestionsAnswered || 0,
      correct_answers: school.stats?.correctAnswers || 0,
      last_calculated_at: school.stats?.lastCalculatedAt || '',
    },
    teacherCount: teacherCount || 0,
    studentCount: studentCount || 0,
    topStudents: topStudents || [],
  };

  return schoolData;
}

export default async function SchoolProfilePage({ params }: Props) {
  let school;
  try {
    const { id } = await params;
    school = await loadSchoolProfile(id);
  } catch (error) {
    logger.error('Error in SchoolProfilePage:', error);
    throw error;
  }

  return <SchoolProfileContent school={school} />;
}
