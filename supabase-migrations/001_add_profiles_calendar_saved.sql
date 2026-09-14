-- Миграция: профили, календарные события и сохранённые активности

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text,
  level text,
  interests text[],
  goals text[],
  preferred_format text,
  created_at timestamptz not null default now()
);

create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  activity_id uuid references activities(id) on delete set null,
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  category text,
  link text,
  created_at timestamptz not null default now()
);

create table if not exists saved_activities (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  activity_id uuid not null references activities(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Индексы
create index if not exists idx_calendar_user_date on calendar_events(user_id, event_date);
create index if not exists idx_saved_user on saved_activities(user_id);

-- Примечание: выполните этот файл в SQL Editor Supabase, чтобы применить миграцию.
