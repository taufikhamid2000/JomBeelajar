-- SECURITY C1: edubridge.answers was writable by any session incl. anonymous. Writes now admin-only.
drop policy if exists "Allow answer management for authenticated" on edubridge.answers;
create policy "answers_admin_write" on edubridge.answers
  for all to authenticated
  using ((select edubridge.is_current_user_admin()))
  with check ((select edubridge.is_current_user_admin()));
