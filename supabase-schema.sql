-- ============================================================
-- ProductivityOS — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Tasks
create table if not exists tasks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '',
  notes text default '',
  status text default 'inbox',
  priority text default 'medium',
  is_mit boolean default false,
  is_frog boolean default false,
  is_quick_win boolean default false,
  due_date text,
  scheduled_date text,
  category text default 'Other',
  tags jsonb default '[]',
  project_id text,
  created_at text,
  completed_at text
);

-- Projects
create table if not exists projects (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default '',
  created_at text
);

-- Habits
create table if not exists habits (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text default '',
  description text default '',
  frequency text default 'daily',
  custom_days jsonb default '[]',
  time_of_day text default 'anytime',
  stacked_after text,
  intention_time text,
  intention_location text,
  color text default '#6366f1',
  icon text default 'circle',
  completions jsonb default '[]',
  current_streak integer default 0,
  longest_streak integer default 0,
  created_at text
);

-- Notes
create table if not exists notes (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default 'Untitled',
  content text default '',
  tags jsonb default '[]',
  linked_notes jsonb default '[]',
  created_at text,
  updated_at text
);

-- Ideas
create table if not exists ideas (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  description text default '',
  category text default 'Other',
  reminder_date text,
  status text default 'active',
  created_at text
);

-- Transactions (money tracker)
create table if not exists transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric default 0,
  type text default 'expense',
  category text default 'Other',
  description text default '',
  date text,
  created_at text
);

-- Smoking / weed logs
create table if not exists smoking_logs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date text,
  time text default '',
  grams numeric default 0,
  created_at text
);

-- Calendar events
create table if not exists calendar_events (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  date text,
  start_time text default '09:00',
  end_time text default '10:00',
  type text default 'event',
  color text default '#6366f1',
  description text default '',
  idea_id text,
  created_at text
);

-- Pomodoro sessions
create table if not exists pomodoro_sessions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  linked_task_id text,
  duration integer default 25,
  completed_at text,
  date text
);

-- Time blocks
create table if not exists time_blocks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  start_time text,
  end_time text,
  date text,
  color text default '#6366f1',
  task_id text
);

-- User settings (scalars: pomodoro durations, etc.)
create table if not exists user_settings (
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value jsonb,
  primary key (user_id, key)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table tasks enable row level security;
alter table projects enable row level security;
alter table habits enable row level security;
alter table notes enable row level security;
alter table ideas enable row level security;
alter table transactions enable row level security;
alter table smoking_logs enable row level security;
alter table calendar_events enable row level security;
alter table pomodoro_sessions enable row level security;
alter table time_blocks enable row level security;
alter table user_settings enable row level security;

-- Each user can only read/write their own rows
create policy "own_tasks"             on tasks             for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_projects"          on projects          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_habits"            on habits            for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_notes"             on notes             for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_ideas"             on ideas             for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_transactions"      on transactions      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_smoking_logs"      on smoking_logs      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_calendar_events"   on calendar_events   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_pomodoro_sessions" on pomodoro_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_time_blocks"       on time_blocks       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_user_settings"     on user_settings     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  username        text unique not null,
  theme           text default 'matrix',
  custom_theme    jsonb,
  enabled_modules text[] default array['tasks','notes','ideas','habits','pomodoro','money','smoking'],
  is_admin        boolean default false,
  status          text default 'pending',   -- 'pending' | 'approved' | 'rejected'
  created_at      timestamptz default now()
);

-- ─── Admin helper (SECURITY DEFINER bypasses RLS) ────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ─── Profiles RLS ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;
create policy "profile_read"   on profiles for select using (auth.uid() = id or is_admin());
create policy "profile_insert" on profiles for insert with check (auth.uid() = id);
create policy "profile_update" on profiles for update using (auth.uid() = id or is_admin());
