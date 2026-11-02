-- SECURITY C2: edubridge.questions was writable by any session incl. anonymous. Writes now admin-only.
drop policy if exists "Allow question management for authenticated" on edubridge.questions;
create policy "questions_admin_write" on edubridge.questions
  for all to authenticated
  using ((select edubridge.is_current_user_admin()))
  with check ((select edubridge.is_current_user_admin()));
