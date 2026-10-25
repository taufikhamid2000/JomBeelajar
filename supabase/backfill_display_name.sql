-- One-off backfill for null user_profiles.display_name (JomBeelajar API-provided,
-- reviewed). Prefers Google metadata; falls back to a non-identifying
-- "Player <first 4 of id>" handle. Never uses email local-parts.
-- Idempotent: only touches rows where display_name IS NULL.
--
-- Context: null display_name is a data gap (signup never sets it; only Profile
-- Settings does). It is NOT a privacy choice — the only identity control is
-- is_school_visible (hides the school, not the name), which this does not touch.
-- Dry run showed all current nulls hit the "Player ####" fallback (no Google
-- names present), so this publishes zero real names.

update public.user_profiles p
set display_name = coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      'Player ' || left(p.id::text, 4)
    ),
    updated_at = now()
from auth.users u
where p.id = u.id
  and p.display_name is null;

-- Verify (expect 0):
select count(*) as still_null
from public.user_profiles
where display_name is null;
