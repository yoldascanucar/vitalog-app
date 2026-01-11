-- Drop table if exists to ensure clean slate with new columns
-- WARNING: This deletes existing data!
drop table if exists public.profiles;

-- Create a table for public profiles with extensive patient data
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  first_name text,
  last_name text,
  full_name text generated always as (first_name || ' ' || last_name) stored, -- computed info
  tc_no text, -- store masked or full based on requirement, usually encrypted in real apps
  birth_date date,
  gender text, -- 'Erkek', 'Kadın', 'Diğer'
  phone text,
  patient_id text unique, -- System generated ID e.g. PT-123456
  created_at timestamptz default now()
);

-- Turn on Row Level Security
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
