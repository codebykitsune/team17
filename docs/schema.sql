-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Events Table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  amount integer not null default 0,
  hash text not null unique,
  confirmed_date timestamptz,
  restaurant_info jsonb,
  target_station text, -- Optimization: Store calculated midpoint station
  target_lat double precision, -- Optimization: Store calculated midpoint coordinates
  target_lng double precision, -- Optimization: Store calculated midpoint coordinates
  created_at timestamptz default now()
);

-- 2. Users Table
-- Create enum if it doesn't exist
do $$ begin
    create type user_role as enum ('organizer', 'participant');
exception
    when duplicate_object then null;
end $$;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  role user_role not null default 'participant',
  nearest_station text,
  lat double precision, -- Optimization: Store coordinates
  lng double precision, -- Optimization: Store coordinates
  created_at timestamptz default now()
);

-- 3. Schedules Table
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date timestamp not null,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_events_hash on public.events(hash);
create index idx_users_event_id on public.users(event_id);
create index idx_schedules_user_id on public.schedules(user_id);

-- Row Level Security (RLS)
alter table public.events enable row level security;
alter table public.users enable row level security;
alter table public.schedules enable row level security;

-- Policy: Allow anonymous access (Public) for MVP
create policy "Public Access Events" on public.events for all using (true) with check (true);
create policy "Public Access Users" on public.users for all using (true) with check (true);
create policy "Public Access Schedules" on public.schedules for all using (true) with check (true);

-- Enable Realtime for all tables
-- Note: 'supabase_realtime' publication usually exists by default on Supabase.
-- If not, you might need 'create publication supabase_realtime;' first.
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.schedules;

-- RPC Function for Atomic Event Creation
create or replace function create_full_event(
  event_name text,
  amount integer,
  event_hash text,
  organizer_name text,
  organizer_station text,
  organizer_lat double precision,
  organizer_lng double precision,
  candidate_dates timestamp[]
) returns jsonb as $$
declare
  new_event_id uuid;
  new_user_id uuid;
  d timestamp;
begin
  -- 1. Create Event
  insert into public.events (name, amount, hash)
  values (event_name, amount, event_hash)
  returning id into new_event_id;

  -- 2. Create Organizer User
  insert into public.users (event_id, name, role, nearest_station, lat, lng)
  values (new_event_id, organizer_name, 'organizer', organizer_station, organizer_lat, organizer_lng)
  returning id into new_user_id;

  -- 3. Create Schedules (Candidate Dates)
  foreach d in array candidate_dates
  loop
    insert into public.schedules (user_id, date)
    values (new_user_id, d);
  end loop;

  return jsonb_build_object(
    'event_id', new_event_id,
    'user_id', new_user_id,
    'hash', event_hash
  );
end;
$$ language plpgsql;
