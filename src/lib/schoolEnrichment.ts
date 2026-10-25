import { getSchoolDetail } from './jombeelajar-api';
import { logger } from './logger';

/**
 * Attaches a lightweight school summary to a user profile, sourced from
 * JomBeelajar API instead of a Supabase join (schools/school_stats are retired).
 * Used by both /api/profile and /api/profile/[userId].
 */
export async function attachSchool<T extends { school_id?: string | null }>(
  profile: T
): Promise<
  T & {
    school: {
      id: string;
      name: string;
      type: string;
      district: string;
      state: string;
    } | null;
  }
> {
  if (!profile.school_id) {
    return { ...profile, school: null };
  }

  try {
    const school = await getSchoolDetail(profile.school_id);
    return {
      ...profile,
      school: {
        id: school.id,
        name: school.name,
        type: school.type,
        district: school.district,
        state: school.state,
      },
    };
  } catch (err) {
    logger.error('Error fetching school for profile:', err);
    return { ...profile, school: null };
  }
}
