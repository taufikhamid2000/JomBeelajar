-- Security audit M5 / advisor function_search_path_mutable: pin search_path on trigger
-- helpers that only touch NEW/now() (no object lookups), so any fixed path is equivalent.
alter function edubridge.handle_updated_at()        set search_path = edubridge, public, extensions, pg_temp;
alter function edubridge.update_updated_at_column() set search_path = edubridge, public, extensions, pg_temp;
