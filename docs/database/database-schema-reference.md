# Database Schema Understanding for JomBeelajar

## Database Structure

Based on your complete schema information, we now understand the hierarchical structure of your educational content:

```
subjects → chapters → topics → quizzes
```

Each level relates to the next through foreign keys:

- Chapters have a `subject_id` referencing subjects
- Topics have a `chapter_id` referencing chapters
- Quizzes have a `topic_id` referencing topics

## Database Tables and Relationships

### Subjects Table

```sql
create table public.subjects (
  id uuid not null default extensions.uuid_generate_v4(),
  name text not null,
  slug text not null,
  description text null,
  icon text null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  order_index integer null default 0,
  category text null,
  category_priority integer null default 999,
  constraint subjects_pkey primary key (id),
  constraint subjects_slug_key unique (slug),
  constraint subjects_slug_unique unique (slug)
);
```

### Chapters Table

```sql
create table public.chapters (
  id uuid not null default extensions.uuid_generate_v4(),
  subject_id uuid null,
  form integer not null,
  title text not null,
  topics text[] null,
  order_index integer not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint chapters_pkey primary key (id),
  constraint chapters_subject_id_fkey foreign KEY (subject_id) references subjects (id)
);

create index idx_chapters_subject_id on public.chapters using btree (subject_id);
```

### Topics Table

```sql
create table public.topics (
  id uuid not null default extensions.uuid_generate_v4(),
  chapter_id uuid null,
  title text not null,
  description text null,
  difficulty_level integer null,
  time_estimate_minutes integer null,
  order_index integer not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint topics_pkey primary key (id),
  constraint topics_chapter_id_fkey foreign KEY (chapter_id) references chapters (id) on delete CASCADE,
  constraint topics_difficulty_level_check check ((difficulty_level >= 1) and (difficulty_level <= 5))
);

create index idx_topics_chapter_id on public.topics using btree (chapter_id);
```

### Quizzes Table

```sql
create table public.quizzes (
  id uuid not null default extensions.uuid_generate_v4(),
  topic_id uuid not null,
  name text not null,
  created_by text not null,
  created_at timestamp with time zone null default timezone('utc'::text, now()),
  verified boolean null default false,
  constraint quizzes_pkey primary key (id),
  constraint quizzes_topic_id_fkey foreign KEY (topic_id) references topics (id) on delete CASCADE
);

create index idx_quizzes_topic_id on public.quizzes using btree (topic_id);
```

## Implementation

We've implemented a solution that:

1. Fetches all subjects
2. For each subject, gets its chapters
3. For each chapter, counts its topics
4. For each topic, counts its quizzes
5. Aggregates these counts back to the subject level

This approach correctly traverses the relationship chain in your database schema.

## Future Optimizations

For better performance as data grows, consider:

### 1. Using PostgreSQL Stored Procedures

Create a stored procedure to get all subjects with their counts in one query:

```sql
CREATE OR REPLACE FUNCTION get_subject_stats_with_counts()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  topic_count bigint,
  quiz_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.description,
    COUNT(DISTINCT t.id) as topic_count,
    COUNT(DISTINCT q.id) as quiz_count
  FROM subjects s
  LEFT JOIN chapters c ON c.subject_id = s.id
  LEFT JOIN topics t ON t.chapter_id = c.id
  LEFT JOIN quizzes q ON q.topic_id = t.id
  GROUP BY s.id, s.name, s.description;
END;
$$ LANGUAGE plpgsql;
```

Then call it using:

```typescript
const { data, error } = await supabase.rpc('get_subject_stats_with_counts');
```

### 2. Creating a Database View

Create a view to flatten the relationship structure:

```sql
CREATE VIEW subject_stats AS
SELECT
  s.id,
  s.name,
  s.description,
  COUNT(DISTINCT t.id) as topic_count,
  COUNT(DISTINCT q.id) as quiz_count
FROM subjects s
LEFT JOIN chapters c ON c.subject_id = s.id
LEFT JOIN topics t ON t.chapter_id = c.id
LEFT JOIN quizzes q ON q.topic_id = t.id
GROUP BY s.id, s.name, s.description;
```

Then query from that view:

```typescript
const { data, error } = await supabase.from('subject_stats').select('*');
```
