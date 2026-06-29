-- Add Legazpi as Plan C candidate for 5th Code Camp slot
-- Run each block separately in Supabase SQL Editor if needed

-- Step 1: Insert Legazpi chapter
INSERT INTO chapters (
  id, number, name, city, region, venue, lead_name,
  date_text, date_iso, status, color,
  progress_percent, pax_target, countdown_text, merch_status
)
VALUES (
  'legazpi',
  '-',
  'Legazpi',
  'Legazpi',
  'Bicol Region',
  'TBD',
  'TBD (w/ JP)',
  'TBD - Plan C for 5th slot',
  NULL,
  'tbc',
  'teal',
  0,
  NULL,
  'TBD',
  'TBC'
)
ON CONFLICT (id) DO UPDATE SET
  name             = EXCLUDED.name,
  city             = EXCLUDED.city,
  region           = EXCLUDED.region,
  venue            = EXCLUDED.venue,
  lead_name        = EXCLUDED.lead_name,
  date_text        = EXCLUDED.date_text,
  date_iso         = EXCLUDED.date_iso,
  status           = EXCLUDED.status,
  updated_at       = now();

-- Step 2: Add Legazpi follow-up task
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'LGZ-t1',
  'legazpi',
  'Nicole',
  'Legazpi plan C w/ JP - confirm venue, date, lead for 5th code camp slot in July.',
  'urgent'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- Step 3: Add CDO update task
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'CDO-t2',
  'cdo',
  'Nicole',
  'CDO not moving - cannot close a single classroom venue. If no progress by Mon Jun 30, pivot to Legazpi (plan C). If CDO drops, ask CDO to ship merch.',
  'urgent'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();
