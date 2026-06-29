-- ============================================================
-- Add Legazpi — Plan C candidate for 5th Code Camp slot
-- Run this in Supabase SQL Editor > New Query
-- June 29, 2026
-- ============================================================

-- 1. Insert Legazpi as a TBC candidate chapter
INSERT INTO chapters (
  id, number, name, city, region, venue, lead_name,
  date_text, date_iso, status, color,
  progress_percent, pax_target, countdown_text, merch_status
)
VALUES (
  'legazpi',
  '7',
  'Legazpi',
  'Legazpi',
  'Bicol Region',
  'TBD',
  'TBD (w/ JP)',
  'TBD · Plan C for 5th slot',
  NULL,
  'tbc',
  'teal',
  0,
  NULL,
  'TBD',
  'TBC'
)
ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  city         = EXCLUDED.city,
  region       = EXCLUDED.region,
  venue        = EXCLUDED.venue,
  lead_name    = EXCLUDED.lead_name,
  date_text    = EXCLUDED.date_text,
  date_iso     = EXCLUDED.date_iso,
  status       = EXCLUDED.status,
  updated_at   = now();

-- 2. Add a task for Legazpi follow-up
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'LGZ-t1',
  'legazpi',
  'Nicole',
  'Legazpi plan C w/ JP — confirm venue, date, lead for 5th code camp slot in July. Decision expected Mon Jun 30.',
  'urgent'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- 3. Update CDO task to reflect current situation (not moving)
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'CDO-t2',
  'cdo',
  'Nicole',
  'CDO not moving — cannot close a single classroom venue. If no progress by Mon Jun 30, pivot to Legazpi (plan C). If CDO drops, ask CDO to ship merch.',
  'urgent'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- 4. Update KPI sublabel to reflect Legazpi as candidate
UPDATE kpis SET
  sublabel   = 'PMP declined · CDO not moving (venue) · Legazpi plan C in play · decision Mon Jun 30',
  updated_at = now()
WHERE key = 'code_camps';
