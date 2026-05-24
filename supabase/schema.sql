-- ============================================================
-- Sui × DEVCON HQ Tracker — Supabase Schema
-- Run this in Supabase SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- CHAPTERS
-- ────────────────────────────────────────────────────────────
create table if not exists chapters (
  id              text primary key,           -- e.g. 'manila', 'iloilo'
  number          text not null,              -- e.g. '1', '3A'
  name            text not null,
  city            text not null,
  region          text not null,
  venue           text not null,
  lead_name       text not null,
  date_text       text not null,              -- display string e.g. 'May 6, 2026'
  date_iso        date,                       -- null if TBD
  status          text not null default 'pending',
  color           text not null default 'blue',
  pax_target      integer,
  pax_actual      integer,
  merch_status    text not null default 'TBC',
  progress_percent integer not null default 0,
  countdown_text  text not null default 'TBD',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- CHAPTER TASKS
-- ────────────────────────────────────────────────────────────
create table if not exists chapter_tasks (
  id          uuid primary key default gen_random_uuid(),
  short_id    text unique,                        -- e.g. 'MNL-t1', 'TCL-t3'
  chapter_id  text references chapters(id) on delete cascade,
  owner       text not null,
  description text not null,
  status      text not null default 'pending',   -- 'pending' | 'done' | 'urgent'
  is_done     boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- KPIs  (editable numbers)
-- ────────────────────────────────────────────────────────────
create table if not exists kpis (
  id       uuid primary key default gen_random_uuid(),
  key      text unique not null,
  label    text not null,
  sublabel text not null default '',
  value    text not null,
  color    text not null default 'blue',    -- blue | teal | green | yellow | red
  updated_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- RISKS
-- ────────────────────────────────────────────────────────────
create table if not exists risks (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,               -- 'R1', 'R2' …
  title       text not null,
  description text not null,
  owner       text not null,
  chapter_tag text not null,
  severity    text not null default 'medium',  -- high | medium | low
  status      text not null default 'open',    -- open | resolved
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- CONTACTS
-- ────────────────────────────────────────────────────────────
create table if not exists contacts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  role            text not null,
  handle          text not null,
  team            text not null,   -- sui_foundation | chapter_lead | content_team
  chapter_number  text,
  emoji           text not null default '👤',
  note            text,
  created_at      timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- MERCH ITEMS
-- ────────────────────────────────────────────────────────────
create table if not exists merch_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  quantity     integer not null default 0,
  distribution text not null default '',
  status       text not null default 'pending',  -- received | confirmed | confirm | pending
  category     text not null default 'jcr',      -- jcr | lazada | shopee
  created_at   timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- RESOURCE LINKS
-- ────────────────────────────────────────────────────────────
create table if not exists resource_links (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null,
  url         text not null,
  icon        text not null default '🔗',
  icon_color  text not null default 'blue',
  category    text not null default 'operations',
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- BOT SETTINGS  (key-value config store)
-- ────────────────────────────────────────────────────────────
create table if not exists bot_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

-- Prevent duplicate logical rows on repeated seeds/imports
create unique index if not exists risks_code_unique_idx
  on risks ((upper(trim(code))));

create unique index if not exists merch_items_category_name_unique_idx
  on merch_items ((lower(trim(category))), (lower(trim(name))));

create unique index if not exists contacts_identity_unique_idx
  on contacts (
    (lower(trim(name))),
    (lower(trim(role))),
    (lower(trim(handle))),
    (lower(trim(team))),
    (coalesce(chapter_number, ''))
  );

create unique index if not exists resource_links_identity_unique_idx
  on resource_links (
    (lower(trim(name))),
    (lower(trim(url))),
    (lower(trim(category)))
  );

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (public read, authenticated write)
-- ────────────────────────────────────────────────────────────
alter table bot_settings   enable row level security;
alter table chapters       enable row level security;
alter table chapter_tasks  enable row level security;
alter table kpis           enable row level security;
alter table risks          enable row level security;
alter table contacts       enable row level security;
alter table merch_items    enable row level security;
alter table resource_links enable row level security;

-- Allow anonymous read on all tables
create policy "Public read bot_settings"   on bot_settings   for select using (true);
create policy "Public read chapters"       on chapters       for select using (true);
create policy "Public read chapter_tasks"  on chapter_tasks  for select using (true);
create policy "Public read kpis"           on kpis           for select using (true);
create policy "Public read risks"          on risks          for select using (true);
create policy "Public read contacts"       on contacts       for select using (true);
create policy "Public read merch_items"    on merch_items    for select using (true);
create policy "Public read resource_links" on resource_links for select using (true);

-- Allow authenticated users to insert/update/delete
create policy "App write bot_settings"    on bot_settings   for all using (auth.role() in ('anon', 'authenticated')) with check (auth.role() in ('anon', 'authenticated'));
create policy "Auth write chapters"       on chapters       for all using (auth.role() = 'authenticated');
create policy "Auth write chapter_tasks"  on chapter_tasks  for all using (auth.role() = 'authenticated');
create policy "Auth write kpis"           on kpis           for all using (auth.role() = 'authenticated');
create policy "Auth write risks"          on risks          for all using (auth.role() = 'authenticated');
create policy "Auth write contacts"       on contacts       for all using (auth.role() = 'authenticated');
create policy "Auth write merch_items"    on merch_items    for all using (auth.role() = 'authenticated');
create policy "Auth write resource_links" on resource_links for all using (auth.role() = 'authenticated');
