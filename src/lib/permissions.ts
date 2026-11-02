/**
 * Pure permission helpers (no Supabase / server imports, safe anywhere).
 *
 * Mirrors JomBeelajar-API docs/AUTHORIZATION.md:
 *  - Platform staff = admin (user_roles / school_role 'admin') or
 *    user_roles.moderator. They are unscoped.
 *  - Teachers (school_role 'teacher', no admin/moderator role) may verify,
 *    edit, comment, add questions and award achievements ONLY within their own
 *    school, but get 403 on writes to the subject/chapter/topic tree and the
 *    achievement catalog (they can still read /content-tree).
 */

export const FORBIDDEN_MESSAGE =
  "You don't have permission to do that. Only admins and moderators can edit the subject/chapter/topic tree and the achievement catalog.";

export interface Permissions {
  isAdmin: boolean;
  isModerator: boolean;
  isTeacher: boolean;
  /** Platform admin or moderator: unscoped moderation. */
  isPlatformStaff: boolean;
  /** Create/edit/delete subjects, chapters and topics. */
  canManageContentTree: boolean;
  /** Create/edit/delete achievement catalog entries. */
  canManageAchievementCatalog: boolean;
  /** Verify/edit/comment/award, limited to the user's own school for teachers. */
  canModerateOwnSchool: boolean;
}

/**
 * @param userRole      user_roles.role (may be null/undefined)
 * @param schoolRole    user_profiles.school_role (may be null/undefined)
 */
export function derivePermissions(
  userRole?: string | null,
  schoolRole?: string | null
): Permissions {
  const role = (userRole || '').toLowerCase();
  const school = (schoolRole || '').toLowerCase();

  // school_role 'admin' remains a platform admin (API behaviour unchanged).
  const isAdmin = role.includes('admin') || school === 'admin';
  const isModerator = role === 'moderator';
  const isTeacher = school === 'teacher' && !isAdmin && !isModerator;
  const isPlatformStaff = isAdmin || isModerator;

  return {
    isAdmin,
    isModerator,
    isTeacher,
    isPlatformStaff,
    canManageContentTree: isPlatformStaff,
    canManageAchievementCatalog: isPlatformStaff,
    canModerateOwnSchool: isPlatformStaff || isTeacher,
  };
}
