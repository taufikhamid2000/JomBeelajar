-- Tells Jom ID (public.jomid_my_apps(), owned by the JomID repo) whether the
-- signed-in user has used jombeelajar. jomid_my_apps() discovers every zero-arg
-- boolean function named jomid_joined_<app> and calls it, so this is all an
-- app needs to show up there. Not callable by clients directly.
create or replace function edubridge.jomid_joined_jombeelajar()
returns boolean
language sql stable set search_path = ''
as $$
  select exists (select 1 from edubridge.user_profiles where id = auth.uid())
$$;
revoke all on function edubridge.jomid_joined_jombeelajar() from public, anon, authenticated;
