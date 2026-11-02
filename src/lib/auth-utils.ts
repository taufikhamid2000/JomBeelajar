import { supabase } from './supabase';
import { logger } from './logger';
import { derivePermissions, type Permissions } from './permissions';

export { derivePermissions, FORBIDDEN_MESSAGE } from './permissions';
export type { Permissions } from './permissions';

/**
 * Checks the current user's admin-area permissions.
 *
 * `isAuthorized` means "may use the admin area at all" (admin, moderator, or a
 * teacher for school-scoped actions). Teachers get 403 from the API on
 * content-tree and achievement-catalog writes, so gate those UI actions on
 * `permissions.canManageContentTree` / `permissions.canManageAchievementCatalog`.
 */
export async function checkAdminPermission(): Promise<{
  isAuthorized: boolean;
  userId: string | null;
  role?: string;
  permissions?: Permissions;
}> {
  try {
    // Get current session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      logger.error('Error getting session:', sessionError);
      return { isAuthorized: false, userId: null };
    }

    const userId = sessionData.session.user.id;

    // Check user roles (from user_roles table). maybeSingle — most users
    // have no row here, which is expected, not an error.
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError) {
      // A genuine query error — treat conservatively as not-admin.
      return { isAuthorized: false, userId };
    }

    // school_role (teacher/admin) only matters when user_roles alone does not
    // already make the user platform staff.
    let schoolRole: string | null = null;
    if (!derivePermissions(roleData?.role, null).isPlatformStaff) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('school_role')
        .eq('id', userId)
        .maybeSingle();
      schoolRole = profileData?.school_role ?? null;
    }

    const permissions = derivePermissions(roleData?.role, schoolRole);
    const role = permissions.isAdmin
      ? 'admin'
      : permissions.isModerator
        ? 'moderator'
        : permissions.isTeacher
          ? 'teacher'
          : undefined;

    return {
      isAuthorized: permissions.canModerateOwnSchool,
      userId,
      role,
      permissions,
    };
  } catch (error) {
    logger.error('Error checking admin permission:', error);
    return { isAuthorized: false, userId: null };
  }
}
