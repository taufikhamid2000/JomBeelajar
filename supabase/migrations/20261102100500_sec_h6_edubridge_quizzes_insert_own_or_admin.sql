drop policy if exists "Allow authenticated users to insert quizzes" on edubridge.quizzes;
create policy quizzes_insert_own_or_admin on edubridge.quizzes
  for insert to authenticated
  with check (
    (coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false'
      and created_by = (select auth.uid())::text)
    or (select edubridge.is_current_user_admin())
  );
