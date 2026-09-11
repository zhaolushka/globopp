-- Выполни этот файл целиком в Supabase: SQL Editor -> New query -> вставить -> Run

create extension if not exists "pgcrypto";

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  deadline timestamptz not null,
  remind_days_before int not null default 1,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id bigint unique not null,
  telegram_username text,
  subscribed_at timestamptz not null default now()
);

-- Включаем Row Level Security
alter table activities enable row level security;
alter table subscribers enable row level security;

-- Разрешаем ВСЕМ читать список активностей (публичная страница сайта)
create policy "activities are publicly readable"
  on activities for select
  using (true);

-- Запись/изменение/удаление активностей идёт только через серверный API
-- (service role key), поэтому отдельных policy на insert/update/delete
-- для анонимных пользователей не создаём — по умолчанию это запрещено.

-- Таблица subscribers не должна быть читаема с клиента вообще —
-- запись в неё тоже идёт только через серверный API (вебхук Telegram).
