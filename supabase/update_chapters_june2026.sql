-- ============================================================
-- June 2026 Chapter Status Update
-- Run this in Supabase SQL Editor > New Query
-- ============================================================

-- 1. Pampanga — declined due to institutional leadership change
UPDATE chapters SET
  status           = 'declined',
  date_iso         = NULL,
  date_text        = 'Declined — Jun 2026',
  countdown_text   = 'Declined',
  progress_percent = 0,
  updated_at       = now()
WHERE id = 'pampanga';

-- Add a task documenting the reason and next step
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'PMP-decline',
  'pampanga',
  'Nicole',
  'PMP declined: school undergoing leadership transition (new president), compressed 4-week summer schedule — find new host school for next run',
  'pending'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- 2. Tacloban — removed from official 5 code camp slots, reclassified as applicant chapter
UPDATE chapters SET
  status         = 'applicant',
  date_text      = 'Applicant Chapter — Date TBD',
  date_iso       = NULL,
  countdown_text = 'Applicant',
  updated_at     = now()
WHERE id = 'tacloban';

-- Note the reason for TCL removal
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'TCL-removed',
  'tacloban',
  'HQ',
  'TCL removed from official 5 code camp slots: President on AWOL and no update after several follow-ups. TCL reclassified as applicant chapter.',
  'pending'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- 3. CDO — probable 5th slot (all details tentative, date_iso NULL so no checklist deadlines fire)
INSERT INTO chapters (
  id, number, name, city, region, venue, lead_name,
  date_text, date_iso, status, color,
  progress_percent, pax_target, countdown_text, merch_status
)
VALUES (
  'cdo',
  '6',
  'CDO',
  'Cagayan de Oro',
  'Northern Mindanao',
  'DICT Region X Training Center (tentative)',
  'Kenshin',
  'Jul 4, 2026 (tentative)',
  NULL,
  'tbc',
  'blue',
  0,
  40,
  'TBD',
  'TBC'
)
ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  city         = EXCLUDED.city,
  venue        = EXCLUDED.venue,
  lead_name    = EXCLUDED.lead_name,
  date_text    = EXCLUDED.date_text,
  date_iso     = EXCLUDED.date_iso,
  pax_target   = EXCLUDED.pax_target,
  status       = EXCLUDED.status,
  updated_at   = now();

-- Single CDO follow-up task for Nicole (upsert to avoid duplicates)
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'CDO-t1',
  'cdo',
  'Nicole',
  'Follow up with Kenshin — CDO details all tentative: venue DICT Region X Training Center, date Jul 4 2026, BYOD setup, 30–40 pax (single classroom). Confirm for official 5th slot.',
  'urgent'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- Remove any duplicate CDO tasks created without a short_id
DELETE FROM chapter_tasks
WHERE chapter_id = 'cdo' AND short_id IS NULL;

-- 4. Laguna — post-report submitted, progress updated to 90%
UPDATE chapters SET
  progress_percent = 90,
  updated_at       = now()
WHERE id = 'laguna';

-- 5. Update the KPI label to reflect the changes
UPDATE kpis SET
  label      = 'Committed Code Camps',
  sublabel   = 'PMP declined · CDO probable 5th slot (Jul 4, tentative) · TCL applicant',
  updated_at = now()
WHERE key = 'code_camps';
