-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Reset Database (Drop tables if they exist)
drop table if exists public.records cascade;
drop table if exists public.device_authorizations cascade;
drop table if exists public.geofences cascade;
drop table if exists public.users cascade;
-- Also drop potential Portuguese named tables from previous versions if they exist
drop table if exists public.registros cascade;
drop table if exists public.usuarios cascade;

-- Users Table
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null check (role in ('admin', 'funcionario')),
  works_saturday boolean default false,
  part_time boolean default false,
  work_start_time time,
  work_end_time time,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Device Authorizations Table (replaces device_ids array)
create table public.device_authorizations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  device_id text not null,
  device_name text,
  authorized_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, device_id)
);

-- Create index for faster device lookups
create index idx_device_authorizations_device_id on public.device_authorizations(device_id);
create index idx_device_authorizations_user_id on public.device_authorizations(user_id);

-- Geofences Table
create table public.geofences (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius double precision not null, -- in meters
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Records (Ponto) Table
create table public.records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  device_id text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  geofence_id uuid references public.geofences(id),
  record_type text check (record_type in ('entrada', 'saida')),
  location jsonb not null, -- {lat, lon, accuracy}
  ip text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic examples - refine based on auth needs)
alter table public.users enable row level security;
alter table public.device_authorizations enable row level security;
alter table public.geofences enable row level security;
alter table public.records enable row level security;

-- Allow public read/write for now (since we are using custom auth/device flow)
-- WARNING: In production, you should lock this down to only allow specific operations via functions or signed requests.
create policy "Allow public access" on public.users for all using (true);
create policy "Allow public access" on public.device_authorizations for all using (true);
create policy "Allow public access" on public.geofences for all using (true);
create policy "Allow public access" on public.records for all using (true);
