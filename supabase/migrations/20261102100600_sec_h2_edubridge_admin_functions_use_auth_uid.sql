-- Admin functions bind the caller-supplied admin id to auth.uid() and require admin.
create or replace function edubridge.verify_quiz(quiz_id_param uuid, admin_user_id_param uuid, reason_param text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or admin_user_id_param is distinct from (select auth.uid()) or not edubridge.is_current_user_admin() then
    raise exception 'Only admins can verify quizzes';
  end if;
  update edubridge.quizzes set verified = true, updated_at = now() where id = quiz_id_param;
  insert into edubridge.quiz_verification_log (quiz_id, admin_user_id, action, reason) values (quiz_id_param, (select auth.uid()), 'verified', reason_param);
  return true;
end; $$;

create or replace function edubridge.unverify_quiz(quiz_id_param uuid, admin_user_id_param uuid, reason_param text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or admin_user_id_param is distinct from (select auth.uid()) or not edubridge.is_current_user_admin() then
    raise exception 'Only admins can unverify quizzes';
  end if;
  update edubridge.quizzes set verified = false, updated_at = now() where id = quiz_id_param;
  insert into edubridge.quiz_verification_log (quiz_id, admin_user_id, action, reason) values (quiz_id_param, (select auth.uid()), 'unverified', reason_param);
  return true;
end; $$;

create or replace function edubridge.log_admin_action(admin_id uuid, action text, entity_type text, entity_id text, details jsonb default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare log_id uuid;
begin
  if (select auth.uid()) is null or admin_id is distinct from (select auth.uid()) or not edubridge.is_current_user_admin() then
    raise exception 'User is not an admin';
  end if;
  insert into edubridge.admin_logs (admin_id, action, entity_type, entity_id, details)
  values ((select auth.uid()), action, entity_type, entity_id, details) returning id into log_id;
  return log_id;
end; $$;

create or replace function edubridge.log_admin_action(action_type text, action_details jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not edubridge.is_current_user_admin() then raise exception 'User is not an admin'; end if;
  insert into edubridge.admin_logs (admin_id, action, details) values ((select auth.uid()), action_type, action_details);
end; $$;

revoke execute on all functions in schema edubridge from public, anon;
grant execute on all functions in schema edubridge to authenticated, service_role;
grant execute on function edubridge.get_random_quiz() to anon;
grant execute on function edubridge.get_random_topic() to anon;
grant execute on function edubridge.get_random_quizzes(integer) to anon;
grant execute on function edubridge.get_random_verified_quizzes(integer) to anon;
revoke execute on function edubridge.create_sample_leaderboard_data() from authenticated;
revoke execute on function edubridge.create_sample_leaderboard_data(integer) from authenticated;
alter default privileges in schema edubridge revoke execute on functions from public, anon;
